import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CashOutPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const CashOutPopup: React.FC<CashOutPopupProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      console.log('Popup is open, starting fingerprint match...');
      handleFingerprintMatch();
    }
  }, [isOpen]);

  const handleFingerprintMatch = async () => {
    setIsLoading(true);
    setMessage('Please wait, scanning your fingerprint...');
    console.log('Attempting to check fingerprint match...');

    try {
      const response = await axios.get('http://localhost:8000/api/check_fingerprint_match/');
      console.log('Response from server:', response.data);

      if (response.data.status === 'success') {
        setMessage('Vault successfully opened');
        await controlRelay(true); // Turn on the relay
      } else {
        setMessage('Unrecognized fingerprint');
      }
    } catch (error) {
      setMessage('Error checking fingerprint match. Please try again.');
      console.error('Fingerprint match error:', error);
    }

    setIsLoading(false);
  };

  const controlRelay = async (turnOn: boolean) => {
    try {
      const response = await axios.post('http://localhost:8000/api/control_relay/', {
        state: turnOn ? 'on' : 'off', // 'on' to turn on, 'off' to turn off
      });

      if (response.status === 200) {
        console.log(`Relay turned ${turnOn ? 'on' : 'off'}`);
      } else {
        console.error('Failed to control relay');
      }
    } catch (error) {
      console.error('Error controlling relay:', error);
    }
  };

  const handleClose = () => {
    controlRelay(false); // Turn off the relay when closing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg relative">
        <button onClick={handleClose} className="absolute top-2 right-2 text-lg p-2">
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Fingerprint Verification</h2>
        <p>{message}</p>
        <div className="mt-4">
          <img src="public/images/fingerprint_holder.png" alt="Fingerprint Scanner" className="mx-auto h-20 w-20"/>
        </div>
        {isLoading && <p className="text-center mt-4">Loading...</p>}
      </div>
    </div>
  );
};

export default CashOutPopup;

