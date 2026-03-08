import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <Navbar />
      <main className="flex-1" style={{ backgroundColor: 'transparent' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
