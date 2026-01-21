import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="font-black text-2xl tracking-tighter italic animate-pulse">
        DRIVE<span className="text-blue-500">PRO</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
