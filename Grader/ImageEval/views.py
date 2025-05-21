import os
import base64
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from groq import Groq

# Initialize Groq client using settings
client = Groq(api_key=settings.GROQ_API_KEY)

# Utility to encode image to base64
def encode_image(file_obj):
    return base64.b64encode(file_obj.read()).decode("utf-8")

@csrf_exempt
@require_POST
def diagram_evaluation_view(request):
    try:
        reference_image_file = request.FILES.get('reference_image')
        student_image_file = request.FILES.getlist('student_image')

        if not reference_image_file or not student_image_file:
            return JsonResponse({"error": "Both 'reference_image' and 'student_image' are required."}, status=400)

        # --- Stage 1: Get Reference Description ---
        ref_base64 = encode_image(reference_image_file)

        ref_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this diagram in detail. Mention all key components, labels, and structure."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{ref_base64}"}}
                    ]
                }
            ],
            temperature=1,
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )
        reference_description = ref_completion.choices[0].message.content

        # --- Stage 2: Evaluate Student Diagram ---
        student_base64 = encode_image(student_image_file)

        eval_prompt = f"""
        Reference Description:
        {reference_description}

        You are an expert AI diagram evaluator. Your task is to **strictly evaluate** the student’s diagram against the reference description above.

        🎯 Focus on:
        - Presence, structure, and correctness of core components
        - Logical layout and accurate connections
        - Correct and complete labeling

        🚫 Ignore:
        - Visual style, colors, neatness, decorations

        📉 Scoring:
        Be conservative, deduct points for any issue.

        🔢 Round scores UP to whole numbers.

        📊 Output exactly like:
        Correctness: <1-5>
        Completeness: <1-5>
        Labeling: <1-5>
        Final Score: <1-5>

        Summary:
        <Short summary of evaluation>
        """

        eval_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": eval_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{student_base64}"}}
                    ]
                }
            ],
            temperature=1,
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )

        evaluation_result = eval_completion.choices[0].message.content

        # Return as JSON
        return JsonResponse({
            "reference_description": reference_description,
            "evaluation_result": evaluation_result
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
