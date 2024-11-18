import React, { useState, useEffect } from 'react';
import './Keyboard.css'; // Import CSS for animation

type KeyboardProps = {
  onKeyPress: (key: string) => void;
  onClose: () => void;
};

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, onClose }) => {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [backspaceInterval, setBackspaceInterval] = useState<NodeJS.Timeout | null>(null);

  const keys = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
    'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace',
    '.', ',', 'Enter', 'Space', 'Shift'
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'Space') {
      onKeyPress(' ');
    } else if (key === 'Enter') {
      onKeyPress('Enter');
    } else if (key === 'Shift') {
      setIsShiftActive(!isShiftActive);
    } else if (key === 'Backspace') {
      onKeyPress('Backspace');
      startBackspaceInterval();
    } else {
      onKeyPress(isShiftActive ? key.toUpperCase() : key);
      setIsShiftActive(false);
    }
  };

  const startBackspaceInterval = () => {
    if (backspaceInterval) return; // Prevent multiple intervals
    const interval = setInterval(() => {
      onKeyPress('Backspace');
    }, 100); // Adjust the speed of backspace here
    setBackspaceInterval(interval);
  };

  const stopBackspaceInterval = () => {
    if (backspaceInterval) {
      clearInterval(backspaceInterval);
      setBackspaceInterval(null);
    }
  };

  return (
    <div className="keyboard-container">
      <div className="keyboard">
        {keys.map((key) => (
          <button
            key={key}
            className={`key ${key === 'Space' ? 'space-key' : ''} ${key === 'Enter' ? 'enter-key' : ''} ${key === 'Shift' ? 'shift-key' : ''}`}
            onMouseDown={() => handleKeyPress(key)}
            onMouseUp={stopBackspaceInterval}
            onMouseLeave={stopBackspaceInterval}
            onTouchStart={() => handleKeyPress(key)}
            onTouchEnd={stopBackspaceInterval}
          >
            {isShiftActive && key.match(/[a-z]/) ? key.toUpperCase() : key}
          </button>
        ))}
      </div>
      <button className="close-btn" onClick={onClose}>Close</button>
    </div>
  );
};

export default Keyboard;
