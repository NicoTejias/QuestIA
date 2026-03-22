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

// Pantalla de carga inicial mientras React carga
const initialHtml = document.getElementById('root')?.innerHTML || ''
if (initialHtml) {
  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;background:#0f172a;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="width:48px;height:48px;border:4px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        <p style="color:#94a3b8;font-family:system-ui;">Cargando QuestIA...</p>
      </div>
    </div>
  `
}

// Manejador de errores global mejorado
window.onerror = (message, _source, lineno, colno, _error) => {
  console.error('Global error:', message, 'at', lineno, ':', colno)
  
  // Solo mostrar errores graves en producción
  if (import.meta.env.PROD && typeof message === 'string' && !message.includes('ResizeObserver')) {
    const container = document.getElementById('root')
    if (container) {
      container.innerHTML = `
        <div style="min-height:100vh;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui;">
          <div style="width:64px;height:64px;background:rgba(239,68,68,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <svg width="32" height="32" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h1 style="color:#fff;font-size:20px;margin-bottom:8px;">Error de la Aplicación</h1>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Por favor, recarga la página o cierra y abre la app nuevamente.</p>
          <button onclick="window.location.reload()" style="background:#6366f1;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">
            Recargar Página
          </button>
        </div>
      `
    }
  }
};

// Manejador de Promise rejections no controladas
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
}

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
