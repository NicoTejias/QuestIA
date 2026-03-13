// Google Drive Integration Hook
import { useEffect, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY?.trim() || '';
const APP_ID = CLIENT_ID.split('-')[0] || '';
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

export function useGooglePicker() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Cargar librerías de Google
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
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView(new (window as any).google.picker.DocsView().setParent('root')) // Ver archivos del usuario
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setAppId(APP_ID)
        .setCallback(async (data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const file = data.docs[0];
            onFileSelected(file, token!);
          }
        })
        .build();
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
