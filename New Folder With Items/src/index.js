import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // if you have global Tailwind or reset CSS
import App from './App';

// React 18 syntax: createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);