# Diseño: Mejoras en Feedback y Juego de Relacionar

## 1. Múltiples Imágenes en Feedback

### 1.1 Esquema de Base de Datos (Convex)
Actualizar la tabla `feedback` en `convex/schema.ts`:
```typescript
    feedback: defineTable({
        user_id: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("bug"), v.literal("suggestion"), v.literal("opinion")),
        created_at: v.number(),
        page_url: v.optional(v.string()),
        image_urls: v.optional(v.array(v.string())), // Nueva lista de URLs de imágenes
    }).index("by_user", ["user_id"]),
```

### 1.2 Mutaciones (Convex)
Actualizar `convex/feedback.ts`:
*   La mutación `sendFeedback` debe aceptar el argumento opcional `image_urls`.

### 1.3 Interfaz de Usuario (`FeedbackButton.tsx`)
*   **Estado Nuevo:** `const [selectedFiles, setSelectedFiles] = useState<File[]>([]);`.
*   **Zona de Subida:** Añadir un input de archivo invisible activado por un botón "+" en una lista de miniaturas.
*   **Previsualización:** Generar URLs locales con `URL.createObjectURL` para mostrar miniaturas antes de subir.
*   **Integración con Convex Storage:**
    1.  Llamar a `generateUploadUrl` de Convex.
    2.  Hacer un `POST` con fetch a esa URL para cada archivo.
    3.  Obtener la URL pública con `getUrl` o simplemente guardar el ID del archivo si se prefiere. Utilizaremos URLs públicas para visualización directa.

---

## 2. Aleatorización Estática en MatchGame

### 2.1 Componente `MatchGame.tsx`
*   **Problema Actual:** Las definiciones se reordenan en cada renderizado (cada vez que el usuario selecciona un concepto).
*   **Solución:** Mover la lógica de barajado a un `useMemo` que dependa únicamente de las `questions`.
*   **Lógica:**
    ```typescript
    const shuffledDefinitions = useMemo(() => {
        return [...questions]
            .map((q, originalIndex) => ({ ...q, originalIndex }))
            .sort(() => Math.random() - 0.5);
    }, [questions]);
    ```
*   **Uso:** Mappear sobre `shuffledDefinitions` en lugar de hacerlo directamente sobre `questions` con un sort dinámico.

---

## 3. Pruebas de Aceptación
1.  **Feedback:** Subir 3 imágenes, redactar comentario y confirmar que se guardan y se pueden ver en el tablero de administración.
2.  **MatchGame:** Seleccionar un concepto a la izquierda y verificar que el orden de las definiciones a la derecha NO cambie.
