import React, { useState } from 'react';
import Modal from './shared/Modal';

interface QuantityModalProps {
    onClose: () => void;
    onSetQuantity: (qty: number) => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({ onClose, onSetQuantity }) => {
    const [quantityStr, setQuantityStr] = useState('');

    const handleInput = (digit: string) => {
        if (quantityStr.length < 3) {
            setQuantityStr(prev => prev + digit);
        }
    };

    const handleBackspace = () => {
        setQuantityStr(prev => prev.slice(0, -1));
    };

    const handleSet = () => {
        const qty = parseInt(quantityStr, 10);
        if (qty > 0) {
            onSetQuantity(qty);
        } else {
            onClose();
        }
    };

    return (
        <Modal title="Enter Quantity" onClose={onClose}>
            <div className="flex flex-col items-center">
                <div className="w-full text-center text-4xl font-bold bg-surface-container p-4 rounded-xl mb-6 h-20 flex items-center justify-center">
                    {quantityStr || '1'}
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    {[...Array(9).keys()].map(i => (
                        <button key={i} onClick={() => handleInput(String(i + 1))} className="text-2xl font-medium p-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors aspect-square">
                            {i + 1}
                        </button>
                    ))}
                    <button onClick={handleBackspace} className="text-2xl font-medium p-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                        ⌫
                    </button>
                    <button onClick={() => handleInput('0')} className="text-2xl font-medium p-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                        0
                    </button>
                    <button onClick={handleSet} className="text-xl font-medium p-4 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors">
                        SET
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default QuantityModal;