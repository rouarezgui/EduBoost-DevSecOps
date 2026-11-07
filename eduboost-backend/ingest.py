import os
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding

DOCS_PATH = "./docs"
CHROMA_PATH = "./chroma_db"

embed_model = OllamaEmbedding(model_name="nomic-embed-text")
SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt"]


def ingest_documents(course: str) -> dict:
    """Full re-ingestion — call this MANUALLY only when you want to rebuild from scratch."""
    course_path = os.path.join(DOCS_PATH, course)

    if not os.path.exists(course_path):
        return {"error": f"No folder found for course: {course}"}

    files = [f for f in os.listdir(course_path) if any(f.endswith(e) for e in SUPPORTED_EXTENSIONS)]
    if not files:
        return {"error": f"No documents found in {course_path}"}

    print(f"---> Full ingestion for: {course}")

    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Only delete & rebuild on FULL ingest
    try:
        chroma_client.delete_collection(course)
        print(f"--- Old collection '{course}' deleted ---")
    except:
        pass

    collection = chroma_client.get_or_create_collection(course)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    documents = SimpleDirectoryReader(
        course_path,
        required_exts=SUPPORTED_EXTENSIONS
    ).load_data()

    for doc in documents:
        if "extraction_errors" in doc.metadata:
            del doc.metadata["extraction_errors"]

    VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model,
    )

    print(f"---> Ingestion complete for {course}")
    return {
        "message": f"Successfully indexed {len(documents)} documents for course: {course}",
        "files": files
    }


def ingest_single_file(course: str, filename: str) -> dict:
    """Ingest ONLY one new file — does NOT delete existing data."""
    course_path = os.path.join(DOCS_PATH, course)
    file_path = os.path.join(course_path, filename)

    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    print(f"---> Ingesting single file: {filename} for course: {course}")

    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Get existing collection or create it — NO deletion
    collection = chroma_client.get_or_create_collection(course)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    documents = SimpleDirectoryReader(
        input_files=[file_path],
        required_exts=SUPPORTED_EXTENSIONS
    ).load_data()

    for doc in documents:
        if "extraction_errors" in doc.metadata:
            del doc.metadata["extraction_errors"]

    VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model,
    )

    print(f"---> Done: {filename}")
    return {"message": f"Successfully added '{filename}' to course '{course}'"}


def save_uploaded_file(course: str, filename: str, file_bytes: bytes) -> str:
    course_path = os.path.join(DOCS_PATH, course)
    os.makedirs(course_path, exist_ok=True)

    file_path = os.path.join(course_path, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return file_path