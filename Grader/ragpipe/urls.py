from django.urls import path
from . import views

urlpatterns = [
    path('pipeline/', views.ragify_pdf_view),
    path('search/', views.similarity_search_view, name='rag_similarity_search'),
]