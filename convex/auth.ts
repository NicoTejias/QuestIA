import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { normalizeRut } from "./rutUtils";

const CustomPassword = Password({
  profile(params) {
    const role = (params.role as string) || "student";
    let studentId = (params.student_id as string) || "";
    
    // Normalizar RUT si es alumno para que coincida con la whitelist del docente
    if (role === "student" && studentId) {
      studentId = normalizeRut(studentId);
    }

    return {
      email: params.email as string,
      name: params.name as string,
      role,
      student_id: studentId,
      is_verified: false,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});
