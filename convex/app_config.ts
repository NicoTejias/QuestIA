import { query } from "./_generated/server";

export const getLatestConfig = query({
  args: {},
  handler: async (ctx) => {
    try {
      // En el futuro esto podría venir de una tabla 'config'
      return {
        latestVersion: "1.0.3",
        downloadUrl: "https://duocenc-ia.vercel.app/download-apk", 
        isMandatory: true,
        message: "Hay una nueva versión mayor disponible. Es necesario actualizar para seguir usando todas las funciones de IA y notificaciones."
      };
    } catch (error) {
      console.error("Error in getLatestConfig:", error);
      return null;
    }
  },
});
