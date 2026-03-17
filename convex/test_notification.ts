"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const sendTestPushByEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // 1. Buscar al usuario por email
    const users = await ctx.runQuery(api.users.getProfileByEmail, { email: args.email });
    
    if (!users) {
      return { success: false, message: "Usuario no encontrado" };
    }

    if (!users.push_token) {
      return { success: false, message: "El usuario no tiene un token de notificación registrado (debe abrir la app y aceptar permisos)" };
    }

    // 2. Enviar notificación
    await ctx.runAction(api.fcm.sendPushNotification, {
      token: users.push_token,
      title: "Prueba de Quest 🚀",
      body: "¡Hola! Esta es una notificación de prueba para verificar que el sistema funciona correctamente.",
    });

    return { success: true, message: "Notificación enviada" };
  },
});
