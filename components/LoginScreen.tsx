import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { CoffeeIcon } from './icons/CoffeeIcon';
import Modal from './shared/Modal';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User, pin: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isAnimatingError, setIsAnimatingError] = useState(false);

  useEffect(() => {
    if (pin.length === 4 && selectedUser) {
        const success = onLogin(selectedUser, pin);
        if (!success) {
            setError('Invalid PIN');
            setIsAnimatingError(true);
            const timer = setTimeout(() => {
                setPin('');
                setError('');
                setIsAnimatingError(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }
  }, [pin, selectedUser, onLogin]);


  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

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
    <div className="bg-background min-h-screen w-full flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-12">
        <CoffeeIcon className="w-20 h-20 mx-auto text-primary mb-4" />
        <h1 className="text-5xl font-bold text-on-background tracking-tight">
          Welcome Back
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">Select your profile to sign in.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => handleUserSelect(user)}
            className="group bg-surface-container-low p-6 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center aspect-square w-48 h-48"
          >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-surface-container group-hover:bg-primary-container transition-colors`}>
              <span className={`text-6xl font-medium text-on-surface-variant group-hover:text-on-primary-container transition-colors`}>{user.name.charAt(0)}</span>
            </div>
            <p className="text-xl font-semibold text-on-surface">{user.name}</p>
            <p className="text-sm text-on-surface-variant capitalize">{user.role}</p>
          </div>
        ))}
      </div>
      
      {selectedUser && (
        <Modal title={`Enter PIN`} onClose={() => setSelectedUser(null)} containerClass="w-full max-w-[280px]">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-primary-container`}>
                  <span className={`text-3xl font-medium text-on-primary-container`}>{selectedUser.name.charAt(0)}</span>
                </div>
                <p className="text-base font-semibold text-on-surface">Hello, {selectedUser.name}</p>
            </div>

            <div className={`flex space-x-2 my-2 transition-transform duration-300 ${isAnimatingError ? 'translate-x-2' : ''}`}
                onAnimationEnd={() => setIsAnimatingError(false)}
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${isAnimatingError ? 'border-error' : 'border-outline'} ${i < pin.length ? (isAnimatingError ? 'bg-error' : 'bg-primary border-primary') : 'bg-transparent'}`}></div>
              ))}
            </div>

            <p className="text-error text-sm mb-1 h-4 font-medium">{error}</p>
            
            <div className="grid grid-cols-3 gap-2 my-2 w-full">
              {[...Array(9).keys()].map(i => (
                <button key={i} onClick={() => handlePinChange(String(i+1))} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all aspect-square flex justify-center items-center">
                  {i + 1}
                </button>
              ))}
              <div className="bg-transparent aspect-square"></div>
              <button onClick={() => handlePinChange('0')} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all aspect-square flex justify-center items-center">
                0
              </button>
              <button onClick={handleBackspace} className="text-xl font-medium p-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all aspect-square flex justify-center items-center">
                ⌫
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LoginScreen;