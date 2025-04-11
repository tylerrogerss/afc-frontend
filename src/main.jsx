// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';            // Import the App component
import './index.css';               // Import global styles (Tailwind or other CSS)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />                         // Use App to manage routes
  </React.StrictMode>
);
