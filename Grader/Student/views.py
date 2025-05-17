from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import base64
import json
import re
import bcrypt

# ✅ MongoDB Atlas URI (Replace this with your real URI)
MONGO_URI = "mongodb://localhost:27017"
client = MongoClient(MONGO_URI)

# MongoDB setup
db = client['GraderPro']
collection = db['students']

# Validate USN format
def validate_usn(usn):
    return re.match(r"^1RV22[A-Z]{2}\d+$", usn)

@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        usn = data.get('usn')
        password = data.get('password')
    except (json.JSONDecodeError, KeyError):
        return JsonResponse({'error': 'Invalid request format'}, status=400)

    if not usn or not password:
        return JsonResponse({'error': 'USN and password required'}, status=400)

    if not validate_usn(usn):
        return JsonResponse({'error': 'Invalid USN format'}, status=400)

    # Find user and include password hash
    student = collection.find_one({"usn": usn}, {"_id": 0, "password": 1})
    if not student:
        return JsonResponse({'error': 'User not found'}, status=404)

    hashed_password = student.get("password")
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        return JsonResponse({'error': 'Incorrect password'}, status=401)

    return JsonResponse({
        "message": "Login successful",
        "usn": usn
    })

@csrf_exempt
def signup(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        usn = data.get('usn')
        password = data.get('password')
    except (json.JSONDecodeError, KeyError):
        return JsonResponse({'error': 'Invalid request format'}, status=400)

    # Basic validation
    if not usn or not password:
        return JsonResponse({'error': 'USN and password are required'}, status=400)

    if not validate_usn(usn):
        return JsonResponse({'error': 'Invalid USN format'}, status=400)

    # Check if user already exists
    if collection.find_one({"usn": usn}):
        return JsonResponse({'error': 'USN already registered'}, status=409)

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Insert into MongoDB
    collection.insert_one({
        "usn": usn,
        "password": hashed_password
    })

    return JsonResponse({"message": "Signup successful"}, status=201)

@csrf_exempt
def get_registered_subjects(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
    try:
        data = json.loads(request.body)
        usn = data.get('usn')

        if not usn:
            return JsonResponse({'error': 'USN is required'}, status=400)

        if not validate_usn(usn):
            return JsonResponse({'error': 'Invalid USN format'}, status=400)

        student = collection.find_one({"usn": usn}, {"_id": 0, "subject": 1})

        if not student or "subject" not in student:
            return JsonResponse({'subjects': []})  # Return empty list if no subjects

        subject_names = list(student["subject"].keys())

        return JsonResponse({'subjects': subject_names})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ---- Add or Get Paper (Image + Sem) ----
@csrf_exempt
def add_or_get_paper(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            usn = data['usn']
            subject = data['subject']
            paper_type = data['paper_type']  # CIE / SEE
            paper_base64 = data['paper']     # base64-encoded image
            sem = data['sem']

            if not validate_usn(usn):
                return JsonResponse({'error': 'Invalid USN'}, status=400)

            field_path = f"subject.{subject}.{paper_type}.Paper"
            sem_path = f"subject.{subject}.sem"

            # Append image to the Paper array
            update = {
                "$push": {field_path: paper_base64},
                "$set": {sem_path: sem}
            }

            collection.update_one({"usn": usn}, update, upsert=True)
            return JsonResponse({"message": "Paper image added to array"})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'GET':
        usn = request.GET.get("usn")
        subject = request.GET.get("subject")
        paper_type = request.GET.get("paper_type")

        if not validate_usn(usn):
            return JsonResponse({'error': 'Invalid USN'}, status=400)

        student = collection.find_one({"usn": usn}, {"_id": 0})
        if not student or "subject" not in student or subject not in student["subject"]:
            return JsonResponse({'error': 'Not found'}, status=404)

        paper_array = student["subject"][subject].get(paper_type, {}).get("Paper", [])
        sem = student["subject"][subject].get("sem")

        return JsonResponse({
            "paper": paper_array,
            "sem": sem
        })


# ---- Add or Get Feedback & Marks ----
@csrf_exempt
def add_or_get_feedback_marks(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            usn = data['usn']
            subject = data['subject']
            exam_type = data['exam_type']  # e.g., 'CIE' or 'SEE'
            
            # Get feedbacks from 'feedbacks' or 'results'
            feedbacks_raw = data.get('feedback')
# Only keep items that have 'question' and 'feedback'
            feedbacks = [
                {
                    'qno': item.get('index', 0) + 1,
                    'question': item['question'],
                    'feedback': item['feedback'],
                    'score': item.get('score', 0) ,
                    'total': int(item.get('total', 0))
                }
                for item in feedbacks_raw
                if 'question' in item and 'feedback' in item
            ]

            print("Processed Feedbacks >>>", feedbacks) # list of feedback dicts
            print("&&&&&&&&&&&&&&&&&")
            print(feedbacks)
            if not validate_usn(usn):
                return JsonResponse({'error': 'Invalid USN'}, status=400)
            if not isinstance(feedbacks, list):
                return JsonResponse({'error': 'feedbacks must be a list'}, status=400)

            # Find if a document already exists with the same usn, subject, and exam_type
            query = {
                "usn": usn,
                "subject": subject,
                "exam_type": exam_type
            }
            
            # Update or insert the document with the new feedbacks array
            update = {
                "$set": {
                    "usn": usn,
                    "subject": subject,
                    "exam_type": exam_type,
                    "feedbacks": feedbacks
                }
            }
            
            collection.update_one(query, update, upsert=True)
            return JsonResponse({"message": "Feedbacks added successfully"})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    elif request.method == 'GET':
        usn = request.GET.get("usn")
        subject = request.GET.get("subject")
        exam_type = request.GET.get("exam_type")

        if not validate_usn(usn):
            return JsonResponse({'error': 'Invalid USN'}, status=400)

        # Find the document matching the query criteria
        query = {
            "usn": usn,
            "subject": subject,
            "exam_type": exam_type
        }
        
        result = collection.find_one(query, {"_id": 0})
        if not result:
            return JsonResponse({'error': 'Not found'}, status=404)

        # Return the feedbacks array
        return JsonResponse({

            "feedbacks": result.get("feedback", [])
        })

