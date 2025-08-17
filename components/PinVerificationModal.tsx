import React, { useState, useEffect } from 'react';
import Modal from './shared/Modal';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface PinVerificationModalProps {
  deletionPin: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({ deletionPin, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pin.length === 4) {
        if (pin === deletionPin) {
            onSuccess();
        } else {
            setError('Invalid PIN. Please try again.');
            const timer = setTimeout(() => {
                setPin('');
                setError('');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }
  }, [pin, deletionPin, onSuccess]);

  const handlePinChange = (value: string) => {
    if (error) setError('');
    if (pin.length < 4) {
      setPin(prevPin => prevPin + value);
    }
  };

  const handleBackspace = () => {
    if (error) setError('');
    setPin(prevPin => prevPin.slice(0, -1));
  };

  return (
    <Modal title="Admin Approval Required" onClose={onClose} containerClass="w-full max-w-[280px]">
        <div className="flex flex-col items-center">
            <LockClosedIcon className="w-8 h-8 text-primary mb-2"/>
            <p className="text-center text-on-surface-variant mb-2 text-xs">Enter the 4-digit manager PIN to authorize this action.</p>
            <div className="flex space-x-2 my-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border-2 transition-colors ${i < pin.length ? 'bg-primary border-primary' : 'bg-surface-container-high border-outline'}`}></div>
                ))}
            </div>
            {error && <p className="text-error text-sm mb-1 h-4">{error}</p>}
            {!error && <div className="h-4 mb-1"></div>}
            
            <div className="grid grid-cols-3 gap-1.5 my-2 w-full">
              {[...Array(9).keys()].map(i => (
                <button key={i} onClick={() => handlePinChange(String(i+1))} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-colors aspect-square flex items-center justify-center">
                  {i + 1}
                </button>
              ))}
              <div className="aspect-square"></div>
              <button onClick={() => handlePinChange('0')} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-colors aspect-square flex items-center justify-center">
                0
              </button>
              <button onClick={handleBackspace} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-colors aspect-square flex items-center justify-center">
                ⌫
              </button>
            </div>
        </div>
    </Modal>
  );
};

export default PinVerificationModal;