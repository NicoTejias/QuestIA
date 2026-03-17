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

// Manejador de errores global mejorado (solo para Android/Producción)
window.onerror = (message, _source, lineno, colno, _error) => {
  const containerId = 'global-error-log';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;background:rgba(20,20,20,0.95);color:#ff4d4d;padding:16px;border-radius:16px;font-size:11px;z-index:999999;border:1px solid rgba(255,77,77,0.3);box-shadow:0 10px 40px rgba(0,0,0,0.5);backdrop-filter:blur(10px);font-family:monospace;animation:slideUp 0.3s ease-out;';
    document.body.appendChild(container);
    
    const style = document.createElement('style');
    style.innerHTML = '@keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }';
    document.head.appendChild(style);
  }
  container.innerHTML = `<div style="display:flex;gap:12px;align-items:center;">
    <div style="background:#ff4d4d;color:white;padding:2px 6px;border-radius:4px;font-weight:bold;">ERROR</div>
    <div style="flex:1;">${message}<br/><span style="opacity:0.6;">at ${lineno}:${colno}</span></div>
    <button onclick="this.parentElement.parentElement.remove()" style="background:transparent;border:none;color:white;cursor:pointer;padding:4px;">✕</button>
  </div>`;
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
