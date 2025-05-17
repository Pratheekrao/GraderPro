import requests
import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

@csrf_exempt
def evaluate_answer(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        data = json.loads(request.body)
        exam_type = data.get('exam_type')  # optional, can be used in prompt if needed
        subject = data.get('subject')      # optional, can be used in prompt if needed
        questions = data.get('questions')
        total = data.get('total')  # optional, can be used in prompt if needed
        if not questions or not isinstance(questions, list):
            return JsonResponse({'error': 'Missing or invalid "questions" array'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Invalid JSON payload', 'details': str(e)}, status=400)

    results = []

    for idx, q in enumerate(questions):
        question = q.get('question')
        answer = q.get('answer')
        total_marks = total

        if not all([question, answer, total_marks]):
            results.append({
                'index': idx,
                'error': 'Missing one or more required fields (question, answer, total_marks)'
            })
            continue

        try:
            total_marks = int(total_marks)
        except ValueError:
            results.append({
                'index': idx,
                'error': 'total_marks must be an integer'
            })
            continue

        prompt = ""  # Add any specific prompt text here if needed, or pass from client

        full_prompt = f"""
{prompt}

Question: {question}
Answer: {answer}
Evaluate this answer out of {total_marks} marks and justify the score. Be conservative in your scoring.
Respond in JSON format:
{{
    "score": <numeric_score>,
    "feedback": "<your_feedback>"
}}
"""

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama3-70b-8192",
            "messages": [{"role": "user", "content": full_prompt}]
        }

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30
            )
        except requests.RequestException as e:
            results.append({
                'index': idx,
                'error': f'Groq API request failed: {str(e)}'
            })
            continue

        if response.status_code != 200:
            try:
                error_details = response.json()
            except Exception:
                error_details = response.text
            results.append({
                'index': idx,
                'error': 'Groq API error',
                'details': error_details,
                'status_code': response.status_code
            })
            continue

        try:
            content = response.json()['choices'][0]['message']['content']
            # Extract JSON from the content (using regex)
            json_str_match = re.search(r'\{.*\}', content, re.DOTALL)
            if not json_str_match:
                results.append({
                    'index': idx,
                    'error': 'Model response not in expected JSON format',
                    'response': content
                })
                continue

            json_str = json_str_match.group(0)
            result = json.loads(json_str)
            results.append({
                'index': idx,
                'score': result.get('score'),
                'feedback': result.get('feedback')
            })
        except Exception as e:
            results.append({
                'index': idx,
                'error': 'Failed to parse model response',
                'details': str(e),
                'response': content if 'content' in locals() else None
            })

    return JsonResponse({'results': results})
