import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from extractor import extract_text_from_pdf, ParserError, EmptyPDFError
from parser import detect_sections, extract_skills_from_text

load_dotenv()

app = FastAPI(title="Resume Parser Service", version="1.0.0")

# CORS middleware config to allow communication from Next.js server/client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_TOKEN = os.getenv("API_TOKEN")

def verify_api_token(x_api_token: str = Header(None)):
    """Verifies the static X-API-Token header if API_TOKEN is configured."""
    if API_TOKEN and x_api_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Token")
    return x_api_token

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "resume-parser"}

@app.post("/api/v1/parse", dependencies=[Depends(verify_api_token)])
async def parse_resume(file: UploadFile = File(...)):
    """
    Endpoint to receive a resume PDF, extract text, detect sections,
    and match technical/soft skills.
    """
    # Some clients upload PDF with octet-stream, so we check extension as a fallback
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF documents are supported."
        )
        
    try:
        pdf_bytes = await file.read()
        extracted_text = extract_text_from_pdf(pdf_bytes)
        sections = detect_sections(extracted_text)
        skills = extract_skills_from_text(extracted_text)
        
        return {
            "status": "success",
            "filename": file.filename,
            "extracted_text": extracted_text,
            "sections": sections,
            "extracted_skills": skills
        }
    except EmptyPDFError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ParserError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during resume processing: {str(e)}"
        )
