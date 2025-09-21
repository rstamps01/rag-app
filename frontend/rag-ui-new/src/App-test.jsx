import React from 'react';

console.log('🔍 App-test.jsx is loading...');

function App() {
  console.log('🔍 App component is rendering...');
  
  // Add a fallback that writes directly to the document
  React.useEffect(() => {
    console.log('🔍 useEffect is running...');
    
    // As a last resort, directly manipulate the DOM
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && !root.innerHTML.includes('React App Working')) {
        console.log('🔍 Adding fallback content to DOM...');
        root.innerHTML = `
          <div style="padding: 20px; background-color: #1f2937; color: white; min-height: 100vh; font-family: Arial, sans-serif;">
            <h1 style="color: #3b82f6; margin-bottom: 20px;">🎯 React App Working! (Fallback)</h1>
            <p>✅ If you can see this, the JavaScript is executing.</p>
            <p>🕒 Current time: ${new Date().toLocaleString()}</p>
            <p>📍 Current URL: ${window.location.pathname}</p>
          </div>
        `;
      }
    }, 100);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1f2937', 
      color: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '20px' }}>
        🎯 React App Working!
      </h1>
      <p style={{ marginBottom: '10px' }}>
        ✅ If you can see this, React is working correctly.
      </p>
      <p style={{ marginBottom: '10px' }}>
        🕒 Current time: {new Date().toLocaleString()}
      </p>
      <p style={{ marginBottom: '10px' }}>
        📍 Current URL: {window.location.pathname}
      </p>
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        border: '1px solid #4b5563'
      }}>
        <h2 style={{ color: '#10b981', marginBottom: '10px' }}>Status Check</h2>
        <p>✅ React: Working</p>
        <p>✅ Vite: Working</p>
        <p>✅ CSS: Working</p>
      </div>
    </div>
  );
}

export default App;
