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
app.appendChild(fontSelect);

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
const clearDataButton = document.createElement('button');
clearDataButton.textContent = '🗑️ Clear Data';
clearDataButton.id = 'clearDataButton';
app.appendChild(clearDataButton);

const exportButton = document.createElement('button');
exportButton.textContent = '📤 Export Score';
exportButton.id = 'exportButton';
app.appendChild(exportButton);

const importButton = document.createElement('button');
importButton.textContent = '📥 Import Score';
importButton.id = 'importButton';
app.appendChild(importButton);

const skipButton = document.createElement('button');
skipButton.textContent = '⏭️ Skip';
skipButton.id = 'skipButton';
app.appendChild(skipButton);

const reviewButton = document.createElement('button');
reviewButton.textContent = '📋 Review';
reviewButton.id = 'reviewButton';
app.appendChild(reviewButton);

// ----------------------------
// GLOBAL VARIABLES
// ----------------------------
let characterData = null;
let selectedLanguage = languageSelect.value;
let selectedFont = fontSelect.value;
let characterList = [];
let currentCharacter = null; // Currently exercised character
let drawing = false;

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

// Skip button: immediately move to the next exercise without modifying scores
skipButton.addEventListener('click', () => {
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
        return c.levels.split(', ').some(level => level.trim() === levelFilter);
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

// Generate progress bar HTML and emojis based on exercise count
function getProgressHTML(exCount) {
  const progressBar = `<progress max="50" value="${exCount}"></progress>`;
  let emojis = '';
  if (exCount >= 20) { emojis += ' 🎉'; }
  if (exCount >= 30) { emojis += ' 🎉'; }
  if (exCount >= 50) { emojis += ' 🎉'; }
  return progressBar + emojis;
}

// Start a training exercise by selecting a character with the fewest exercises from the filtered list
function startTrainingExercise() {
  let fullList = characterData[selectedLanguage] || [];
  
  // Apply level filter
  const levelFilter = levelFilterSelect.value;
  if (levelFilter !== 'all') {
    fullList = fullList.filter(c => {
      if (selectedLanguage === 'chinese_simplified') {
        return c.level === levelFilter;
      } else if (selectedLanguage === 'japanese' && c.tags) {
        return c.tags.split(' ').some(tag => tag === levelFilter);
      } else if (selectedLanguage === 'russian' && c.levels) {
        return c.levels.split(', ').some(level => level.trim() === levelFilter);
      }
      return true;
    });
  }
  
  // Apply tag filter
  const tagFilter = tagFilterSelect.value;
  if (tagFilter !== 'all') {
    fullList = fullList.filter(c => c.tags && c.tags.split(' ').includes(tagFilter));
  }
  
  if (!fullList.length) {
    translationDisplay.innerHTML = 'Aucun caractère ne correspond aux filtres sélectionnés.';
    return;
  }
  
  const minExercises = Math.min(...fullList.map(c => c.exercises));
  const candidates = fullList.filter(c => c.exercises === minExercises);
  currentCharacter = candidates[Math.floor(Math.random() * candidates.length)];
  
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
// TTS FUNCTIONS
// ----------------------------

class TTSPronunciation {
  constructor() {
    this.synth = window.speechSynthesis;
    this.supportedLanguages = {
      'japanese': ['ja', 'ja-JP'],
      'chinese_simplified': ['zh', 'zh-CN'],
      'russian': ['ru', 'ru-RU']
    };
  }
  
  isLanguageSupported(language) {
    if (!this.synth) return false;
    const voices = this.synth.getVoices();
    const langCodes = this.supportedLanguages[language] || [];
    return voices.some(voice => 
      langCodes.some(code => voice.lang.startsWith(code))
    );
  }
  
  speak(text, language) {
    if (!this.isLanguageSupported(language)) return;
    
    const voices = this.synth.getVoices();
    const langCodes = this.supportedLanguages[language];
    const voice = voices.find(v => 
      langCodes.some(code => v.lang.startsWith(code))
    );
    
    if (voice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = 0.8;
      this.synth.speak(utterance);
    }
  }
}

// Instantiate TTS after global variables
const tts = new TTSPronunciation();
