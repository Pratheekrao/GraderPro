from django.urls import path
from .views import evaluate_answer

urlpatterns = [
    path('script/', evaluate_answer, name='evaluate_answer'),
]