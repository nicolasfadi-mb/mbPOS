import React from 'react';
import Modal from './Modal';

interface HelpModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const HelpModal: React.FC<HelpModalProps> = ({ title, onClose, children }) => {
  return (
    <Modal title={title} onClose={onClose} containerClass="max-w-2xl">
      <div className="text-on-surface-variant max-h-[60vh] overflow-y-auto pr-4 space-y-4">
        {children}
      </div>
    </Modal>
  );
};

export default HelpModal;
