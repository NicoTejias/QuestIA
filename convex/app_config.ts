import { query } from "./_generated/server";

export const getLatestConfig = query({
  args: {},
  handler: async (_ctx) => {
    try {
      // En el futuro esto podría venir de una tabla 'config'
      return {
        latestVersion: "1.0.11",
        downloadUrl: "https://github.com/NicoTejias/DuocencIA/releases/download/v.1.0.11/Quest.1.0.11.apk", 
        isMandatory: true,
        message: "¡Nueva versión 1.0.11 disponible! Hemos solucionado el error de inicio de sesión, optimizado el diseño para móviles y añadido la nueva sección de Ayuda/FAQ."
      };
    } catch (error) {
      console.error("Error in getLatestConfig:", error);
      return null;
    }
  },
});
