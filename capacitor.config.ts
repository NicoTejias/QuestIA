import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duocencia.app',
  appName: 'DuocencIA',
  webDir: 'dist',
  server: {
    url: 'https://duocencia.vercel.app', // Cambia esto por tu URL de Vercel real
    cleartext: true
  }
};


export default config;
