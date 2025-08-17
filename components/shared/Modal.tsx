import React, { useEffect, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  containerClass?: string;
}

// Global counter for open modals
let openModalCount = 0;

const Modal: React.FC<ModalProps> = ({ title, onClose, children, containerClass = 'w-11/12 max-w-lg' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // When component mounts, increment count and add class if it's the first modal
    openModalCount++;
    document.body.classList.add('modal-open');

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // When component unmounts, decrement count and remove class if it's the last modal
    return () => {
      openModalCount--;
      if (openModalCount === 0) {
        document.body.classList.remove('modal-open');
      }
      window.removeEventListener('keydown', handleEsc);
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  return (
    <div 
        ref={modalRef}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className={`glass-morphism rounded-4xl shadow-2xl p-6 md:p-8 w-full relative animate-slide-in-up ${containerClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-on-surface">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-on-surface bg-surface-container-high/50 hover:bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;