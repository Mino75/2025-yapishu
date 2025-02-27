// db.js
const DB_NAME = 'CharacterDB';
const DB_VERSION = 1;
let db;

function openDatabase(callback) {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('data')) {
      db.createObjectStore('data', { keyPath: 'id' });
    }
  };
  request.onsuccess = function(event) {
    db = event.target.result;
    callback();
  };
  request.onerror = function(event) {
    console.error("IndexedDB error:", event);
    callback(); // even if error, continue
  };
}

function loadData(callback) {
  const transaction = db.transaction('data', 'readonly');
  const store = transaction.objectStore('data');
  const request = store.get('languages');
  request.onsuccess = function() {
    callback(request.result ? request.result.data : null);
  };
  request.onerror = function() {
    callback(null);
  };
}

function saveData(data, callback) {
  const transaction = db.transaction('data', 'readwrite');
  const store = transaction.objectStore('data');
  const request = store.put({ id: 'languages', data: data });
  request.onsuccess = function() {
    if (callback) callback();
  };
  request.onerror = function() {
    if (callback) callback();
  };
}

function updateCharacter(lang, updatedCharacter, currentData, callback) {
  currentData[lang] = currentData[lang].map(item => item.word === updatedCharacter.word ? updatedCharacter : item);
  saveData(currentData, () => {
    if (callback) callback();
  });
}

// Expose functions globally
window.dbFunctions = {
  openDatabase,
  loadData,
  saveData,
  updateCharacter
};
