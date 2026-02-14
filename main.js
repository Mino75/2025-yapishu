// main.js

// ----------------------------
// DOM ELEMENT REFERENCES
// ----------------------------
const loadingOverlay = document.getElementById('loadingOverlay');
const finishButton = document.getElementById('finishExerciseButton');
finishButton.textContent = '✅ Finish'; // Emoji prefix for Finish button
const translationDisplay = document.getElementById('translationDisplay');
const app = document.getElementById('app');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Coordinates for drawing
let lastX = 0, lastY = 0;

// Move title to bottom
(function moveTitleToFooter() {
  const h1 = document.querySelector('h1');
  if (!h1) return;

  let footer = document.getElementById('footerTitle');
  if (!footer) {
    footer = document.createElement('footer');
    footer.id = 'footerTitle';
    document.body.appendChild(footer);
  }
  footer.appendChild(h1);
})();

// SHow model
let showModel = localStorage.getItem("showModel") !== "false"; // défaut = true

function setShowModel(value) {
  showModel = !!value;
  localStorage.setItem("showModel", String(showModel));
  updateEyeButtonUI();
  // Re-render immédiat sur l’exercice en cours
  if (currentCharacter) drawModelText();
}



// ----------------------------
// CREATE SELECT ELEMENTS
// ----------------------------

// Language select
const languages = ['Japanese', 'Chinese Simplified', 'Russian'];
const languageSelect = document.createElement('select');
languages.forEach(lang => {
  const option = document.createElement('option');
  option.value = lang.toLowerCase().replace(' ', '_'); // "japanese", "chinese_simplified"
  option.textContent = lang;
  languageSelect.appendChild(option);
});
app.appendChild(languageSelect);

// Default font mapping for each language
const defaultFontForLanguage = {
  japanese: '"Yuji Mai", cursive',
  chinese_simplified: '"Noto Sans SC", sans-serif',
  russian: 'Arial, sans-serif' 
};




// Level filter select
const levelFilterSelect = document.createElement('select');
levelFilterSelect.id = 'levelFilter';
const defaultOptionLevel = document.createElement('option');
defaultOptionLevel.value = 'all';
defaultOptionLevel.textContent = 'All Levels';
levelFilterSelect.appendChild(defaultOptionLevel);
app.appendChild(levelFilterSelect);

// Tag filter select
const tagFilterSelect = document.createElement('select');
tagFilterSelect.id = 'tagFilter';
const defaultOptionTag = document.createElement('option');
defaultOptionTag.value = 'all';
defaultOptionTag.textContent = 'All Tags';
tagFilterSelect.appendChild(defaultOptionTag);
app.appendChild(tagFilterSelect);

// ----------------------------
// CREATE BUTTONS WITH EMOJI
// ----------------------------

const eyeButton = document.createElement('button');
eyeButton.id = 'eyeButton';
eyeButton.type = 'button';
eyeButton.title = 'Afficher / masquer le modèle';
eyeButton.addEventListener('click', () => setShowModel(!showModel));
app.appendChild(eyeButton);

function updateEyeButtonUI() {
  // 👀 = visible, ㊙️ = masqué (ou remplace par ton icône préférée)
  eyeButton.textContent = showModel ? '👀' : '㊙️';
}
updateEyeButtonUI();



const skipButton = document.createElement('button');
skipButton.textContent = '⏭️ Skip';
skipButton.id = 'skipButton';
app.appendChild(skipButton);

// ----------------------------
// Layout: push low-frequency controls below the canvas
// ----------------------------
const belowCanvas = document.createElement('div');
belowCanvas.id = 'belowCanvas';
belowCanvas.style.marginTop = '16px';

// Insert the container right after the canvas container (preferred)
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.insertAdjacentElement('afterend', belowCanvas);

const exportButton = document.createElement('button');
exportButton.textContent = '📤 Export Score';
exportButton.id = 'exportButton';
belowCanvas.appendChild(exportButton);

const importButton = document.createElement('button');
importButton.textContent = '📥 Import Score';
importButton.id = 'importButton';
belowCanvas.appendChild(importButton);

const reviewButton = document.createElement('button');
reviewButton.textContent = '📋 Review';
reviewButton.id = 'reviewButton';
belowCanvas.appendChild(reviewButton);

