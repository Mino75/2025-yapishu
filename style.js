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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Header and logo styling */
  header {
    margin-top: 1rem;
  }
  
  #logo {
    width: 100px;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  
  h1 {
    margin: 1rem 0;
    font-size: 2rem;
    color: #5de2f2;
  }
  
  /* Controls section */
  #controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    margin: 1rem auto;
    max-width: 90%;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .control-group label {
    font-size: 0.9rem;
    color: #5de2f2;
    font-weight: bold;
  }
  
  /* Container for app content */
  #app {
    margin: 1rem auto;
    max-width: 90%;
    flex: 1;
  }
  
  /* Styling for select controls */
  select {
    background-color: #331c4c;
    color: #5de2f2;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin: 0.25rem;
    font-size: 1rem;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 150px;
  }
  
  select:hover {
    border-color: #5de2f2;
    background-color: #402060;
  }
  
  select:focus {
    outline: none;
    border-color: #5de2f2;
    box-shadow: 0 0 0 3px rgba(93, 226, 242, 0.2);
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
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    margin: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
  }
  
  button:hover:not(:disabled) {
    background-color: #5de2f2;
    color: #331c4c;
    transform: translateY(-2px);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Canvas container and styling */
  #canvas-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2rem auto;
    max-width: 100%;
  }
  
  canvas {
    border: 3px solid #331c4c;
    background-color: #ffffff;
    cursor: crosshair;
    width: 100%;
    height: auto;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  #canvas-controls {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  #canvas-controls button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  /* Translation display styling */
  #translationDisplay {
    font-size: 1.25rem;
    margin: 1rem auto;
    color: #5de2f2;
    max-width: 90%;
    padding: 1rem;
    background: rgba(51, 28, 76, 0.3);
    border-radius: 8px;
    border: 1px solid #331c4c;
  }
  
  /* TTS Button styling */
  .tts-button {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    margin-left: 8px;
    border-radius: 4px;
    transition: all 0.2s;
    color: #5de2f2;
  }

  .tts-button:hover:not(:disabled) {
    background-color: rgba(93, 226, 242, 0.2);
    transform: scale(1.1);
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
    50% { transform: scale(1.2); }
  }
  
  /* Responsive adjustments for larger screens */
  @media (min-width: 768px) {
    canvas {
      width: 700px !important;
      height: 700px !important;
      max-width: none;
    }
    
    #controls {
      gap: 2rem;
    }
    
    select, button {
      font-size: 1.25rem;
      padding: 1rem 1.5rem;
    }
    
    #translationDisplay {
      font-size: 1.5rem;
      max-width: 700px;
    }
    
    .control-group label {
      font-size: 1rem;
    }
  }
  
  /* Animation classes for dynamic content */
  .fade-in {
    animation: fadeIn 0.5s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .slide-in {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);
