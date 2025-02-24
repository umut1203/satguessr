document.addEventListener("DOMContentLoaded", () => {
    // Load the dictionary data
    fetch('words.json')
      .then(response => response.json())
      .then(data => {
        const dictionary = new Dictionary(data);
        dictionary.initialize();
      })
      .catch(error => {
        console.error("Error loading words.json:", error);
        document.getElementById('dictionary-content').innerHTML = 
          `<div class="error-message">Error loading dictionary data. Please try again later.</div>`;
      });
  });
  
  class Dictionary {
    constructor(words) {
      this.words = words;
      this.filteredWords = words;
      this.groupedWords = {};
      this.currentLetter = null;
      
      // DOM elements
      this.alphabetList = document.getElementById('alphabet-list');
      this.dictionaryContent = document.getElementById('dictionary-content');
      this.searchInput = document.getElementById('search-input');
      this.searchBtn = document.getElementById('search-btn');
      this.clearBtn = document.getElementById('clear-btn');
      this.modal = document.getElementById('word-modal');
      this.closeModal = document.querySelector('.close-modal');
      
      // Sort words alphabetically
      this.words.sort((a, b) => a.word.localeCompare(b.word));
    }
    
    initialize() {
      this.groupWordsByFirstLetter();
      this.renderAlphabetNav();
      this.renderDictionary();
      this.setupEventListeners();
    }
    
    groupWordsByFirstLetter() {
      // Reset the grouped words
      this.groupedWords = {};
      
      // Group words by first letter
      this.filteredWords.forEach(wordObj => {
        const firstLetter = wordObj.word.charAt(0).toUpperCase();
        if (!this.groupedWords[firstLetter]) {
          this.groupedWords[firstLetter] = [];
        }
        this.groupedWords[firstLetter].push(wordObj);
      });
    }
    
    renderAlphabetNav() {
      this.alphabetList.innerHTML = '';
      
      // Create the alphabet navigation
      for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const hasWords = this.groupedWords[letter] && this.groupedWords[letter].length > 0;
        
        const li = document.createElement('li');
        li.classList.add('alphabet-item');
        if (!hasWords) li.classList.add('empty');
        if (this.currentLetter === letter) li.classList.add('active');
        
        li.textContent = letter;
        
        if (hasWords) {
          li.addEventListener('click', () => {
            this.currentLetter = letter;
            this.scrollToLetter(letter);
            this.highlightActiveLetter();
          });
        }
        
        this.alphabetList.appendChild(li);
      }
    }
    
    highlightActiveLetter() {
      // Remove active class from all letters
      document.querySelectorAll('.alphabet-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to current letter
      if (this.currentLetter) {
        const activeLetter = document.querySelector(`.alphabet-item:nth-child(${this.currentLetter.charCodeAt(0) - 64})`);
        if (activeLetter) activeLetter.classList.add('active');
      }
    }
    
    scrollToLetter(letter) {
      const letterSection = document.getElementById(`letter-${letter}`);
      if (letterSection) {
        letterSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    renderDictionary() {
      this.dictionaryContent.innerHTML = '';
      
      if (this.filteredWords.length === 0) {
        this.dictionaryContent.innerHTML = `<div class="no-results">No words found matching your search.</div>`;
        return;
      }
      
      // Create sections for each letter
      Object.keys(this.groupedWords).sort().forEach(letter => {
        const letterWords = this.groupedWords[letter];
        
        if (letterWords.length > 0) {
          const section = document.createElement('div');
          section.classList.add('letter-section');
          section.id = `letter-${letter}`;
          
          const heading = document.createElement('h2');
          heading.classList.add('letter-heading');
          heading.textContent = letter;
          section.appendChild(heading);
          
          const wordsGrid = document.createElement('div');
          wordsGrid.classList.add('words-grid');
          
          letterWords.forEach(wordObj => {
            const wordCard = document.createElement('div');
            wordCard.classList.add('word-card');
            wordCard.setAttribute('data-word', JSON.stringify(wordObj));
            
            const wordText = document.createElement('span');
            wordText.classList.add('word-text');
            wordText.textContent = wordObj.word;
            
            wordCard.appendChild(wordText);
            
            if (wordObj.part_of_speech) {
              const wordPos = document.createElement('span');
              wordPos.classList.add('word-pos');
              wordPos.textContent = wordObj.part_of_speech;
              wordCard.appendChild(wordPos);
            }
            
            wordCard.addEventListener('click', () => {
              this.showWordDetail(wordObj);
            });
            
            wordsGrid.appendChild(wordCard);
          });
          
          section.appendChild(wordsGrid);
          this.dictionaryContent.appendChild(section);
        }
      });
    }
    
    setupEventListeners() {
      // Search button click
      this.searchBtn.addEventListener('click', () => {
        this.searchWords();
      });
      
      // Enter key in search input
      this.searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.searchWords();
        }
      });
      
      // Clear button click
      this.clearBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.filteredWords = this.words;
        this.groupWordsByFirstLetter();
        this.renderAlphabetNav();
        this.renderDictionary();
      });
      
      // Close modal
      this.closeModal.addEventListener('click', () => {
        this.modal.style.display = 'none';
      });
      
      // Close modal when clicking outside
      window.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.modal.style.display = 'none';
        }
      });
      
      // Close modal with Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.style.display === 'block') {
          this.modal.style.display = 'none';
        }
      });
    }
    
    searchWords() {
      const searchTerm = this.searchInput.value.trim().toLowerCase();
      
      if (searchTerm === '') {
        this.filteredWords = this.words;
      } else {
        this.filteredWords = this.words.filter(wordObj => {
          return wordObj.word.toLowerCase().includes(searchTerm) || 
                 wordObj.definition.toLowerCase().includes(searchTerm);
        });
      }
      
      this.currentLetter = null;
      this.groupWordsByFirstLetter();
      this.renderAlphabetNav();
      this.renderDictionary();
    }
    
    showWordDetail(wordObj) {
      // Populate modal with word details
      document.getElementById('modal-word').textContent = wordObj.word;
      document.getElementById('modal-pos').textContent = wordObj.part_of_speech || '';
      document.getElementById('modal-definition').textContent = wordObj.definition;
      
      const examplesList = document.getElementById('examples-list');
      examplesList.innerHTML = '';
      
      if (wordObj.examples && wordObj.examples.length > 0) {
        document.getElementById('modal-examples').style.display = 'block';
        wordObj.examples.forEach(example => {
          const li = document.createElement('li');
          li.textContent = example;
          examplesList.appendChild(li);
        });
      } else {
        document.getElementById('modal-examples').style.display = 'none';
      }
      
      // Show the modal
      this.modal.style.display = 'block';
    }
  }