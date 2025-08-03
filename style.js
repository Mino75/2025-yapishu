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
    #translationDisplay {
      font-size: 1.5rem;
    }
  }
`;
document.head.appendChild(style);
