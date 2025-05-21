from django.urls import path
from .views import evaluate_diagram_view

urlpatterns = [
    path('evaluate/', evaluate_diagram_view, name='evaluate_diagram_view'),
]