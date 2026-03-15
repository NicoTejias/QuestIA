import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";

export function UserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    // Solo intentar sincronizar si estamos autenticados y NO hay errores previos en la URL
    const hasError = new URLSearchParams(window.location.search).has("error");
    
    if (isAuthenticated && !isLoading && !hasError) {
      storeUser()
        .then((res) => {
          console.log("✅ User synchronized successfully:", res);
        })
        .catch((err) => {
          console.error("Sync error:", err);
          // Si el error es de dominio, redirigir y PARAR el bucle
          if (err.message.includes("institucionales") || err.message.includes("permiten")) {
            window.location.replace("/auth-error?error=" + encodeURIComponent(err.message));
          }
        });
    }
  }, [isAuthenticated, isLoading, storeUser]);

  return null;
}
