import React from 'react';
import { X } from 'lucide-react';
import LoginView from './LoginView';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-zinc-900/80 text-zinc-400 hover:text-white rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="max-h-[90vh] overflow-y-auto no-scrollbar rounded-[3.5rem]">
           <LoginView onLogin={onLogin} />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