const clearDataButton = document.createElement('button');
clearDataButton.textContent = '🗑️ Clear Data';
clearDataButton.id = 'clearDataButton';
belowCanvas.appendChild(clearDataButton);

belowCanvas.appendChild(translationDisplay);

// Font select
const fontSelect = document.createElement('select');
const fonts = [
  { name: 'Sacramento', css: '"Sacramento", cursive' },
  { name: 'Ma Shan Zheng', css: '"Ma Shan Zheng", cursive' },
  { name: 'Yuji Mai', css: '"Yuji Mai", cursive' },
  { name: 'Marck Script', css: '"Marck Script", cursive' },
  { name: 'Noto Sans SC', css: '"Noto Sans SC", sans-serif' },
  { name: 'Arial', css: 'Arial, sans-serif' }
];
fonts.forEach(font => {
  const option = document.createElement('option');
  option.value = font.css;
  option.textContent = font.name;
  fontSelect.appendChild(option);
});
belowCanvas.appendChild(fontSelect);


// ----------------------------
// GLOBAL VARIABLES
// ----------------------------
let characterData = null;
let selectedLanguage = languageSelect.value;
let selectedFont = fontSelect.value;
let characterList = [];
let currentCharacter = null; // Currently exercised character
let drawing = false;

////// HELPER RUSSIAN FILTER

// Returns the primary (first) level from a Russian "levels" string like "A1, A2, B1"
function getPrimaryRussianLevel(levelsStr) {
  if (!levelsStr) return null;
  return String(levelsStr).split(',')[0].trim();
}

// ----------------------------
// USER SELECTION STORAGE HELPERS
// ----------------------------
function saveUserSelection(key, value) {
  localStorage.setItem(key, value);
}

function loadUserSelections() {
  const storedLanguage = localStorage.getItem("selectedLanguage");
  const storedFont = localStorage.getItem("selectedFont");
  const storedLevel = localStorage.getItem("selectedLevel");
  const storedTag = localStorage.getItem("selectedTag");

  if (storedLanguage) {
    languageSelect.value = storedLanguage;
    selectedLanguage = storedLanguage;
  }
  if (storedFont) {
    fontSelect.value = storedFont;
    selectedFont = storedFont;
  }
  if (storedLevel) {
    levelFilterSelect.value = storedLevel;
  }
  if (storedTag) {
    tagFilterSelect.value = storedTag;
  }
}

// ----------------------------
// EVENT LISTENERS
// ----------------------------

// Font select: update selected font and redraw model text if available
fontSelect.addEventListener('change', () => {
  selectedFont = fontSelect.value;
  saveUserSelection("selectedFont", selectedFont);
  if (currentCharacter) {
    drawModelText();
  }
});

// Language select: update selected language, apply default font, update filters, and restart exercise
languageSelect.addEventListener('change', () => {
  selectedLanguage = languageSelect.value;
  saveUserSelection("selectedLanguage", selectedLanguage);
  if (defaultFontForLanguage[selectedLanguage]) {
    selectedFont = defaultFontForLanguage[selectedLanguage];
    fontSelect.value = selectedFont;
    saveUserSelection("selectedFont", selectedFont);
  }
  updateFilters();
  startTrainingExercise();
});

// Filter selects: update training exercise on change and save user selections
levelFilterSelect.addEventListener('change', () => {
  saveUserSelection("selectedLevel", levelFilterSelect.value);
  startTrainingExercise();
});
tagFilterSelect.addEventListener('change', () => {
  saveUserSelection("selectedTag", tagFilterSelect.value);
  startTrainingExercise();
});

// Clear Data: confirm, then clear IndexedDB and caches with auto-reload
clearDataButton.addEventListener('click', () => {
  if (confirm("Are you sure you want to clear data? This will remove the IndexedDB data and cache, then reload the page.")) {
    if (db) {
      try {
        db.close();
      } catch (e) {
        console.warn('Error closing DB:', e);
      }
      db = null;
    }
    const req = indexedDB.deleteDatabase("characterDB");
    req.onsuccess = () => {
      console.log("IndexedDB deleted successfully.");
      
      //  Clear additional browser storage:
      localStorage.clear();
      sessionStorage.clear();
      
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).then(() => {
          // Auto-reload the page after clearing caches
          window.location.reload();
        });
      } else {
        // Auto-reload even if caches API is not available
        window.location.reload();
      }
    };
    req.onerror = () => {
      console.error("Error deleting IndexedDB.");
      alert("Error occurred while clearing data. Please try again.");
    };
  }
});

