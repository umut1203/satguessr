document.addEventListener("DOMContentLoaded", () => {
  // Make sure to run a local server so fetch() can load words.json correctly.
  fetch('words.json')
    .then(response => response.json())
    .then(data => {
      const game = new QuizGame(data);
      game.start();
    })
    .catch(error => {
      console.error("Error loading words.json:", error);
    });
});

class QuizGame {
  constructor(words) {
    this.words = words; // full array from words.json
    this.numQuestions = 20;
    this.currentQuestionIndex = 0;
    this.questions = [];   // will hold the 20 selected questions
    this.mistakes = [];    // records mistakes for review: { questionNumber, word, selected, correct }
    this.score = 0;
    this.quizContainer = document.getElementById("quiz-container");
    this.restartBtn = document.getElementById("restart-btn");
    this.restartBtn.addEventListener("click", () => this.restart());
  }

  start() {
    this.generateQuestions();
    this.showQuestion();
  }

  generateQuestions() {
    // Shuffle a copy of the full words array
    let wordsCopy = [...this.words];
    for (let i = wordsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordsCopy[i], wordsCopy[j]] = [wordsCopy[j], wordsCopy[i]];
    }
    // Pick the first N words as our questions
    const selectedWords = wordsCopy.slice(0, this.numQuestions);
    
    // For each selected word, create a question object:
    // The prompt is the "word" (with optionally part_of_speech) and the correct answer is its "definition"
    this.questions = selectedWords.map(wordObj => {
      const prompt = wordObj.word; // The question is simply the word
      const correctDefinition = wordObj.definition;
      const examples = wordObj.examples;
      
      // Choose two distractor definitions from random word objects (making sure they are different)
      let distractors = [];
      while (distractors.length < 2) {
        const rand = this.words[Math.floor(Math.random() * this.words.length)];
        if (rand.word !== prompt && rand.definition !== correctDefinition && !distractors.includes(rand.definition)) {
          distractors.push(rand.definition);
        }
      }
      let options = [correctDefinition, ...distractors];
      // Shuffle the options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { prompt, options, correctAnswer: correctDefinition, examples, part_of_speech: wordObj.part_of_speech };
    });
  }

  showQuestion() {
    // If all questions are answered, show the results/review page.
    if (this.currentQuestionIndex >= this.numQuestions) {
      this.showResults();
      return;
    }
    
    this.quizContainer.innerHTML = ""; // clear previous content
    const q = this.questions[this.currentQuestionIndex];

    // Create a card container for the question
    const card = document.createElement("div");
    card.classList.add("card");

    // Header: display question number and the word prompt; optionally show part of speech
    const header = document.createElement("div");
    header.classList.add("card-header");
    header.innerHTML = `<h2>Question ${this.currentQuestionIndex + 1}</h2>
                        <p class="prompt">${q.prompt} ${q.part_of_speech ? `<span class="pos">(${q.part_of_speech})</span>` : ""}</p>`;
    card.appendChild(header);

    // "Show Example" button
    const exampleBtn = document.createElement("button");
    exampleBtn.classList.add("example-btn");
    exampleBtn.textContent = "Show Example";
    card.appendChild(exampleBtn);

    // Example text element
    const exampleText = document.createElement("p");
    exampleText.classList.add("example-text");
    exampleText.style.display = "none";
    if (q.examples && q.examples.length > 0) {
      exampleText.textContent = q.examples[0];
    } else {
      exampleText.textContent = "No example available.";
    }
    card.appendChild(exampleText);

    // Toggle example visibility
    exampleBtn.addEventListener("click", () => {
      if (exampleText.style.display === "none") {
        exampleText.style.display = "block";
        exampleBtn.textContent = "Hide Example";
      } else {
        exampleText.style.display = "none";
        exampleBtn.textContent = "Show Example";
      }
    });

    // Options container: each option is a definition (as text) the user can select
    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("options-container");
    q.options.forEach(option => {
      const optBtn = document.createElement("button");
      optBtn.classList.add("option-btn");
      optBtn.textContent = option;
      optBtn.addEventListener("click", () => this.handleAnswer(option));
      optionsContainer.appendChild(optBtn);
    });
    card.appendChild(optionsContainer);
    
    this.quizContainer.appendChild(card);
  }

  handleAnswer(selectedOption) {
    const q = this.questions[this.currentQuestionIndex];
    if (selectedOption === q.correctAnswer) {
      this.score++;
    } else {
      // Record mistake with the word prompt and chosen definition
      this.mistakes.push({
        questionNumber: this.currentQuestionIndex + 1,
        prompt: q.prompt,
        selected: selectedOption,
        correct: q.correctAnswer,
        definition: q.correctAnswer // For clarity in review (the definition)
      });
    }
    this.currentQuestionIndex++;
    this.showQuestion();
  }

  showResults() {
    this.quizContainer.innerHTML = "";
    const resultsDiv = document.createElement("div");
    resultsDiv.classList.add("results");

    const scoreEl = document.createElement("h2");
    scoreEl.textContent = `Score: ${this.score} / ${this.numQuestions} (${((this.score / this.numQuestions) * 100).toFixed(1)}%)`;
    resultsDiv.appendChild(scoreEl);

    if (this.mistakes.length > 0) {
      const reviewTitle = document.createElement("h3");
      reviewTitle.textContent = "Review your mistakes:";
      resultsDiv.appendChild(reviewTitle);

      // For each mistake, create a collapsible review block
      this.mistakes.forEach(mistake => {
        const reviewBlock = document.createElement("details");
        reviewBlock.classList.add("review-block");

        // Summary shows question number and the word (prompt)
        const summary = document.createElement("summary");
        summary.innerHTML = `<span class="review-header">Question ${mistake.questionNumber} – ${mistake.prompt}</span>`;
        reviewBlock.appendChild(summary);

        // Display what the user answered
        const yourAnswer = document.createElement("p");
        yourAnswer.innerHTML = `<strong>Your answer:</strong> ${mistake.selected}`;
        reviewBlock.appendChild(yourAnswer);

        // Display the correct definition
        const correctAnswer = document.createElement("p");
        correctAnswer.innerHTML = `<strong>Correct answer:</strong> ${mistake.correct}`;
        reviewBlock.appendChild(correctAnswer);

        resultsDiv.appendChild(reviewBlock);
      });
    }
    this.quizContainer.appendChild(resultsDiv);
    this.restartBtn.style.display = "inline-block";
  }

  restart() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.mistakes = [];
    this.generateQuestions();
    this.restartBtn.style.display = "none";
    this.showQuestion();
  }
}
