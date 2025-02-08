document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const generateBtn = document.getElementById('generateBtn');
    const submitBtn = document.getElementById('submitBtn');
    const showAnswersBtn = document.getElementById('showAnswersBtn');
    const fileName = document.getElementById('fileName');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const questionsContainer = document.getElementById('questionsContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    let extractedText = '';
    let currentQuestions = null;

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            fileName.textContent = file.name;
            const formData = new FormData();
            formData.append('file', file);

            try {
                generateBtn.disabled = true;
                console.log('Uploading file...');
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'Erreur lors du chargement du fichier');
                }

                console.log('Upload response:', data);
                extractedText = data.text;
                generateBtn.disabled = false;
            } catch (error) {
                console.error('Upload error:', error);
                alert('Erreur lors du chargement du fichier: ' + error.message);
                generateBtn.disabled = true;
            }
        }
    });

    generateBtn.addEventListener('click', async () => {
        console.log('Generate button clicked');
        if (!extractedText) {
            console.error('No text available for generation');
            return;
        }

        loadingIndicator.classList.remove('hidden');
        questionsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            console.log('Sending text for question generation...');
            const response = await fetch('/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: extractedText })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Erreur lors de la génération des questions');
            }

            console.log('Generation response:', data);
            
            if (!data.questions) {
                throw new Error('No questions received from server');
            }

            currentQuestions = JSON.parse(data.questions);
            console.log('Parsed questions:', currentQuestions);
            
            if (!currentQuestions.mcq || !currentQuestions.yesNo || !currentQuestions.shortAnswer) {
                throw new Error('Format de questions invalide');
            }

            displayQuestions(currentQuestions);
        } catch (error) {
            console.error('Generation error:', error);
            alert('Erreur lors de la génération des questions: ' + error.message);
        } finally {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    submitBtn.addEventListener('click', () => {
        if (!currentQuestions) return;
        
        let correctAnswers = 0;
        let totalQuestions = 0;
        
        // Vérifier les QCM
        currentQuestions.mcq.forEach((q, index) => {
            const selectedAnswer = document.querySelector(`input[name="mcq-${index}"]:checked`);
            const questionDiv = document.querySelector(`#mcqQuestions .space-y-4 > div:nth-child(${index + 1})`);
            
            if (selectedAnswer) {
                totalQuestions++;
                const isCorrect = parseInt(selectedAnswer.value) === q.correct_answer;
                if (isCorrect) correctAnswers++;
                
                questionDiv.classList.add(isCorrect ? 'bg-green-50' : 'bg-red-50');
                questionDiv.querySelector('[data-correct]').classList.remove('hidden');
            }
        });
        
        // Vérifier les questions Oui/Non
        currentQuestions.yesNo.forEach((q, index) => {
            const selectedAnswer = document.querySelector(`input[name="yn-${index}"]:checked`);
            const questionDiv = document.querySelector(`#yesNoQuestions .space-y-4 > div:nth-child(${index + 1})`);
            
            if (selectedAnswer) {
                totalQuestions++;
                const isCorrect = selectedAnswer.value === q.correct_answer.toString();
                if (isCorrect) correctAnswers++;
                
                questionDiv.classList.add(isCorrect ? 'bg-green-50' : 'bg-red-50');
                questionDiv.querySelector('[data-correct]').classList.remove('hidden');
            }
        });
        
        // Afficher le score
        scoreDisplay.textContent = `${correctAnswers}/${totalQuestions}`;
        resultsContainer.classList.remove('hidden');
    });

    showAnswersBtn.addEventListener('click', () => {
        // Afficher toutes les réponses correctes
        document.querySelectorAll('[data-correct]').forEach(el => {
            el.classList.remove('hidden');
        });
    });

    function displayQuestions(questions) {
        console.log('Displaying questions:', questions);
        const mcqContainer = document.querySelector('#mcqQuestions .space-y-4');
        const yesNoContainer = document.querySelector('#yesNoQuestions .space-y-4');
        const shortAnswerContainer = document.querySelector('#shortAnswerQuestions .space-y-4');

        if (!mcqContainer || !yesNoContainer || !shortAnswerContainer) {
            console.error('Question containers not found');
            return;
        }

        // Vider les conteneurs
        mcqContainer.innerHTML = '';
        yesNoContainer.innerHTML = '';
        shortAnswerContainer.innerHTML = '';

        // Reset results
        resultsContainer.classList.add('hidden');
        scoreDisplay.textContent = '0/0';

        // Afficher les questions
        if (questions.mcq && Array.isArray(questions.mcq)) {
            questions.mcq.forEach((q, index) => {
                const questionDiv = createMCQQuestion(q, index);
                mcqContainer.appendChild(questionDiv);
            });
        }

        if (questions.yesNo && Array.isArray(questions.yesNo)) {
            questions.yesNo.forEach((q, index) => {
                const questionDiv = createYesNoQuestion(q, index);
                yesNoContainer.appendChild(questionDiv);
            });
        }

        if (questions.shortAnswer && Array.isArray(questions.shortAnswer)) {
            questions.shortAnswer.forEach((q, index) => {
                const questionDiv = createShortAnswerQuestion(q, index);
                shortAnswerContainer.appendChild(questionDiv);
            });
        }

        questionsContainer.classList.remove('hidden');
    }

    function createMCQQuestion(question, index) {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 p-4 rounded-lg';
        div.innerHTML = `
            <p class="font-semibold mb-3">${index + 1}. ${question.question}</p>
            <div class="space-y-2">
                ${question.options.map((option, i) => `
                    <label class="flex items-center space-x-2">
                        <input type="radio" name="mcq-${index}" value="${i}" class="form-radio text-indigo-600">
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
            <p class="text-sm text-green-600 mt-2 hidden" data-correct="${question.correct_answer}">
                La bonne réponse est : ${question.options[question.correct_answer]}
            </p>
        `;
        return div;
    }

    function createYesNoQuestion(question, index) {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 p-4 rounded-lg';
        div.innerHTML = `
            <p class="font-semibold mb-3">${index + 1}. ${question.question}</p>
            <div class="space-x-4">
                <label class="inline-flex items-center">
                    <input type="radio" name="yn-${index}" value="true" class="form-radio text-indigo-600">
                    <span class="ml-2">Oui</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" name="yn-${index}" value="false" class="form-radio text-indigo-600">
                    <span class="ml-2">Non</span>
                </label>
            </div>
            <p class="text-sm text-green-600 mt-2 hidden" data-correct="${question.correct_answer}">
                La bonne réponse est : ${question.correct_answer ? 'Oui' : 'Non'}
            </p>
        `;
        return div;
    }

    function createShortAnswerQuestion(question, index) {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 p-4 rounded-lg';
        div.innerHTML = `
            <p class="font-semibold mb-3">${index + 1}. ${question.question}</p>
            <input type="text" class="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Votre réponse">
            <p class="text-sm text-gray-500 mt-2">Suggestion: ${question.suggested_answer}</p>
        `;
        return div;
    }
});
