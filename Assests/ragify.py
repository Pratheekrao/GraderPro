import os
import faiss
import pickle
import requests
import numpy as np
import PyPDF2
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from groq import Groq
from dotenv import load_dotenv
from io import BytesIO
from urllib.parse import urlparse, unquote

# Set your Groq API key directly
os.environ['GROQ_API_KEY'] = "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"
load_dotenv()

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def get_filename_from_path_or_url(path_or_url):
    parsed = urlparse(path_or_url)
    if parsed.scheme in ("http", "https"):
        name = os.path.basename(parsed.path)
    else:
        name = os.path.basename(path_or_url)
    return os.path.splitext(unquote(name))[0]


def load_pdf(path_or_url):
    pages = []
    try:
        if path_or_url.startswith("http"):
            response = requests.get(path_or_url)
            response.raise_for_status()
            pdf_stream = BytesIO(response.content)
        else:
            pdf_stream = open(path_or_url, "rb")

        reader = PyPDF2.PdfReader(pdf_stream)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages.append({"page_number": i + 1, "text": text.strip()})

        if isinstance(pdf_stream, BytesIO) is False:
            pdf_stream.close()

    except Exception as e:
        print(f"Error loading PDF: {e}")
        raise

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
    print(f"[✓] FAISS index and data saved to: {pkl_path}")
    return pkl_path


# Main handler
def ragify_pdf(path_or_url):
    print(f"[+] Processing: {path_or_url}")
    base_name = get_filename_from_path_or_url(path_or_url)
    pages = load_pdf(path_or_url)
    return embed_pages_and_save(pages, base_name)


# Example usage:
# pdf_url = "https://os.ecci.ucr.ac.cr/slides/Abraham-Silberschatz-Operating-System-Concepts-10th-2018.pdf"
# ragify_pdf(pdf_url)

ragify_pdf("Andrew S. Tanenbaum - Computer Networks.pdf")
