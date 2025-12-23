import React from 'react';
import ThreeBackground from './ThreeBackground';

const AuthLayout = ({ children }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <ThreeBackground />
      <div className="z-10 w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
