from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import base64
import json
import re

# ✅ MongoDB Atlas URI (Replace this with your real URI)
MONGO_URI = "mongodb://localhost:27017"
client = MongoClient(MONGO_URI)

# MongoDB setup
db = client['student_db']
collection = db['students']

# Validate USN format
def validate_usn(usn):
    return re.match(r"^1RV22[A-Z]{3}\d+$", usn)

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
            paper_type = data['paper_type']
            marks = data['marks']
            feedback = data['feedback']  # Must be JSON object

            if not validate_usn(usn):
                return JsonResponse({'error': 'Invalid USN'}, status=400)

            field_path = f"subject.{subject}.{paper_type}"

            update = {
                "$set": {
                    field_path + ".Marks": marks,
                    field_path + ".feedback": feedback
                }
            }

            collection.update_one({"usn": usn}, update, upsert=True)
            return JsonResponse({"message": "Feedback and marks added"})

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

        section = student["subject"][subject].get(paper_type, {})
        return JsonResponse({
            "marks": section.get("Marks"),
            "feedback": section.get("feedback")
        })