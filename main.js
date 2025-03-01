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
// The select option values will be "japanese" and "chinese_simplified"
// These keys must match those in the transformed data stored in IndexedDB.
const languages = ['Japanese', 'Chinese Simplified'];
const languageSelect = document.createElement('select');
languages.forEach(lang => {
  const option = document.createElement('option');
  option.value = lang.toLowerCase().replace(' ', '_'); // e.g. "japanese", "chinese_simplified"
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

// Create Reload Data button
const reloadButton = document.createElement('button');
reloadButton.textContent = 'Reload Data';
reloadButton.id = 'reloadButton';
app.appendChild(reloadButton);

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

// Reload Data button: clear old connection (if any) and fetch fresh data
reloadButton.addEventListener('click', () => {
  clearAndReloadData();
});

// Open the database and load data on startup
dbFunctions.openDatabase(() => {
  dbFunctions.loadData(data => {
    if (data) {
      characterData = data;
      console.log('Data loaded from IndexedDB');
      finishLoading();
    } else {
      // No stored data found; fetch new data from server
      fetchAndStoreData();
    }
  });
});

// Function to fetch new data from the server, transform it, and store it in IndexedDB
function fetchAndStoreData() {
  Promise.all([
    fetch('japanese-jlpt.json').then(res => res.json()),
    fetch('mandarin-simplified-hsk.json').then(res => res.json())
  ])
  .then(([japaneseData, chineseData]) => {
    // Transform Japanese data
    const transformedJapanese = japaneseData.map(item => ({
      word: item.expression,
      pronunciation: item.reading,
      translation: item.meaning,
      tags: item.tags,
      number: null, // No numerotation for Japanese
      exercises: 0,
      failures: 0
    }));
    // Transform Chinese data
    const transformedChinese = chineseData.map(item => ({
      number: item.No, // store the numerotation from the "No" field
      word: item.Chinese,
      pronunciation: item.Pinyin,
      translation: item.English,
      level: item.Level,
      exercises: 0,
      failures: 0
    }));
    
    // Build the characterData object.
    // The keys ("japanese", "chinese_simplified") match the language select option values.
    characterData = {
      japanese: transformedJapanese,
      chinese_simplified: transformedChinese
    };
    
    // Save the new data to IndexedDB (this will overwrite any old data)
    dbFunctions.saveData(characterData, () => {
      console.log('New data stored in IndexedDB.');
      finishLoading();
    });
  })
  .catch(err => {
    console.error('Error fetching new data:', err);
    loadingOverlay.textContent = 'Failed to load new data.';
  });
}

// Function to clear the existing IndexedDB data and reload fresh data.
// This function ensures that we re-open the DB connection if it was closed.
function clearAndReloadData() {
  // Close the existing connection if it exists.
  if (db) {
    try {
      db.close();
    } catch (e) {
      console.warn('Error closing DB:', e);
    }
    db = null;
  }
  // Open a new connection, then fetch fresh data.
  dbFunctions.openDatabase(() => {
    fetchAndStoreData();
  });
}

// Hide loading overlay and initialize training functionality
function finishLoading() {
  loadingOverlay.style.display = 'none';
  setupTraining();
}

// Set up training functionality
function setupTraining() {
  startButton.addEventListener('click', () => {
    // Use the selected language (e.g., "japanese" or "chinese_simplified")
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

  // Mouse drawing events
  canvas.addEventListener('mousedown', e => {
    drawing = true;
    const { x, y } = getCanvasCoordinates(e);
    lastX = x;
    lastY = y;
  });
  canvas.addEventListener('mouseup', () => {
    drawing = false;
  });
  canvas.addEventListener('mousemove', e => {
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
  
  // Touch drawing events
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    drawing = true;
    const touch = e.touches[0];
    const { x, y } = getCanvasCoordinates(touch);
    lastX = x;
    lastY = y;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!drawing) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasCoordinates(touch);
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
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    drawing = false;
  });
}

// Helper function: get scaled canvas coordinates from an event
function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// Helper: determine optimal font size so that text fits 80% of the canvas width
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

// Start a training exercise: choose a character (prioritizing those with the fewest exercises),
// display its guide text, translation, pronunciation, and exercise count.
function startTrainingExercise() {
  const minExercises = Math.min(...characterList.map(c => c.exercises));
  const candidates = characterList.filter(c => c.exercises === minExercises);
  currentCharacter = candidates[Math.floor(Math.random() * candidates.length)];
  drawModelText();
  translationDisplay.innerHTML = `Translation: ${currentCharacter.translation}<br>
    Pronunciation: ${currentCharacter.pronunciation || 'N/A'}<br>
    Exercises: ${currentCharacter.exercises}`;
  finishButton.style.display = 'inline-block';
}
