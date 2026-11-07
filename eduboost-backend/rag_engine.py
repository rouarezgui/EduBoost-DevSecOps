import os
import chromadb
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.groq import Groq

CHROMA_PATH = "./chroma_db"
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

llm = Groq(model="llama-3.1-8b-instant", api_key=GROQ_API_KEY)
embed_model = OllamaEmbedding(model_name="nomic-embed-text")
splitter = SentenceSplitter(chunk_size=256, chunk_overlap=20)

# Critical fix: set globally so LlamaIndex doesn't fall back to OpenAI
Settings.llm = llm
Settings.embed_model = embed_model


def get_index(course: str):
    """
    Connects to the existing vector database.
    Does NOT re-index documents to save time.
    """
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    try:
        collection = chroma_client.get_collection(course)
        if collection.count() == 0:
            raise ValueError(f"Collection '{course}' is empty.")
    except Exception as e:
        print(f"[get_index] Error loading collection '{course}': {e}")
        return None

    vector_store = ChromaVectorStore(chroma_collection=collection)

    index = VectorStoreIndex.from_vector_store(
        vector_store,
        embed_model=embed_model,
        transformations=[splitter]
    )
    return index


def ask_question(question: str, course: str) -> dict:
    index = get_index(course)
    if not index:
        return {
            "answer": f"Error: Course '{course}' hasn't been ingested yet.",
            "sources": []
        }

    try:
        chat_engine = index.as_chat_engine(
            chat_mode="condense_plus_context",
            llm=llm,
            verbose=True
        )
        response = chat_engine.chat(question)
    except Exception as e:
        print(f"[ask_question] Chat error: {e}")
        return {"answer": f"Error during chat: {str(e)}", "sources": []}

    sources = []
    if hasattr(response, "source_nodes"):
        for node in response.source_nodes:
            if hasattr(node, "metadata") and "file_name" in node.metadata:
                sources.append(node.metadata["file_name"])

    return {
        "answer": str(response),
        "sources": list(set(sources))
    }


def detect_level(course: str, quiz_answers: list) -> dict:
    index = get_index(course)
    if not index:
        return {"evaluation": f"Error: Please ingest course '{course}' materials first."}

    try:
        chat_engine = index.as_chat_engine(
            chat_mode="condense_plus_context",
            llm=llm,
            verbose=True
        )

        prompt = f"""
        Un étudiant a répondu à ces questions sur le cours {course}:
        {chr(10).join([f"- {a}" for a in quiz_answers])}

        En te basant sur ces réponses et le contenu du cours, évalue:
        1. Le niveau actuel de l'étudiant (débutant/intermédiaire/avancé)
        2. Les sujets qu'il maîtrise bien
        3. Les sujets sur lesquels il doit se concentrer
        """

        response = chat_engine.chat(prompt)
    except Exception as e:
        print(f"[detect_level] Chat error: {e}")
        return {"evaluation": f"Error during evaluation: {str(e)}"}

    return {"evaluation": str(response)}

def generate_recommendation(question, course, student_data):
    index = get_index(course)
    if not index:
        return "Course not found"

    chat_engine = index.as_chat_engine(
        chat_mode="condense_plus_context",
        llm=llm
    )

    prompt = f"""
    You are a smart learning assistant.

    Student profile:
    Score: {student_data['score']}
    Weak chapters: {student_data['weak_chapters']}
    Progress: {student_data['progress']}

    Question:
    {question}

    Give personalized and actionable advice.
    """

    response = chat_engine.chat(prompt)
    return str(response)

def generate_summary(course, chapter: str = None):
    index = get_index(course)
    if not index:
        return "Course not found"

    chat_engine = index.as_chat_engine(
        chat_mode="condense_plus_context",
        llm=llm
    )

    target = f"chapter '{chapter}' of the course" if chapter else "the entire course"
    prompt = f"""Summarize the key concepts of {target}.
    Format your response EXACTLY like this:
    - Use bullet points for each concept
    - Keep each point short and clear (1-2 lines max)
    - Group related points under bold headers
    - No long paragraphs
    - No closing remarks"""

    response = chat_engine.chat(prompt)
    return str(response)

def generate_quiz(course, chapter: str = None):
    index = get_index(course)
    if not index:
        return "Course not found"

    chat_engine = index.as_chat_engine(
        chat_mode="condense_plus_context",
        llm=llm
    )

    target = f"chapter '{chapter}' of the course" if chapter else "the entire course"
    prompt = f"Generate 3 quiz questions based on {target}. Format as numbered list with clear questions."

    response = chat_engine.chat(prompt)
    return str(response)