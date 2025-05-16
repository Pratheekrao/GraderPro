import os
import faiss
import pickle
import requests
import numpy as np
import PyPDF2
from io import BytesIO
from urllib.parse import urlparse, unquote

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv


load_dotenv()

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_filename_from_path_or_url(path_or_url):
    parsed = urlparse(path_or_url)
    if parsed.scheme in ("http", "https"):
        name = os.path.basename(parsed.path)
    else:
        name = os.path.basename(path_or_url)
    return os.path.splitext(unquote(name))[0]

def load_pdf_from_stream(pdf_stream):
    pages = []
    try:
        reader = PyPDF2.PdfReader(pdf_stream)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages.append({"page_number": i + 1, "text": text.strip()})
    except Exception as e:
        raise ValueError(f"Error reading PDF: {e}")
    return pages

def embed_pages_and_save(pages, base_name):
    texts = [p["text"] for p in pages]
    embeddings = embedding_model.encode(texts, show_progress_bar=True)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))

    pkl_path = f"{base_name}_faiss.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump({
            "index": index,
            "embeddings": embeddings,
            "texts": texts,
            "pages": pages
        }, f)
    return pkl_path

@csrf_exempt
@require_POST
def ragify_pdf_view(request):
    try:
        pdf_url = request.POST.get('pdf_url')
        pdf_file = request.FILES.get('pdf_file')

        if not pdf_url and not pdf_file:
            return JsonResponse({"error": "Provide either 'pdf_url' or upload a 'pdf_file'."}, status=400)

        if pdf_url:
            response = requests.get(pdf_url)
            response.raise_for_status()
            pdf_stream = BytesIO(response.content)
            base_name = get_filename_from_path_or_url(pdf_url)
        else:
            pdf_stream = pdf_file.file
            base_name = os.path.splitext(pdf_file.name)[0]

        pages = load_pdf_from_stream(pdf_stream)
        pkl_path = embed_pages_and_save(pages, base_name)

        return JsonResponse({"status": "success", "message": f"FAISS index saved as {pkl_path}"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




@csrf_exempt
@require_POST
def similarity_search_view(request):
    try:
        # Get query and pkl filename from POST request
        query = request.POST.get('query')
        pkl_file = request.POST.get('pkl_file')  # Example: 'Computer_Networks_faiss.pkl'

        if not query or not pkl_file:
            return JsonResponse({"error": "Both 'query' and 'pkl_file' are required."}, status=400)

        # Load FAISS index & data from pickle
        if not os.path.exists(pkl_file):
            return JsonResponse({"error": f"File '{pkl_file}' not found."}, status=404)

        with open(pkl_file, "rb") as f:
            data = pickle.load(f)

        index = data['index']
        texts = data['texts']
        pages = data['pages']

        # Embed the query
        query_embedding = embedding_model.encode([query])

        # Search FAISS index
        k = 5  # Top 5 results
        D, I = index.search(np.array(query_embedding), k)

        # Prepare results
        results = []
        for idx, distance in zip(I[0], D[0]):
            if idx != -1:
                page_data = pages[idx]
                results.append({
                    "page_number": page_data["page_number"],
                    "text": page_data["text"],
                    "similarity_score": float(distance)
                })

        return JsonResponse({"query": query, "results": results})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)