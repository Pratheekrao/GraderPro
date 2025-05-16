from django.urls import path
from . import views

urlpatterns = [
    path('paper/', views.add_or_get_paper),
    path('feedback/', views.add_or_get_feedback_marks),
]