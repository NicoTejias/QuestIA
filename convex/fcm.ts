import { action } from "./_generated/server";
import { v } from "convex/values";

// Nota: Para enviar notificaciones desde el servidor (Convex), 
// necesitamos la "Service Account Key" de Firebase.
// El usuario debe poner el contenido del JSON en una variable de entorno llamada FIREBASE_SERVICE_ACCOUNT

export const sendPushNotification = action({
  args: {
    token: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountStr) {
      console.error("FIREBASE_SERVICE_ACCOUNT no configurada en Convex");
      return;
    }

    // Aquí iría la lógica para obtener el token de acceso de Google OAuth2 y llamar a la API de FCM v1.
    // Como es un proceso complejo (firmar JWT), avisaremos al usuario para que configure 
    // una herramienta como 'google-auth-library' o usaremos un helper.
    
    // Por ahora, dejaremos el log para debugear
    console.log(`Simulando envío de notificación a ${args.token}: ${args.title}`);
  },
});
