from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Body, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
import google.generativeai as genai
from pathlib import Path
import json
from typing import Dict, List, Optional
import re
from dotenv import load_dotenv
import asyncio
from functools import lru_cache

# Load environment variables
load_dotenv()

# Configuration Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(title="AI Quiz Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Cache for storing extracted text and generated questions
text_cache = {}
question_cache = {}

@lru_cache(maxsize=100)
def clean_text(text: str) -> str:
    """Nettoie et prépare le texte pour la génération de questions."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.strip()

async def generate_questions_batch(chunk: str, question_type: str) -> Dict:
    """Génère un lot de questions d'un type spécifique."""
    prompt = f"""Tu es un générateur de quiz professionnel. Génère des questions {question_type} à partir du texte suivant.
    Important: Retourne UNIQUEMENT un objet JSON avec la structure exacte suivante, sans aucun texte supplémentaire:

    {{
        "mcq": [
            {{
                "question": "Question {question_type}",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correct_answer": 0
            }}
        ],
        "yesNo": [
            {{
                "question": "Question {question_type}",
                "correct_answer": true
            }}
        ],
        "shortAnswer": [
            {{
                "question": "Question {question_type}",
                "suggested_answer": "Réponse suggérée"
            }}
        ]
    }}

    Texte: {chunk}

    Instructions:
    1. Génère 10 QCM, 5 Oui/Non, et 5 questions à réponse courte
    2. Focus sur {question_type}
    3. Les questions doivent être claires et précises
    4. IMPORTANT: Retourne UNIQUEMENT le JSON, sans aucun texte avant ou après"""

    try:
        response = await model.generate_content_async(prompt)
        content = response.text.strip()
        
        # Remove any potential markdown code block markers
        content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE).strip()
        
        try:
            # First try to parse the content directly
            return json.loads(content)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from the content
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
            else:
                print(f"Failed to extract JSON from content: {content}")
                raise ValueError("Invalid JSON format in response")
    except Exception as e:
        print(f"Erreur lors de la génération des questions {question_type}: {str(e)}")
        print(f"Response content: {response.text if 'response' in locals() else 'No response'}")
        raise

async def generate_questions_for_chunk(chunk: str) -> Dict:
    """Génère des questions pour un morceau de texte donné."""
    try:
        # Generate questions in parallel for different types
        tasks = [
            generate_questions_batch(chunk, "factuelles et de connaissances"),
            generate_questions_batch(chunk, "de compréhension et d'analyse")
        ]
        
        results = await asyncio.gather(*tasks)
        questions1, questions2 = results

        # Combine and validate questions
        combined_questions = {
            "mcq": questions1["mcq"] + questions2["mcq"],
            "yesNo": questions1["yesNo"] + questions2["yesNo"],
            "shortAnswer": questions1["shortAnswer"] + questions2["shortAnswer"]
        }

        # Validate structure and number of questions
        if not all(key in combined_questions for key in ['mcq', 'yesNo', 'shortAnswer']):
            raise ValueError("Missing required question categories")

        if len(combined_questions["mcq"]) < 20 or len(combined_questions["yesNo"]) < 10 or len(combined_questions["shortAnswer"]) < 10:
            raise ValueError("Not enough questions generated")

        # Return exactly the number of questions needed
        return {
            "mcq": combined_questions["mcq"][:20],
            "yesNo": combined_questions["yesNo"][:10],
            "shortAnswer": combined_questions["shortAnswer"][:10]
        }

    except Exception as e:
        print(f"Erreur lors de la génération des questions : {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la génération des questions. Veuillez réessayer."
        )

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

def process_pdf(file_content: bytes) -> str:
    """Process PDF content and extract text."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return clean_text(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Erreur lors de la lecture du PDF")

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF")
    
    try:
        content = await file.read()
        text = process_pdf(content)
        
        # Cache the extracted text using the filename as key
        text_cache[file.filename] = text
        
        return JSONResponse(content={"text": text})
    except Exception as e:
        print(f"Erreur lors de la lecture du PDF : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-questions")
async def generate_questions(text: str = Body(..., embed=True)):
    try:
        if not text:
            raise HTTPException(status_code=400, detail="Aucun texte fourni")

        # Clean and prepare text
        text = clean_text(text)
        
        # Check cache for existing questions
        if text in question_cache:
            return JSONResponse(content={"questions": json.dumps(question_cache[text])})

        # Generate questions
        questions = await generate_questions_for_chunk(text[:4000] if len(text) > 4000 else text)
        
        # Cache the generated questions
        question_cache[text] = questions
        
        return JSONResponse(content={"questions": json.dumps(questions)})
    except Exception as e:
        print(f"Erreur lors de la génération : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
