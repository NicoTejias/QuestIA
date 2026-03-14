import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.duocencia.app',
  appName: 'DuocencIA',
  webDir: 'dist',
  server: {
    url: 'https://duocenc-ia.vercel.app',
    cleartext: true
  }
};

export default config;
