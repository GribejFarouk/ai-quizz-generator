from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Body
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
from typing import Dict, List
import re

# Configuration Gemini API
genai.configure(api_key="AIzaSyAIwolxxrOG55S87m-t6OoKF4M-iWsMlNg")
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(title="AI Quiz Generator")

# Ajouter CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter les fichiers statiques et les templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def clean_text(text: str) -> str:
    """Nettoie et prépare le texte pour la génération de questions."""
    # Supprimer les caractères spéciaux et les espaces multiples
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.strip()

async def generate_questions_for_chunk(chunk: str) -> Dict:
    """Génère des questions pour un morceau de texte donné."""
    try:
        prompt = f"""Génère des questions à partir du texte suivant.
        Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante, sans texte supplémentaire :
        {{
            "mcq": [
                {{
                    "question": "Question claire et précise",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correct_answer": 0
                }}
            ],
            "yesNo": [
                {{
                    "question": "Question qui peut être répondue par Oui ou Non",
                    "correct_answer": true
                }}
            ],
            "shortAnswer": [
                {{
                    "question": "Question nécessitant une réponse courte",
                    "suggested_answer": "Réponse attendue"
                }}
            ]
        }}

        Texte: {chunk}

        Règles:
        1. Génère exactement 3 QCM, 2 questions Oui/Non, et 2 questions à réponse courte
        2. Les questions doivent être pertinentes et basées sur le texte
        3. Pour les QCM, assure-toi que les options sont claires et distinctes
        4. La réponse correcte doit toujours être présente dans les options des QCM"""

        response = await model.generate_content_async(prompt)
        content = response.text.strip()
        
        # Ensure we get valid JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON from the text
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                return json.loads(json_str)
            raise
            
    except Exception as e:
        print(f"Erreur lors de la génération des questions : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF")
    
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        text = clean_text(text)
        
        if not text:
            raise HTTPException(status_code=400, detail="Aucun texte n'a pu être extrait du PDF")
            
        return JSONResponse(content={"text": text})
    except Exception as e:
        print(f"Erreur lors de la lecture du PDF : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-questions")
async def generate_questions(text: str = Body(..., embed=True)):
    try:
        if not text:
            raise HTTPException(status_code=400, detail="Aucun texte fourni")

        # Nettoyer le texte
        text = clean_text(text)
        if len(text) > 4000:
            text = text[:4000]  # Limiter la taille du texte

        # Générer les questions
        questions = await generate_questions_for_chunk(text)
        
        return JSONResponse(content={"questions": json.dumps(questions)})
    except Exception as e:
        print(f"Erreur lors de la génération : {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
