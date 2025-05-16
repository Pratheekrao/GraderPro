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
        question = data.get('question')
        answer = data.get('answer')
        total_marks = data.get('total_marks')
        prompt = data.get('prompt')
    except Exception as e:
        return JsonResponse({'error': 'Invalid JSON payload', 'details': str(e)}, status=400)

    if not all([question, answer, total_marks, prompt]):
        return JsonResponse({'error': 'Missing one or more required fields'}, status=400)

    try:
        total_marks = int(total_marks)
    except:
        return JsonResponse({'error': 'total_marks must be an integer'}, status=400)

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

    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)

    if response.status_code != 200:
        try:
            error_details = response.json()
        except Exception:
            error_details = response.text
        return JsonResponse({'error': 'Groq API error', 'details': error_details}, status=response.status_code)

    try:
        content = response.json()['choices'][0]['message']['content']
        # Attempt to extract JSON part of the content
        json_str_match = re.search(r'\{.*\}', content, re.DOTALL)
        if not json_str_match:
            return JsonResponse({'error': 'Model response not in expected JSON format', 'response': content}, status=500)

        json_str = json_str_match.group(0)
        result = json.loads(json_str)
        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': 'Failed to parse model response', 'details': str(e), 'response': content}, status=500)