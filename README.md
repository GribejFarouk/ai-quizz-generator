# AI Quiz Generator 📚

A modern web application that automatically generates quizzes from PDF documents using AI. Built with FastAPI, Gemini AI, and modern web technologies.

![AI Quiz Generator](static/images/white.svg)

## ✨ Features

- 📝 **Multiple Question Types**
  - Multiple Choice Questions (MCQ)
  - Yes/No Questions
  - Short Answer Questions

- 🎯 **Smart Question Generation**
  - Generates factual knowledge questions
  - Creates comprehension and analysis questions
  - Ensures diverse question types for better learning

- 🎨 **Modern UI/UX**
  - Dark mode interface
  - Responsive design
  - Smooth animations
  - Interactive question cards
  - Drag-and-drop file upload

- 📊 **Quiz Features**
  - Instant scoring
  - Answer review
  - Detailed feedback
  - Progress tracking

## 🚀 Quick Start Guide

### Method 1: Using the Executable (Recommended)

1. **Download the Application**
   - Download `AI-Quiz-Generator.zip` or clone it
   - Extract the ZIP file to your desired location

2. **Run the Application**
   - Double-click `run_app.bat`
   - The application will automatically:
     - Set up everything needed
     - Start the server
     - Open your default browser
   - Wait a few seconds, and you're ready to go!

3. **Start Using**
   - The app will open in your browser at `http://localhost:8000`
   - You can now start generating quizzes from your PDF files!

### Method 2: Manual Installation (For Developers)

If you want to modify the code or contribute to the project:

1. **Prerequisites**
   - Install Python 3.8 or higher
   - Install Git (optional)

2. **Installation Steps**
   ```bash
   # Clone or download the repository
   git clone https://github.com/your-username/ai-quizz-generator.git
   cd ai-quizz-generator
   ```

2. **Create a Virtual Environment**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**
   - Create a `.env` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

5. **Run the Application**
   ```bash
   # Windows
   .\run_app.bat

   # Linux/Mac
   python main.py
   ```

6. **Access the Application**
   - Open your browser and go to: `http://localhost:8000`

## 💡 Usage Guide

1. **Upload PDF**
   - Click the "Choose a file" button or drag and drop a PDF
   - The file name will appear in green when successfully uploaded

2. **Generate Questions**
   - Click "Generate Questions" to process the PDF
   - Wait for the AI to analyze the content
   - Questions will appear automatically

3. **Answer Questions**
   - Multiple Choice: Select one option
   - Yes/No: Choose Yes or No
   - Short Answer: Type your response

4. **Submit and Review**
   - Click "Submit Answers" to see your score
   - Use "Show Answers" to review correct answers
   - Correct answers are highlighted in green
   - Incorrect answers are highlighted in red

## 🛠️ Technical Stack

- **Backend**
  - FastAPI (Python web framework)
  - Gemini AI (Question generation)
  - PyPDF2 (PDF processing)

- **Frontend**
  - HTML5/CSS3/JavaScript
  - Tailwind CSS (Styling)
  - Modern ES6+ features

## 📝 API Endpoints

- `GET /` - Main application interface
- `POST /upload` - PDF file upload
- `POST /generate-questions` - Question generation

## 🔒 Security

- Only accepts PDF files
- Secure file handling
- Environment variable protection
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/GribejFarouk/ai-quizz-generator?tab=MIT-1-ov-file#) file for details.

## 🙏 Acknowledgments

- Gemini AI for powering the question generation
- FastAPI team for the excellent framework
- Tailwind CSS for the beautiful styling

## 🐛 Troubleshooting

- **Application Won't Start**
  - Make sure you have an active internet connection
  - Try running `run_app.bat` as administrator
  - Check if port 8000 is available

- **File Upload Issues**
  - Ensure the file is in PDF format
  - Check file size (max 10MB)
  - Try refreshing the page

- **Question Generation Issues**
  - Verify your API key is correct
  - Check internet connection
  - Ensure PDF has extractable text
  - Try with a different PDF file

## 📞 Support

For issues and feature requests, please [open an issue](https://github.com/gribejfarouk/ai-quizz-generator/issues) on GitHub,
or mail: support@gribejfarouk.me
