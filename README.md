# AI Quiz Generator

Une application web qui génère automatiquement des questions à partir de documents PDF en utilisant l'intelligence artificielle.

## Fonctionnalités

- Upload de documents PDF
- Extraction automatique du texte
- Génération de questions avec OpenAI GPT-3.5
- Interface utilisateur moderne et responsive
- Différents types de questions (QCM, Oui/Non, Réponse courte)

## Prérequis

- Python 3.8+
- Une clé API OpenAI

## Installation

1. Cloner le repository
2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Créer un fichier `.env` à la racine du projet et ajouter votre clé API OpenAI :
```
OPENAI_API_KEY=votre_clé_api
```

## Lancement de l'application

```bash
uvicorn main:app --reload
```

L'application sera accessible à l'adresse : http://localhost:8000

## Utilisation

1. Cliquez sur le bouton "Sélectionnez un fichier" pour choisir un document PDF
2. Une fois le document chargé, cliquez sur "Générer les Questions"
3. Les questions générées seront affichées dans trois catégories :
   - Questions à Choix Multiples
   - Questions Oui/Non
   - Questions à Réponse Courte

## Structure du projet

```
ai-quiz-generator/
├── main.py              # Application FastAPI
├── requirements.txt     # Dépendances Python
├── static/             # Fichiers statiques
│   └── js/
│       └── main.js     # JavaScript pour l'interface
├── templates/          # Templates HTML
│   └── index.html      # Page principale
└── .env               # Variables d'environnement
```
