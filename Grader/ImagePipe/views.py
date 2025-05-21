import base64
import os
import re
from dotenv import load_dotenv
from groq import Groq
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

load_dotenv()
os.environ['GROQ_API_KEY']=settings.GROQ_API_KEY
client = Groq()

# Utility to encode image to base64
def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode("utf-8")

# -------------------------------
# Main Diagram Evaluation View
# -------------------------------
@csrf_exempt
@require_POST
def evaluate_diagram_view(request):
    try:
        # Load files from request
        reference_image = request.FILES.get("reference_image")
        student_images = [request.FILES.get(f"student_image{i}") for i in range(1, 6)]

        if not reference_image or not all(student_images):
            return JsonResponse({"error": "All 6 images (1 reference and 5 student pages) are required."}, status=400)

        # -------------------------------
        # Step 1: Generate Reference Description
        # -------------------------------
        reference_base64 = encode_image(reference_image)
        ref_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this diagram in detail. Mention all key components, labels, and structure."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{reference_base64}"}}
                    ]
                }
            ],
            temperature=1,
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )
        reference_description = ref_completion.choices[0].message.content

        # -------------------------------
        # Step 2: Evaluate Student Pages
        # -------------------------------
        student_images_base64 = [
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encode_image(img)}"}}
            for img in student_images
        ]

        eval_prompt = f"""
Reference Description:
{reference_description}

You are an expert AI diagram evaluator. A student has submitted 5 pages. Your task is to:
1. **Identify the page that contains the diagram** (only one page will have it).
2. **Strictly evaluate** that diagram against the reference description.

🎯 Focus only on:
- The **presence**, **structure**, and **correctness** of the core components mentioned in the reference
- Logical layout and accurate connections between key elements (arrows, flows, blocks, interactions, etc.)
- Correct and complete labeling of diagram parts

🚫 Do NOT consider:
- Pages that don’t have the diagram
- Handwriting, drawing style, or visual quality unless it causes misunderstanding
- Decorative or presentational differences

📉 Scoring Instructions:
Be **conservative** in your grading. Deduct points for any missing, extra, misaligned, or mislabeled elements.
Only give a perfect score when the diagram **fully matches** the description with **no omissions or structural errors**.

🔢 Rounding:
All scores must be **rounded up to the nearest whole number** (e.g., 3.1 → 4). Do not give decimals.

📊 Output Format (Important for automated parsing):
Return your response in the following format exactly:

Correctness: <1-5>
Completeness: <1-5>
Labeling: <1-5>
Final Score: <1-5>

Summary:
<One paragraph summary explaining your evaluation>
"""

        eval_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [{"type": "text", "text": eval_prompt}] + student_images_base64
                }
            ],
            temperature=1,
            # max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )

        evaluation_result = eval_completion.choices[0].message.content

        # Extract Final Score
        match = re.search(r"Final Score:\s*(\d+)", evaluation_result)
        final_score = int(match.group(1)) if match else None

        return JsonResponse({
            "reference_description": reference_description,
            "evaluation_result": evaluation_result,
            "final_score": final_score
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
