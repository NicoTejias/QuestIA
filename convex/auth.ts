import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { normalizeRut } from "./rutUtils";

const CustomPassword = Password({
  profile(params) {
    const role = (params.role as string) || "student";
    const email = (params.email as string).toLowerCase();
    
    // 1. RESTRICCIÓN DE DOCENTES: Solo dominios autorizados de QuestIA
    if (role === "teacher") {
        const allowedDomains = ["@questia.cl", "@duocuc.cl", "@profesor.duoc.cl", "@duoc.cl"];
        const isAllowed = allowedDomains.some(domain => email.endsWith(domain));
        
        if (!isAllowed) {
            throw new Error(`Acceso denegado: El correo "${email}" no es institucional. Use su cuenta autorizada.`);
        }
    }

    let studentId = (params.student_id as string) || "";
    if (role === "student" && studentId) {
      studentId = normalizeRut(studentId);
    }

    return {
      email,
      name: params.name as string,
      role,
      student_id: studentId,
      is_verified: true,
    };
  },
});

const CustomGoogle = Google({
  profile(profile) {
    const email = profile.email?.toLowerCase() || "";
    const allowedDomains = ["@questia.cl", "@duocuc.cl", "@profesor.duoc.cl", "@duoc.cl"];
    const isAllowed = allowedDomains.some(domain => email.endsWith(domain));

    if (!isAllowed) {
      throw new Error("Solo se permiten correos institucionales de QuestIA.");
    }

    // Por defecto asumimos que un login de Google institucional es un alumno
    // a menos que el correo sea explícitamente de profesor
    const isTeacherEmail = email.includes("@profesor.duoc.cl") || email.includes("@duoc.cl") || email.includes("@questia.cl");
    
    return {
      email,
      name: profile.name,
      image: profile.picture,
      role: isTeacherEmail ? "teacher" : "student",
      is_verified: true,
      // El student_id (RUT) se dejará vacío inicialmente si es nuevo usuario
      // El sistema pedirá completarlo si es alumno y no lo tiene
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword, CustomGoogle],
});
