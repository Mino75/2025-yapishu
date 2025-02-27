// main.js

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(() => {
      console.log('Service Worker Registered');
    });
  }
  
  // Get references to DOM elements
  const loadingOverlay = document.getElementById('loadingOverlay');
  const finishButton = document.getElementById('finishExerciseButton');
  const translationDisplay = document.getElementById('translationDisplay');
  const app = document.getElementById('app');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  
  // For continuous drawing, store last point coordinates
  let lastX = 0, lastY = 0;
  
  // Create language select
  const languageSelect = document.createElement('select');
  const languages = ['Japanese', 'Chinese Simplified', 'Chinese Traditional'];
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.toLowerCase().replace(' ', '_');
    option.textContent = lang;
    languageSelect.appendChild(option);
  });
  app.appendChild(languageSelect);
  
  // Create font select with preferred calligraphy fonts
  const fontSelect = document.createElement('select');
  const fonts = [
    { name: 'Sacramento', css: '"Sacramento", cursive' },
    { name: 'Ma Shan Zheng', css: '"Ma Shan Zheng", cursive' },
    { name: 'Yuji Mai', css: '"Yuji Mai", cursive' },
    { name: 'Noto Sans SC', css: '"Noto Sans SC", sans-serif' },
    { name: 'Arial', css: 'Arial, sans-serif' }
  ];
  fonts.forEach(font => {
    const option = document.createElement('option');
    option.value = font.css;
    option.textContent = font.name;
    fontSelect.appendChild(option);
  });
  app.appendChild(fontSelect);
  
  // Create start button
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Training';
  startButton.id = 'startButton';
  app.appendChild(startButton);
  
  // Global variables
  let characterData = null;
  let selectedLanguage = languageSelect.value;
  let selectedFont = fontSelect.value;
  let characterList = [];
  let currentCharacter = null; // Currently exercised character
  let drawing = false;
  
  // Update selected font when user changes selection
  fontSelect.addEventListener('change', () => {
    selectedFont = fontSelect.value;
    if (currentCharacter) {
      drawModelText();
    }
  });
  
  // Open the database and load data on startup
  dbFunctions.openDatabase(() => {
    dbFunctions.loadData((data) => {
      if (data) {
        characterData = data;
        console.log('Data loaded from IndexedDB');
        finishLoading();
      } else {
        // Fetch from server on first connection
        fetch('characters.json')
          .then(response => response.json())
          .then(data => {
            // Assume each character now includes a "pronunciation" field
            Object.keys(data.languages).forEach(lang => {
              data.languages[lang] = data.languages[lang].map(item => {
                return Object.assign({ exercises: 0, failures: 0 }, item);
              });
            });
            characterData = data.languages;
            dbFunctions.saveData(characterData, () => {
              console.log('Data fetched from server and stored in IndexedDB');
              finishLoading();
            });
          })
          .catch(err => {
            console.error('Error fetching data:', err);
            loadingOverlay.textContent = 'Failed to load data.';
          });
      }
    });
  });
  
  // Hide loading overlay and initialize training functionality
  function finishLoading() {
    loadingOverlay.style.display = 'none';
    setupTraining();
  }
  
  // Set up training functionality
  function setupTraining() {
    startButton.addEventListener('click', () => {
      selectedLanguage = languageSelect.value;
      characterList = characterData[selectedLanguage];
      startTrainingExercise();
    });
  
    finishButton.addEventListener('click', () => {
      if (currentCharacter) {
        currentCharacter.exercises++;
        dbFunctions.updateCharacter(selectedLanguage, currentCharacter, characterData, () => {
          console.log(`Updated "${currentCharacter.word}" count to ${currentCharacter.exercises}`);
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        translationDisplay.textContent = '';
        finishButton.style.display = 'none';
        startTrainingExercise();
      }
    });
  
    // Continuous drawing on canvas using scaled coordinates
    canvas.addEventListener('mousedown', (e) => {
      drawing = true;
      const { x, y } = getCanvasCoordinates(e);
      lastX = x;
      lastY = y;
    });
  
    canvas.addEventListener('mouseup', () => {
      drawing = false;
    });
  
    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const { x, y } = getCanvasCoordinates(e);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
    });
  }
  
  // Get scaled canvas coordinates from mouse event
  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  // Helper: determine optimal font size so that text fits 80% of canvas width
  function getFittingFontSize(text, maxWidth, fontFamily) {
    let min = 10, max = 500;
    while (max - min > 1) {
      const mid = (min + max) / 2;
      ctx.font = `${mid}px ${fontFamily}`;
      const width = ctx.measureText(text).width;
      if (width < maxWidth) {
        min = mid;
      } else {
        max = mid;
      }
    }
    return min;
  }
  
  // Draw background guide text using the selected font and optimal size (80% of canvas width)
  function drawModelText() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxTextWidth = canvas.width * 0.8;
    const fontSize = getFittingFontSize(currentCharacter.word, maxTextWidth, selectedFont);
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.fillText(currentCharacter.word, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }
  
  // Start a training exercise: choose a character (prioritizing those with lower exercise counts), display its guide text, translation, pronunciation, and exercise count.
  function startTrainingExercise() {
    // Find the minimum exercise count in the current language
    const minExercises = Math.min(...characterList.map(c => c.exercises));
    // Filter to those characters with that count
    const candidates = characterList.filter(c => c.exercises === minExercises);
    // Choose randomly among them
    currentCharacter = candidates[Math.floor(Math.random() * candidates.length)];
  
    // Draw the guide text
    drawModelText();
  
    // Display translation, pronunciation, and exercise count
    translationDisplay.innerHTML = `Translation: ${currentCharacter.translation}<br>
      Pronunciation: ${currentCharacter.pronunciation || 'N/A'}<br>
      Exercises: ${currentCharacter.exercises}`;
  
    finishButton.style.display = 'inline-block';
  }
  