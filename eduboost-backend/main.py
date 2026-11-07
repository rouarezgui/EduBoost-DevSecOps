from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import AskRequest, AskResponse, IngestRequest, LevelRequest, RecommendRequest, SummaryRequest, QuizRequest
from ingest import ingest_documents, save_uploaded_file, ingest_single_file

# These imports now load only the logic, not the full index
from rag_engine import ask_question, detect_level
from ingest import ingest_documents, save_uploaded_file
import os

from rag_engine import ask_question, detect_level, generate_recommendation, generate_summary, generate_quiz

app = FastAPI(title="RAG Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "RAG Service is running!"}

@app.post("/ingest")
def ingest(request: IngestRequest):
    # This is the "Heavy" endpoint. Use it once per course.
    result = ingest_documents(course=request.course)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    # This is now fast because it loads from disk!
    if not request.course:
        raise HTTPException(status_code=400, detail="Course name is required")
    
    result = ask_question(
        question=request.question,
        course=request.course
    )
    return AskResponse(
        answer=result["answer"],
        sources=result["sources"],
        course=request.course
    )

@app.post("/upload/{course}")
async def upload(course: str, file: UploadFile = File(...)):
    allowed = [".pdf", ".docx", ".pptx", ".txt"]
    if not any(file.filename.endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Invalid file type")

    file_bytes = await file.read()
    save_uploaded_file(course, file.filename, file_bytes)

    result = ingest_single_file(course, file.filename)

    return {
        "message": f"File {file.filename} added to course {course}",
        "course": course,
        "details": result
    }

@app.get("/chapters/{course}")
def get_chapters(course: str):
    course_path = f"./docs/{course}"
    if not os.path.exists(course_path):
        raise HTTPException(status_code=404, detail="Course not found")
    
    files = [f for f in os.listdir(course_path) if f.endswith((".pdf", ".docx", ".pptx", ".txt"))]
    return {"course": course, "chapters": files}

@app.post("/ai/recommend")
def recommend(request: RecommendRequest):
    result = generate_recommendation(
        question=request.question,
        course=request.course,
        student_data={
            "score": request.score,
            "progress": request.progress,
            "weak_chapters": request.weak_chapters
        }
    )
    return {"recommendation": result}

@app.post("/ai/summary")
def summary(request: SummaryRequest):
    result = generate_summary(request.course, request.chapter)  # ✅ add request.chapter
    return {"summary": result}

@app.post("/ai/quiz")
def quiz(request: QuizRequest):
    result = generate_quiz(request.course, request.chapter)  # ✅ add request.chapter
    return {"quiz": result}

@app.post("/ai/level")
def level(request: LevelRequest):
    result = detect_level(
        course=request.course,
        quiz_answers=request.quiz_answers
    )
    return {"evaluation": result["evaluation"], "student_id": request.student_id}