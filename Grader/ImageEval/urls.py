from django.urls import path
from . import views

urlpatterns = [
    path('run/', views.diagram_evaluation_view, name='diagram_evaluation_view'),
]