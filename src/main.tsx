import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ClerkProvider, useAuth } from "@clerk/clerk-react"
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { UserSync } from './components/auth/UserSync'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

// Manejador de errores global para detectar fallos en Android sin consola
window.onerror = (message, _source, lineno, colno, _error) => {
  const errorMsg = document.createElement('div');
  errorMsg.style.position = 'fixed';
  errorMsg.style.bottom = '0';
  errorMsg.style.left = '0';
  errorMsg.style.right = '0';
  errorMsg.style.background = 'rgba(255,0,0,0.8)';
  errorMsg.style.color = 'white';
  errorMsg.style.padding = '10px';
  errorMsg.style.fontSize = '10px';
  errorMsg.style.zIndex = '99999';
  errorMsg.innerHTML = `⚠️ Error: ${message} <br/> at ${lineno}:${colno}`;
  document.body.appendChild(errorMsg);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <UserSync />
          <App />
        </BrowserRouter>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)
