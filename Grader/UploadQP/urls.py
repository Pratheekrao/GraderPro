from django.urls import path
from .views import upload_question_paper_json

urlpatterns = [
    path('upload_qp_json/', upload_question_paper_json, name='upload_qp_json'),
]
