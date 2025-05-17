from django.urls import path
from .views import process_exam_images

urlpatterns = [
    path('text/', process_exam_images, name='process_exam_images'),
]