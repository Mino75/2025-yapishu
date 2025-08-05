const style = document.createElement('style');
style.innerHTML = `
  /* Global dark mode styling */
  body {
    background-color: #1a0a2a;
    color: #ffffff;
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    text-align: center;
  }
  
  /* Header and logo styling */
  header {
    margin-top: 1rem;
  }
  
  #logo {
    width: 100px; /* Adjust size as needed */
    height: auto;
    display: block;
    margin: 0 auto;
  }
  
  h1 {
    margin: 1rem 0;
    font-size: 2rem;
  }
  
  /* Container for app content */
  #app {
    margin: 1rem auto;
    max-width: 90%;
  }
  
  /* Styling for select controls */
  select {
    background-color: #331c4c;
    color: #5de2f2;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    margin: 0.5rem;
    font-size: 1rem;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }
  
  /* Loading overlay */
  #loadingOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-size: 1.5rem;
    color: #5de2f2;
  }
  
  /* Buttons */
  button {
    background-color: #331c4c;
    color: #5de2f2;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.25rem;
    margin: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  button:hover {
    background-color: #5de2f2;
    color: #331c4c;
  }
  
  /* Canvas styling */
  /* Default on mobile: force full width */
  canvas {
    border: 3px solid #331c4c;
    margin-top: 1.5rem;
    background-color: #ffffff;
    cursor: crosshair;
    width: 100%;
    height: auto;
  }
  
  /* Translation display styling */
  #translationDisplay {
    font-size: 1.25rem;
    margin-top: 1rem;
    color: #5de2f2;
  }
  
  /* TTS */
  .tts-button {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    margin-left: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .tts-button:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .tts-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tts-button.speaking {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  /* POPUP MODAL STYLES */
  .popup-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .popup-content {
    background: white;
    border-radius: 10px;
    padding: 20px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    position: relative;
    color: #333;
  }
  
  .popup-header {
    margin-bottom: 15px;
  }
  
  .popup-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.2rem;
  }
  
  .popup-close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 0;
    margin: 0;
  }
  
  .popup-close-button:hover {
    color: #000;
    background: none;
  }
  
  .character-list-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 10px;
    background: #f9f9f9;
  }
  
  .character-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
  }
  
  .character-item:hover {
    background-color: #f0f0f0;
  }
  
  .character-item:last-child {
    border-bottom: none;
  }
  
  .character-main-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .character-word {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .character-translation {
    margin-left: 10px;
    color: #666;
    font-size: 14px;
  }
  
  .character-exercises-info {
    text-align: right;
  }
  
  .character-exercises-badge {
    background: #007bff;
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 12px;
    white-space: nowrap;
  }
  
  .no-characters-message {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 20px;
  }
  
  /* Responsive adjustments for larger screens */
  @media (min-width: 768px) {
    /* On desktop, force a fixed canvas size */
    canvas {
      width: 700px !important;
      height: 700px !important;
    }
    
    /* Increase select and button font sizes */
    select, button {
      font-size: 1.25rem;
      padding: 1rem 1.5rem;
    }
    
    #translationDisplay {
      font-size: 1.5rem;
    }
    
    .popup-content {
      max-width: 70%;
      max-height: 70%;
    }
    
    .character-list-container {
      max-height: 500px;
    }
  }
`;
document.head.appendChild(style);

// Export style helper functions for dynamic styling
window.styleHelpers = {
  createPopupModal: () => {
    const modal = document.createElement('div');
    modal.className = 'popup-modal';
    return modal;
  },
  
  createPopupContent: () => {
    const popup = document.createElement('div');
    popup.className = 'popup-content';
    return popup;
  },
  
  createPopupHeader: (title, onClose) => {
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = `
      <h3>${title}</h3>
      <button class="popup-close-button">✖</button>
    `;
    
    const closeButton = header.querySelector('.popup-close-button');
    closeButton.addEventListener('click', onClose);
    
    return header;
  },
  
  createCharacterListContainer: () => {
    const container = document.createElement('div');
    container.className = 'character-list-container';
    return container;
  },
  
  createCharacterItem: (character, selectedFont, onClick) => {
    const item = document.createElement('div');
    item.className = 'character-item';
    
    item.innerHTML = `
      <div class="character-main-info">
        <div class="character-word" style="font-family: ${selectedFont};">${character.word}</div>
        <div class="character-translation">${character.translation}</div>
      </div>
      <div class="character-exercises-info">
        <span class="character-exercises-badge">
          ${character.exercises} exercises
        </span>
      </div>
    `;
    
    item.addEventListener('click', () => onClick(character));
    
    return item;
  },
  
  showNoCharactersMessage: (container) => {
    container.innerHTML = '<div class="no-characters-message">No characters found for the current filters.</div>';
  }
};
