// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
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
    const dropZone = document.getElementById('dropZone');

    // State management
    const state = {
        file: null,
        extractedText: '',
        questions: [],
        userAnswers: {},
        score: 0
    };

    // File handling functions
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            state.file = file;
            fileName.textContent = file.name;
            generateBtn.disabled = false;
            
            // Add success class to filename
            fileName.className = 'text-sm text-emerald-400 mt-2';
        } else {
            state.file = null;
            fileName.textContent = file ? 'Please select a PDF file' : '';
            generateBtn.disabled = true;
            
            // Add error class to filename
            fileName.className = 'text-sm text-red-400 mt-2';
        }
    }

    // Drag and drop handling
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add('border-indigo-500');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('border-indigo-500');
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('border-indigo-500');

        const file = event.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            state.file = file;
            fileName.textContent = file.name;
            generateBtn.disabled = false;
            fileInput.files = event.dataTransfer.files;
            
            // Add success class to filename
            fileName.className = 'text-sm text-emerald-400 mt-2';
        } else {
            state.file = null;
            fileName.textContent = 'Please drop a PDF file';
            generateBtn.disabled = true;
            
            // Add error class to filename
            fileName.className = 'text-sm text-red-400 mt-2';
        }
    }

    async function handleGenerate() {
        if (!state.file) return;

        // Show loading state
        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // First upload the file
            const formData = new FormData();
            formData.append('file', state.file);

            const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            const uploadData = await uploadResponse.json();
            state.extractedText = uploadData.text;

            // Then generate questions
            const generateResponse = await fetch('/generate-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: state.extractedText })
            });

            if (!generateResponse.ok) {
                throw new Error('Failed to generate questions');
            }

            const generateData = await generateResponse.json();
            state.questions = JSON.parse(generateData.questions);

            // Display questions
            displayQuestions(state.questions);
        } catch (error) {
            console.error('Error:', error);
            fileName.textContent = 'Error generating questions. Please try again.';
            fileName.className = 'text-sm text-red-400 mt-2';
        } finally {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    function displayQuestions(questions) {
        questionsContainer.innerHTML = '';
        questionsContainer.classList.remove('hidden');

        // Display MCQ questions
        questions.mcq.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-6 p-6 glass-effect rounded-lg';
            questionDiv.dataset.questionType = 'mcq';
            questionDiv.dataset.questionIndex = index;
            
            const questionText = document.createElement('p');
            questionText.className = 'text-lg mb-4 font-medium';
            questionText.textContent = `${index + 1}. ${question.question}`;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'space-y-3';
            
            question.options.forEach((option, optionIndex) => {
                const label = document.createElement('label');
                label.className = 'flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question-${index}`;
                radio.value = option;
                radio.className = 'form-radio text-indigo-600 focus:ring-indigo-500';
                
                const optionText = document.createElement('span');
                optionText.textContent = option;
                optionText.className = 'text-gray-200';
                
                label.appendChild(radio);
                label.appendChild(optionText);
                optionsDiv.appendChild(label);
                
                radio.addEventListener('change', () => {
                    state.userAnswers[index] = option;
                });
            });
            
            questionDiv.appendChild(questionText);
            questionDiv.appendChild(optionsDiv);
            questionsContainer.appendChild(questionDiv);
        });

        // Display Yes/No questions
        questions.yesNo.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-6 p-6 glass-effect rounded-lg';
            questionDiv.dataset.questionType = 'yesno';
            questionDiv.dataset.questionIndex = index;
            
            const questionText = document.createElement('p');
            questionText.className = 'text-lg mb-4 font-medium';
            questionText.textContent = `${questions.mcq.length + index + 1}. ${question.question}`;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'flex space-x-4';
            
            ['Yes', 'No'].forEach((option) => {
                const label = document.createElement('label');
                label.className = 'flex-1 flex items-center justify-center space-x-3 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `yn-${index}`;
                radio.value = option.toLowerCase();
                radio.className = 'form-radio text-indigo-600 focus:ring-indigo-500';
                
                const optionText = document.createElement('span');
                optionText.textContent = option;
                optionText.className = 'text-gray-200';
                
                label.appendChild(radio);
                label.appendChild(optionText);
                optionsDiv.appendChild(label);
                
                radio.addEventListener('change', () => {
                    state.userAnswers[`yn-${index}`] = option.toLowerCase() === 'yes';
                });
            });
            
            questionDiv.appendChild(questionText);
            questionDiv.appendChild(optionsDiv);
            questionsContainer.appendChild(questionDiv);
        });

        // Display Short Answer questions
        questions.shortAnswer.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-6 p-6 glass-effect rounded-lg';
            questionDiv.dataset.questionType = 'shortanswer';
            questionDiv.dataset.questionIndex = index;
            
            const questionText = document.createElement('p');
            questionText.className = 'text-lg mb-4 font-medium';
            questionText.textContent = `${questions.mcq.length + questions.yesNo.length + index + 1}. ${question.question}`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500';
            input.placeholder = 'Your answer';
            
            input.addEventListener('input', (e) => {
                state.userAnswers[`sa-${index}`] = e.target.value;
            });
            
            questionDiv.appendChild(questionText);
            questionDiv.appendChild(input);
            questionsContainer.appendChild(questionDiv);
        });
    }

    function handleSubmit() {
        if (Object.keys(state.userAnswers).length === 0) return;
        
        let score = 0;
        let totalQuestions = 0;
        
        // Check MCQ answers
        state.questions.mcq.forEach((question, index) => {
            if (state.userAnswers[index] !== undefined) {
                totalQuestions++;
                if (state.userAnswers[index] === question.options[question.correct_answer]) {
                    score++;
                }
            }
        });
        
        // Check Yes/No answers
        state.questions.yesNo.forEach((question, index) => {
            if (state.userAnswers[`yn-${index}`] !== undefined) {
                totalQuestions++;
                if (state.userAnswers[`yn-${index}`] === question.correct_answer) {
                    score++;
                }
            }
        });
        
        // For short answer questions, we'll show the suggested answer
        state.questions.shortAnswer.forEach((question, index) => {
            if (state.userAnswers[`sa-${index}`]) {
                totalQuestions++;
            }
        });
        
        state.score = score;
        const percentage = (score / totalQuestions) * 100;
        
        scoreDisplay.textContent = `Your score: ${score}/${totalQuestions} (${percentage.toFixed(1)}%)`;
        resultsContainer.classList.remove('hidden');
    }

    function showAnswers() {
        // Show MCQ answers
        state.questions.mcq.forEach((question, index) => {
            const questionDiv = questionsContainer.querySelector(`div[data-question-type="mcq"][data-question-index="${index}"]`);
            if (!questionDiv) return;

            const options = questionDiv.querySelectorAll('input[type="radio"]');
            options.forEach((option, optionIndex) => {
                const label = option.parentElement;
                if (optionIndex === question.correct_answer) {
                    label.classList.add('bg-green-800', 'bg-opacity-50');
                } else if (state.userAnswers[index] === option.value && optionIndex !== question.correct_answer) {
                    label.classList.add('bg-red-800', 'bg-opacity-50');
                }
                option.disabled = true;
            });
        });

        // Show Yes/No answers
        state.questions.yesNo.forEach((question, index) => {
            const questionDiv = questionsContainer.querySelector(`div[data-question-type="yesno"][data-question-index="${index}"]`);
            if (!questionDiv) return;

            const options = questionDiv.querySelectorAll('input[type="radio"]');
            options.forEach(option => {
                const label = option.parentElement;
                const isYes = option.value === 'yes';
                if (isYes === question.correct_answer) {
                    label.classList.add('bg-green-800', 'bg-opacity-50');
                } else if (state.userAnswers[`yn-${index}`] === isYes && isYes !== question.correct_answer) {
                    label.classList.add('bg-red-800', 'bg-opacity-50');
                }
                option.disabled = true;
            });
        });

        // Show short answer suggestions
        state.questions.shortAnswer.forEach((question, index) => {
            const questionDiv = questionsContainer.querySelector(`div[data-question-type="shortanswer"][data-question-index="${index}"]`);
            if (!questionDiv) return;

            const input = questionDiv.querySelector('input[type="text"]');
            if (!input) return;

            // Check if suggestion div already exists
            const existingSuggestion = questionDiv.querySelector('.suggestion-div');
            if (!existingSuggestion) {
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'mt-3 text-emerald-400 suggestion-div';
                suggestionDiv.textContent = `Suggested answer: ${question.suggested_answer}`;
                input.insertAdjacentElement('afterend', suggestionDiv);
            }
            input.disabled = true;
        });
    }

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    generateBtn.addEventListener('click', handleGenerate);
    submitBtn.addEventListener('click', handleSubmit);
    showAnswersBtn.addEventListener('click', showAnswers);

    // Drag and drop event listeners
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
});
