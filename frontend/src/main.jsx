import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import AnimatedBackground from './components/AnimatedBackground.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import BackToTop from './components/BackToTop.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            {/* Global ambient animated background — stays behind everything */}
            <AnimatedBackground />

            {/* Custom premium cursor — desktop only */}
            <CustomCursor />

            {/* Scroll & routing utilities */}
            <ScrollToTop />

            {/* Animated back-to-top */}
            <BackToTop />

            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);