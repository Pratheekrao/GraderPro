from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import pymongo
from bson import Binary
import json

# MongoDB Cloud Connection
# Important: Don't hardcode credentials in your code
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['GraderPro']
question_papers_collection = db['QuestionPaper']

@csrf_exempt
@require_http_methods(["POST"])
def upload_question_paper_json(request):
    try:
        # For JSON requests, load JSON body
        data = json.loads(request.body)
        
        # Expecting {"questions": [ ... ]}
        questions = data.get('questions')
        if not questions:
            return JsonResponse({'error': 'Missing questions field.'}, status=400)
        
        if not isinstance(questions, list):
            return JsonResponse({'error': 'Questions must be a list.'}, status=400)
        
        processed_questions = []
        
        # Note: Images cannot be sent in JSON body, so image handling will be skipped here.
        for q in questions:
            qno = q.get('qno')
            question_text = q.get('question')
            diagram = q.get('diagram')
            
            if not all([qno is not None, question_text]):
                return JsonResponse({'error': f'Missing fields in question {qno}.'}, status=400)
            
            processed_questions.append({
                'qno': qno,
                'question': question_text,
                'diagram': diagram,
                'image': None  # Images not supported in pure JSON POST
            })
        
        result = question_papers_collection.insert_one({
            'questions': processed_questions
        })
        
        return JsonResponse({'message': 'Question paper uploaded successfully!', 'id': str(result.inserted_id)}, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
