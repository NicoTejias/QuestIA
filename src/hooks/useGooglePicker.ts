// Google Drive Integration Hook
import { useEffect, useState } from "react";

// Limpieza agresiva de caracteres invisibles y espacios
const cleanEnvVar = (val: string | undefined) => (val || '').replace(/[^\x20-\x7E]/g, '').trim();

const CLIENT_ID = cleanEnvVar(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const API_KEY = cleanEnvVar(import.meta.env.VITE_GOOGLE_API_KEY);
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

export function useGooglePicker() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Debug logs (Safe & Detailed)
  useEffect(() => {
    if (CLIENT_ID || API_KEY) {
      console.log("🔍 Google API Configuration Status:", {
        clientId: {
          exists: !!CLIENT_ID,
          length: CLIENT_ID.length,
          endsWithCorrectDomain: CLIENT_ID.endsWith('.apps.googleusercontent.com'),
        },
        apiKey: {
          exists: !!API_KEY,
          length: API_KEY.length,
          start: API_KEY.slice(0, 7) + "...", // Mostrar inicio para verificar
          end: "..." + API_KEY.slice(-4)
        },
        origin: window.location.origin
      });
    }
  }, []);

  useEffect(() => {
    // Cargar librerías de Google... (sin cambios en la carga de scripts)
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.async = true;
      gapiScript.onload = () => setIsLoaded(true);
      document.body.appendChild(gapiScript);
    };
    document.body.appendChild(script);
  }, []);

  const authenticate = () => {
    return new Promise<string>((resolve, reject) => {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        prompt: 'select_account',
        hint: 'ni.tejias@profesor.duoc.cl', // Ayuda a Google a preseleccionar tu cuenta
        callback: (response: any) => {
          if (response.error) {
            reject(response);
          }
          setAccessToken(response.access_token);
          resolve(response.access_token);
        },
      });
      client.requestAccessToken();
    });
  };

  const openPicker = async (onFileSelected: (file: any, accessToken: string) => void) => {
    if (!isLoaded) return;

    let token = accessToken;
    if (!token) {
      token = await authenticate();
    }

    const gapi = (window as any).gapi;
    gapi.load("picker", () => {
      const pickerWindow = (window as any).google.picker;
      
      // Vista de navegación jerárquica desde la raíz
      const docsView = new pickerWindow.DocsView(pickerWindow.ViewId.DOCS)
        .setIncludeFolders(true)
        .setParent('root'); // Fuerza el inicio en la raíz de la unidad
      
      const pickerBuilder = new pickerWindow.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setOrigin(window.location.origin)
        .setCallback((data: any) => {
          if (data.action === pickerWindow.Action.PICKED) {
            onFileSelected(data.docs[0], token!);
          }
        });

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    });
  };

  const downloadFile = async (fileId: string, accessToken: string): Promise<Blob> => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      // Si falla, es posible que sea un Google Doc nativo que requiere exportación
      const metadataResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const metadata = await metadataResponse.json();
      
      let exportMimeType = '';
      if (metadata.mimeType === 'application/vnd.google-apps.document') exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (metadata.mimeType === 'application/vnd.google-apps.spreadsheet') exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (metadata.mimeType === 'application/vnd.google-apps.presentation') exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

      if (exportMimeType) {
        const exportResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMimeType}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return await exportResponse.blob();
      }

      throw new Error("No se pudo descargar el archivo de Google Drive.");
    }
    return await response.blob();
  };

  return { openPicker, downloadFile, isLoaded };
}
