from django.urls import path
from . import views

urlpatterns = [
    path('paper/', views.add_or_get_paper),
    path('feedback/', views.add_or_get_feedback_marks),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('subjects/', views.get_registered_subjects, name='subjects'),
]