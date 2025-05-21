import os
import faiss
import pickle
import requests
import numpy as np
import PyPDF2
import json
from io import BytesIO
from urllib.parse import urlparse, unquote

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Utility to extract base filename
def get_filename_from_path_or_url(path_or_url):
    parsed = urlparse(path_or_url)
    if parsed.scheme in ("http", "https"):
        name = os.path.basename(parsed.path)
    else:
        name = os.path.basename(path_or_url)
    return os.path.splitext(unquote(name))[0]

# Extract text from each PDF page
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

# Embed text and save FAISS index + metadata
def embed_pages_and_save(pages, base_name):
    texts = [p["text"] for p in pages]
    embeddings = embedding_model.encode(texts, show_progress_bar=True)
    embeddings = np.array(embeddings).astype("float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    index_path = f"{base_name}_index.faiss"
    meta_path = f"{base_name}_meta.pkl"

    faiss.write_index(index, index_path)
    with open(meta_path, "wb") as f:
        pickle.dump({"texts": texts, "pages": pages}, f)

    return index_path, meta_path

# View: Create FAISS index from PDF
@csrf_exempt
@require_POST
def ragify_pdf_view(request):
    try:
        if request.content_type == "application/json":
            body = json.loads(request.body)
            pdf_url = body.get("pdf_url")
            pdf_file = None
        else:
            pdf_url = request.POST.get("pdf_url")
            pdf_file = request.FILES.get("pdf_file")

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
        index_path, meta_path = embed_pages_and_save(pages, base_name)

        return JsonResponse({
            "status": "success",
            "index_file": index_path,
            "meta_file": meta_path
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# View: Query FAISS index
@csrf_exempt
@require_POST
def similarity_search_view(request):
    try:
        if request.content_type == "application/json":
            body = json.loads(request.body)
            query = body.get("query")
            index_file = body.get("index_file")
            meta_file = body.get("meta_file")
        else:
            query = request.POST.get("query")
            index_file = request.POST.get("index_file")
            meta_file = request.POST.get("meta_file")

        if not query or not index_file or not meta_file:
            return JsonResponse({
                "error": "Fields 'query', 'index_file', and 'meta_file' are required."
            }, status=400)

        if not os.path.exists(index_file) or not os.path.exists(meta_file):
            return JsonResponse({"error": "Index or metadata file not found."}, status=404)

        index = faiss.read_index(index_file)
        with open(meta_file, "rb") as f:
            meta = pickle.load(f)

        pages = meta["pages"]
        query_embedding = embedding_model.encode([query])
        query_embedding = np.array(query_embedding).astype("float32")

        D, I = index.search(query_embedding, 5)

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