// Export Score: download current characterData as JSON
exportButton.addEventListener('click', () => {
  const dataStr = JSON.stringify(characterData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "score_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Import Score: read a JSON file and merge imported scores with existing data
importButton.addEventListener('click', () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";
  fileInput.addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const importedData = JSON.parse(e.target.result);
        for (const lang in importedData) {
          if (characterData[lang]) {
            importedData[lang].forEach(importedChar => {
              const existing = characterData[lang].find(c => c.word === importedChar.word);
              if (existing) {
                existing.exercises += importedChar.exercises || 0;
                existing.failures += importedChar.failures || 0;
              }
            });
          }
        }
        dbFunctions.saveData(characterData, () => {
          console.log("Scores updated with imported data.");
          alert("Import successful! Scores have been updated.");
          startTrainingExercise();
        });
      } catch (error) {
        alert("Error parsing JSON file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  });
  fileInput.click();
});

// Skip button: immediately move and mark fail the current exercice
skipButton.addEventListener('click', () => {
if (currentCharacter) {
    currentCharacter.failures = Number(currentCharacter.failures || 0) + 1;

    // Persist the failure update
    dbFunctions.updateCharacter(selectedLanguage, currentCharacter, characterData, () => {
      // no-op
    });
  }  
  startTrainingExercise();
});

// Review Button functionality
reviewButton.addEventListener('click', () => {
  openReviewPopup();
});

// ----------------------------
// REVIEW POPUP FUNCTIONS
// ----------------------------
// Updated openReviewPopup function that uses CSS classes from style.js
function openReviewPopup() {
  let fullList = characterData[selectedLanguage] || [];
  
  // Apply current level filter
  const levelFilter = levelFilterSelect.value;
  if (levelFilter !== 'all') {
    fullList = fullList.filter(c => {
      if (selectedLanguage === 'chinese_simplified') {
        return c.level === levelFilter;
      } else if (selectedLanguage === 'japanese' && c.tags) {
        return c.tags.split(' ').some(tag => tag === levelFilter);
      } else if (selectedLanguage === 'russian' && c.levels) {
        return getPrimaryRussianLevel(c.levels) === levelFilter;
      }
      return true;
    });
  }

  // Sort by training value (descending) then alphabetically
  fullList.sort((a, b) => {
    if (b.exercises !== a.exercises) {
      return b.exercises - a.exercises; // Higher training values first
    }
    return a.word.localeCompare(b.word); // Then alphabetically
  });

  // Create popup modal using helper functions
  const modal = window.styleHelpers.createPopupModal();
  const popup = window.styleHelpers.createPopupContent();
  
  // Create and add header
  const title = `Review Characters - ${selectedLanguage.replace('_', ' ')} ${levelFilter !== 'all' ? `(${levelFilter})` : ''}`;
  const header = window.styleHelpers.createPopupHeader(title, () => {
    document.body.removeChild(modal);
  });
  popup.appendChild(header);

  // Create character list container
  const listContainer = window.styleHelpers.createCharacterListContainer();
  
  if (fullList.length === 0) {
    window.styleHelpers.showNoCharactersMessage(listContainer);
  } else {
    fullList.forEach(character => {
      const item = window.styleHelpers.createCharacterItem(
        character, 
        selectedFont, 
        (character) => {
          // Close popup and load training for this character
          document.body.removeChild(modal);
          loadSpecificCharacter(character);
        }
      );
      listContainer.appendChild(item);
    });
  }

  popup.appendChild(listContainer);
  modal.appendChild(popup);
  document.body.appendChild(modal);

  // Close popup when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}


function loadSpecificCharacter(character) {
  currentCharacter = character;
  drawModelText();
  
  let levelStr = '';
  if (currentCharacter.level) {
    levelStr = ` (${currentCharacter.level})`;
  } else if (selectedLanguage === 'japanese' && currentCharacter.tags) {
    const jlptTag = currentCharacter.tags.split(' ').find(tag => tag.includes('JLPT'));
    if (jlptTag) { levelStr = ` (${jlptTag})`; }
  } else if (selectedLanguage === 'russian' && currentCharacter.levels) {
    levelStr = ` (${currentCharacter.levels})`;
  }

  const isSupported = tts.isLanguageSupported(selectedLanguage);
  const ttsButton = isSupported 
    ? `<button class="tts-button" onclick="tts.speak('${currentCharacter.pronunciation}', '${selectedLanguage}')" title="Écouter la prononciation">🔊</button>`
    : `<span class="tts-button" style="cursor: not-allowed;" title="TTS non disponible">🔊</span>`;
  
  translationDisplay.innerHTML = `
    Translation: ${currentCharacter.translation}${levelStr}<br>
    Pronunciation: ${currentCharacter.pronunciation || 'N/A'}${ttsButton}<br>
    Exercises: ${currentCharacter.exercises} ${getProgressHTML(currentCharacter.exercises)}
  `;
  finishButton.style.display = 'inline-block';
  
  // Clear canvas for new training
  ctx.clearRect(0, 0, canvas.width, canvas.height);
// draw moel
   drawModelText();
}

// ----------------------------
// DATABASE & DATA LOADING
// ----------------------------
dbFunctions.openDatabase(() => {
  dbFunctions.loadData(data => {
    if (data) {
      characterData = data;
      console.log('Data loaded from IndexedDB');
      finishLoading();
    } else {
      // No stored data found; fetch from server
      fetchAndStoreData();
    }
  });
});

// Fetch and transform new data, then store in IndexedDB
function fetchAndStoreData() {
  Promise.all([
    fetch('japanese-jlpt.json').then(res => res.json()),
    fetch('mandarin-simplified-hsk.json').then(res => res.json()),
    fetch('russian-torfl.json').then(res => res.json())
  ])
  .then(([japaneseData, chineseData, russianData]) => {
    const transformedJapanese = japaneseData.map(item => ({
      word: item.expression,
      pronunciation: item.reading,
      translation: item.meaning,
      tags: item.tags,
      number: null,
      exercises: 0,
      failures: 0
    }));
    const transformedChinese = chineseData.map(item => ({
      number: item.No,
      word: item.Chinese,
      pronunciation: item.Pinyin,
      translation: item.English,
      level: item.Level,
      exercises: 0,
      failures: 0
    }));

    const transformedRussian = russianData.map(item => ({
      number: item.id,
      word: item.Russian,
      pronunciation: item.Russian, 
      translation: item.English,
      levels: item.Levels, // Note: "Levels" 
      exercises: 0,
      failures: 0
    }));
    
    characterData = {
      japanese: transformedJapanese,
      chinese_simplified: transformedChinese,
      russian: transformedRussian
    };
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

// (Unused) Function to clear data and reload fresh data
function clearAndReloadData() {
  if (db) {
    try {
      db.close();
    } catch (e) {
      console.warn('Error closing DB:', e);
    }
    db = null;
  }
  dbFunctions.openDatabase(() => {
    fetchAndStoreData();
  });
}

// ----------------------------
// TRAINING FUNCTIONALITY
// ----------------------------

// Called after data is loaded; restores selections, updates filters, and starts training
function finishLoading() {
  loadingOverlay.style.display = 'none';
  loadUserSelections();
  updateFilters();
  setupTraining();
  startTrainingExercise();
}

// Set up training events and drawing functionality
function setupTraining() {
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
  canvas.addEventListener('mouseup', () => { drawing = false; });
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

// ----------------------------
// HELPER FUNCTIONS
// ----------------------------

// Get canvas coordinates from an event
function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// Calculate optimal font size so that text fits 80% of the canvas width
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

// Draw the guide text (the current character) in the canvas
function drawModelText() {
  if (!currentCharacter) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Si le modèle est masqué, on s’arrête ici (canvas vide, prêt à écrire)
  if (!showModel) return;

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

// Generate progress bar HTML and emojis based on exercise count
function getProgressHTML(exCount) {
  const progressBar = `<progress max="50" value="${exCount}"></progress>`;
  let emojis = '';
  if (exCount >= 20) { emojis += ' 🎉'; }
  if (exCount >= 30) { emojis += ' 🎉'; }
  if (exCount >= 50) { emojis += ' 🎉'; }
  return progressBar + emojis;
}

// ----------------------------
// RG PARAMETERS (reconfigurable thresholds)
// ----------------------------
// Start a training exercise using probabilistic NEW/Known selection,
// then pick the "worst" known items by max (failures - exercises).
// ----------------------------
// RG PARAMETERS (reconfigurable thresholds)
// ----------------------------
const P_NEW = 0.25; // 1/4 new, 3/4 known

function startTrainingExercise() {
  let fullList = characterData?.[selectedLanguage] || [];

  // Apply level filter
  const levelFilter = levelFilterSelect.value;
  if (levelFilter !== 'all') {
    fullList = fullList.filter(c => {
      if (selectedLanguage === 'chinese_simplified') return c.level === levelFilter;
      if (selectedLanguage === 'japanese' && c.tags) return c.tags.split(' ').some(tag => tag === levelFilter);
      if (selectedLanguage === 'russian' && c.levels) return getPrimaryRussianLevel(c.levels) === levelFilter;;
      return true;
    });
  }

  // Apply tag filter
  const tagFilter = tagFilterSelect.value;
  if (tagFilter !== 'all') {
    fullList = fullList.filter(c => c.tags && c.tags.split(' ').includes(tagFilter));
  }

  if (!fullList.length) {
    translationDisplay.innerHTML = 'No character matches the selected filters.';
    return;
  }

  // Partition NEW and KNOWN
  const NEW = [];
  const KNOWN = [];
  for (const c of fullList) {
    const ex = Number(c.exercises || 0);
    if (ex === 0) NEW.push(c);
    else KNOWN.push(c);
  }

  // Step 1: Decide NEW vs KNOWN (fallback safe)
  const takeNew = NEW.length > 0 && (Math.random() < P_NEW || KNOWN.length === 0);

  if (takeNew) {
    // Uniform random from NEW
    currentCharacter = NEW[Math.floor(Math.random() * NEW.length)];
  } else {
    // Step 2: Choose among KNOWN with the highest deficit score (failures - exercises)
    let maxScore = -Infinity;

    for (const c of KNOWN) {
      const ex = Number(c.exercises || 0);
      const fa = Number(c.failures || 0);
      const score = fa - ex;
      if (score > maxScore) maxScore = score;
    }

    // Candidates are those with the same max score
    const candidates = [];
    for (const c of KNOWN) {
      const ex = Number(c.exercises || 0);
      const fa = Number(c.failures || 0);
      const score = fa - ex;
      if (score === maxScore) candidates.push(c);
    }

    currentCharacter = candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Render UI (unchanged)
  drawModelText();

  let levelStr = '';
  if (currentCharacter.level) levelStr = ` (${currentCharacter.level})`;
  else if (selectedLanguage === 'japanese' && currentCharacter.tags) {
    const jlptTag = currentCharacter.tags.split(' ').find(tag => tag.includes('JLPT'));
    if (jlptTag) levelStr = ` (${jlptTag})`;
  } else if (selectedLanguage === 'russian' && currentCharacter.levels) {
    levelStr = ` (${currentCharacter.levels})`;
  }

  const isSupported = tts.isLanguageSupported(selectedLanguage);
  const ttsButton = isSupported
    ? `<button class="tts-button" onclick="tts.speak('${currentCharacter.pronunciation}', '${selectedLanguage}')" title="Listen to pronunciation">🔊</button>`
    : `<span class="tts-button" style="cursor: not-allowed;" title="TTS not available">🔊</span>`;

  translationDisplay.innerHTML = `
    Translation: ${currentCharacter.translation}${levelStr}<br>
    Pronunciation: ${currentCharacter.pronunciation || 'N/A'}${ttsButton}<br>
    Exercises: ${currentCharacter.exercises} ${getProgressHTML(currentCharacter.exercises)}
  `;
  finishButton.style.display = 'inline-block';
}


// Update filter dropdowns based on the available data for the selected language
function updateFilters() {
  let list = characterData[selectedLanguage] || [];
  const levels = new Set();
  const tags = new Set();
  
  list.forEach(item => {
    if (selectedLanguage === 'chinese_simplified' && item.level) {
      levels.add(item.level);
    } else if (selectedLanguage === 'japanese' && item.tags) {
      item.tags.split(' ').forEach(tag => {
        if (tag.includes('JLPT')) {
          levels.add(tag);
        }
      });
    } else if (selectedLanguage === 'russian' && item.levels) {
      // Le champ "Levels" contient des niveaux séparés par des virgules comme "B1, B2"
      item.levels.split(', ').forEach(level => {
        levels.add(level.trim());
      });
    }
    if (item.tags) {
      item.tags.split(' ').forEach(tag => tags.add(tag));
    }
  });
  
  // Update level filter dropdown
  levelFilterSelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = 'all';
  defaultOpt.textContent = 'All Levels';
  levelFilterSelect.appendChild(defaultOpt);
  Array.from(levels).sort().forEach(lvl => {
    const opt = document.createElement('option');
    opt.value = lvl;
    opt.textContent = lvl;
    levelFilterSelect.appendChild(opt);
  });
  
  // Update tag filter dropdown
  tagFilterSelect.innerHTML = '';
  const defaultOptTag = document.createElement('option');
  defaultOptTag.value = 'all';
  defaultOptTag.textContent = 'All Tags';
  tagFilterSelect.appendChild(defaultOptTag);
  Array.from(tags).sort().forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    tagFilterSelect.appendChild(opt);
  });
}

// ----------------------------
// TTS FUNCTIONS (robust)
// ----------------------------
class TTSPronunciation {
  constructor() {
    this.synth = window.speechSynthesis;
    this.supportedLanguages = {
      japanese: ['ja', 'ja-JP'],
      chinese_simplified: ['zh', 'zh-CN'],
      russian: ['ru', 'ru-RU'],
    };

    this.voices = [];
    this.voicesReady = false;

    this._initVoices();
  }

  _initVoices() {
    if (!this.synth) return;

    const load = () => {
      const list = this.synth.getVoices() || [];
      if (list.length > 0) {
        this.voices = list;
        this.voicesReady = true;
      }
    };

    // Try immediately (Chrome often has voices already)
    load();

    // Then listen for async load (Safari/iOS, some Chromium setups)
    this.synth.onvoiceschanged = () => load();
  }

  async waitForVoices(timeoutMs = 2000) {
    if (this.voicesReady) return true;

    const start = Date.now();
    return new Promise(resolve => {
      const tick = () => {
        if (this.voicesReady) return resolve(true);
        if (Date.now() - start >= timeoutMs) return resolve(false);
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  _pickVoice(languageKey) {
    const langCodes = this.supportedLanguages[languageKey] || [];
    if (!langCodes.length) return null;

    const list = this.voices;

    // 1) Exact match (best)
    for (const code of langCodes) {
      const v = list.find(v => v.lang && v.lang.toLowerCase() === code.toLowerCase());
      if (v) return v;
    }

    // 2) Prefix match (ru -> ru-RU)
    for (const code of langCodes) {
      const prefix = code.split('-')[0].toLowerCase();
      const v = list.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
      if (v) return v;
    }

    return null;
  }

  async speak(text, languageKey) {
    if (!this.synth) return;
    if (!text) return;

    // Ensure voices are available (critical on Safari/iOS)
    await this.waitForVoices();

    const voice = this._pickVoice(languageKey);
    if (!voice) {
      // If no matching voice exists, better to fail silently than pronounce with wrong locale
      console.warn(`No matching voice for ${languageKey}. Install a voice for:`, this.supportedLanguages[languageKey]);
      return;
    }

    // Cancel any ongoing speech to avoid queue stacking
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set BOTH voice and lang to avoid default-locale fallback
    utterance.voice = voice;
    utterance.lang = voice.lang;

    utterance.rate = 0.8;

    this.synth.speak(utterance);
  }

  isLanguageSupported(languageKey) {
    const langCodes = this.supportedLanguages[languageKey] || [];
    if (!this.voicesReady) return false;
    return this.voices.some(v =>
      langCodes.some(code => v.lang && v.lang.toLowerCase().startsWith(code.split('-')[0].toLowerCase()))
    );
  }
}

// Instantiate
const tts = new TTSPronunciation();
