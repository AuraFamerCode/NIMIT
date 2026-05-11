import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastProvider } from './hooks/useToast'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './styles/theme'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ToastProvider>
  </React.StrictMode>
)