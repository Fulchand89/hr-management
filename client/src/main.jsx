import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './index.css';

// Gracefully handle benign browser errors and canceled requests
window.addEventListener('unhandledrejection', (event) => {
  if (
    event?.reason?.name === 'CanceledError' ||
    event?.reason?.code === 'ERR_CANCELED' ||
    event?.reason?.message?.includes('canceled')
  ) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (
    event?.message &&
    (event.message.includes('ResizeObserver loop') ||
     event.message.includes('ResizeObserver loop completed'))
  ) {
    event.stopImmediatePropagation();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
