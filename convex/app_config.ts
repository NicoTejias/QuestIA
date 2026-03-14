import { query } from "./_generated/server";

export const getLatestConfig = query({
  args: {},
  handler: async () => {
    // En el futuro esto podría venir de una tabla 'config'
    // Por ahora lo dejamos hardcoded para que sea fácil de cambiar sin migraciones
    return {
      latestVersion: "1.0.3",
      downloadUrl: "https://duocenc-ia.vercel.app/download-apk", // Cambia esto al link real del APK
      isMandatory: true,
      message: "Hay una nueva versión mayor disponible. Es necesario actualizar para seguir usando todas las funciones de IA y notificaciones."
    };
  },
});
