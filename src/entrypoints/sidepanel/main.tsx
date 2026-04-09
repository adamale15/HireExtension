import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../../assets/styles.css';
import { initializeFirebase } from '../../lib/firebase';

// Initialize Firebase
initializeFirebase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
