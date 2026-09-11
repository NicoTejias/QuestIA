# Sincronización Duoc UC / AVA / Vivo Duoc -> QuestIA

Esta carpeta contiene la integración lista para ejecutar desde tu **Ubuntu Server** (el notebook en red con Docker/Chromium/n8n) hacia el backend de **QuestIA**.

---

## 1. Archivos Disponibles

1. `duoc_scraper.js`: Script en Node.js usando **Playwright** con sesión persistente (`userDataDir`). Permite loguearse una sola vez y luego operar de forma desatendida.
2. `package.json`: Dependencias mínimas para el servidor Ubuntu.
3. `.env.example`: Variables de entorno para el script (URL de Convex y clave secreta).

---

## 2. Instalación en tu Ubuntu Server

En tu Ubuntu Server, crea una carpeta para este servicio:

```bash
mkdir -p ~/duoc-sync && cd ~/duoc-sync
```

Copia `duoc_scraper.js` y `package.json` a esa carpeta. Luego instala las dependencias:

```bash
npm install
# Si no tienes instalados los navegadores de Playwright:
npx playwright install chromium
```

---

## 3. Primer Login (Persistencia de Sesión y MFA)

Para que el servidor guarde tus cookies y tokens de Microsoft/Duoc sin tener que ingresar contraseñas cada vez:

```bash
# Modo con ventana gráfica o usando VNC/X11
node duoc_scraper.js --login
```

1. Se abrirá Chromium apuntando a `https://experienciavivo.duoc.cl` o al login de Office 365.
2. Inicia sesión con tus credenciales institucionales de Duoc UC y aprueba el factor de doble autenticación (MFA) si te lo solicita. Marca **"Mantener la sesión iniciada"**.
3. Cierra el navegador. La sesión quedará guardada de forma segura en `./duoc_session`.

---

## 4. Sincronización Desatendida (Headless)

Una vez guardada la sesión, puedes ejecutar la extracción en segundo plano:

```bash
# Ejecución directa
node duoc_scraper.js --sync
```

El script:
1. Abre Chromium en modo headless utilizando la sesión guardada en `./duoc_session`.
2. Accede a las asignaturas, listas de estudiantes y evaluaciones.
3. Envía el payload JSON limpio hacia QuestIA al endpoint `https://<TU-CONVEX-DEPLOYMENT>.convex.site/api/duoc-sync`.

---

## 5. Integración con n8n (Opcional)

Si prefieres orquestarlo mediante **n8n**:
- Configura un nodo **Schedule Trigger** (ej. todos los lunes a las 08:00 AM).
- Agrega un nodo **Execute Command** que invoque:
  ```bash
  node /home/tu-usuario/duoc-sync/duoc_scraper.js --sync
  ```
- O bien, procesa la data y usa el nodo **HTTP Request** de n8n apuntando a `/api/duoc-sync` con el header `Authorization: Bearer <TU_DUOC_SYNC_SECRET>`.
