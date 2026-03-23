import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";

export function UserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    
    const hasError = new URLSearchParams(window.location.search).has("error");
    
    if (isAuthenticated && !isLoading && !hasError) {
      hasSynced.current = true;
      
      const timeout = setTimeout(() => {
        storeUser()
          .then(() => {})
          .catch((err) => {
            console.error("User sync error:", err.message);
            if (err.message.includes("institucionales") || err.message.includes("permiten") || err.message.includes("autorizado")) {
              window.location.replace("/auth-error?error=" + encodeURIComponent(err.message));
            }
          });
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isLoading, storeUser]);

  return null;
}
