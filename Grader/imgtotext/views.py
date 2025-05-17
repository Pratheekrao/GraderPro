import base64
import logging
import requests
import re

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
from pymongo import MongoClient
import json

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Setup MongoDB client (ensure this is created once globally)
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['GraderPro']
questions_collection = db['QuestionPaper']


def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode("utf-8")


def get_question_text_from_db(subject, exam_type, qno):
    doc = questions_collection.find_one({"subject": subject, "exam_type": exam_type})
    if doc and 'questions' in doc:
        for question in doc['questions']:
            if question.get('qno') == int(qno):
                return question.get('question')
            
    # return f"{subject} {exam_type} question {qno}"


def parse_and_add_questions(extracted_text, subject, exam_type):
    question_blocks = re.split(r'## Question\d+:', extracted_text)
    question_numbers = re.findall(r'## Question(\d+):', extracted_text)
    
    result = []
    for i, qno in enumerate(question_numbers):
        text = question_blocks[i+1].strip() if i+1 < len(question_blocks) else ""
        answer_parts = [part.strip() for part in text.split('\n\n') if part.strip()]

        question_text = get_question_text_from_db(subject, exam_type, qno)

        result.append({
            "qno": int(qno),
            "question": question_text,
            "answer": answer_parts
        })

    return result


def extract_text_from_images(base64_images):
    client = Groq(api_key=settings.GROQ_API_KEY)

    prompt = (
        "Extract only the visible text from these images, and organize it by question number.\n"
        "- Identify each question based on its number (e.g., Q1, 1., 2., etc.).\n"
        "- Group each answer under its respective question number using clear headings like 'Question 1:', 'Question 2:', etc.\n"
        "- Do NOT generate or assume any new content—only extract what's actually visible in the image.\n"
        "- Correct any spelling mistakes.\n"
        "- Preserve logical structure (e.g., headings, bullet points, tables, equations) within each answer.\n"
        "- Use clean and consistent formatting so the output is both human-readable and machine-readable.\n"
        "- Ignore decorative elements, arrows, or icons unless they contain actual text.\n"
        "- Ensure each answer appears immediately after its corresponding question number."
    )

    message_content = [{"type": "text", "text": prompt}]
    for base64_img in base64_images:
        message_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{base64_img}"}
        })

    logger.info("Sending images to Groq API for text extraction...")

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": message_content}],
        temperature=0.2,
        top_p=1,
        stream=False
    )

    logger.info("Received response from Groq API.")
    return response.choices[0].message.content


def trigger_another_app(payload):
    """POST extracted data to another Django app"""
    try:
        logger.info(f"Triggering other app at {settings.OTHER_DJANGO_APP_URL} with payload.")
        response = requests.post(settings.OTHER_DJANGO_APP_URL, json=payload, timeout=10)
        logger.info(f"Received response from other app: status {response.status_code}")
        return response.status_code, response.text
    except requests.RequestException as e:
        logger.error(f"Error triggering other app: {e}")
        return 500, str(e)




def trigger_another_app2(payload):
    """POST extracted data to another Django app"""
    try:
        logger.info(f"Triggering other app at {settings.OTHER_APP_URL} with payload.")
        response = requests.post(settings.OTHER_APP_URL, json=payload, timeout=10)
        logger.info(f"Received response from other app: status {response.status_code}")
        return response.status_code, response.text
    except requests.RequestException as e:
        logger.error(f"Error triggering other app: {e}")
        return 500, str(e)

@csrf_exempt
def process_exam_images(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    exam_type = request.POST.get('exam_type')
    subject = request.POST.get('subject')
    image_files = request.FILES.getlist('images')
    total = request.POST.get('total')
    usn = request.POST.get('usn')

    if not exam_type or not subject:
        return JsonResponse({'error': 'Missing exam_type or subject'}, status=400)

    if not image_files:
        return JsonResponse({'error': 'No images provided'}, status=400)

    try:
        logger.info(f"Received {len(image_files)} images for subject={subject}, exam_type={exam_type}")
        
        base64_images = [encode_image(img) for img in image_files]
        
        extracted_text = extract_text_from_images(base64_images)
        logger.info(f"Extracted text length: {len(extracted_text)} characters")
        
        refined_payload = parse_and_add_questions(extracted_text, subject, exam_type)
        
        payload = {
            'exam_type': exam_type,
            'subject': subject,
            'total': total,
            'questions': refined_payload
        }
        
        logger.info(f"Payload prepared for forwarding: {payload}")

        status_code, response_text = trigger_another_app(payload)

        if status_code != 200:
            logger.error(f"Failed to notify other app, status: {status_code}, details: {response_text}")
            return JsonResponse({'error': 'Failed to notify other app', 'details': response_text}, status=status_code)

        logger.info("Processing and forwarding successful.")
        logger.info(f"Response text: {response_text}")

        # Parse the response from the first app (assuming it's JSON)
        try:
            response_data = json.loads(response_text)
            logger.info(f"Parsed response data: {response_data}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse response as JSON: {e}")
            response_data = {"results": []}
        
        # Format feedback in the expected structure
        feedback_list = []
        
        # Check if we have the refined_payload and response_data to work with
        if isinstance(response_data, dict) and "results" in response_data:
            results = response_data.get("results", [])
            
            for idx, result in enumerate(results):
                if not isinstance(result, dict):
                    continue
                
                # Find corresponding question from refined_payload if possible
                question_data = None
                qno = result.get("qno", idx + 1)
                
                for q in refined_payload:
                    if q.get("qno") == qno:
                        question_data = q
                        break
                
                # Get answer from question_data if available
                answer = ""
                if question_data and "answer" in question_data:
                    if isinstance(question_data["answer"], list):
                        answer = " ".join(question_data["answer"])
                    else:
                        answer = str(question_data["answer"])
                
                # Get question text
                question_text = result.get("question", "")
                if not question_text and question_data:
                    question_text = question_data.get("question", f"Question {qno}")
                
                # Create feedback item with all required fields
                feedback_item = {
                    "index": idx,
                    "qno": qno,
                    "question": question_text,
                    "answer": result.get("answer", answer),  # Use answer from result or from question_data
                    "feedback": result.get("feedback", ""),
                    "score": float(result.get("score", 0)),  # Convert to float to handle decimal scores
                    "total": int(result.get("total", total) if result.get("total") else total)  # Use question total or overall total
                }
                
                feedback_list.append(feedback_item)
        
        logger.info(f"Generated feedback list: {feedback_list}")
        
        # Create the payload with the properly formatted feedback
        student_payload = {
            'usn': usn,
            'subject': subject,
            'exam_type': exam_type,
            'feedback': feedback_list,
        }
        
        logger.info(f"Student payload: {student_payload}")
        
        status, student_log = trigger_another_app2(student_payload)
    
        if status != 200:
            logger.error(f"Failed to notify student app, status: {status}, details: {student_log}")
            return JsonResponse({'error': 'Failed to notify student app', 'details': student_log}, status=status)
        
        logger.info(f"Student log: {student_log}")

        return JsonResponse({'message': 'Processing successful', 'forwarded_response': response_text})

    except Exception as e:
        logger.exception(f"Unexpected error during processing: {e}")
        return JsonResponse({'error': 'Unexpected error', 'details': str(e)}, status=500)