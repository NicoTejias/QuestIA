# Sincronización Duoc UC / AVA / Vivo Duoc -> QuestIA

Esta carpeta contiene la infraestructura completa para sincronizar asignaturas, secciones, nóminas de alumnos y evaluaciones desde tu **Ubuntu Server** (`192.168.0.202`) hacia la plataforma **QuestIA**.

---

## 1. Arquitectura de Sincronización

Existen tres modalidades integradas para operar la sincronización:

```
[ Ubuntu Server (192.168.0.202) ]
  ├── Chromium con CDP (Puerto 9222) <──────── Sesión activa Vivo Duoc / AVA (Office 365)
  ├── sync_daemon_bridge.cjs (Puerto 9223) <── Expone API REST local /sync y /status
  └── n8n / Crontab / Systemd (Automatización periódica)
                │
                ▼ (HTTP REST / API Directa)
[ QuestIA Web / Móvil ]
  ├── Panel Docente: DuocSyncPanel.tsx (Verificación de salud en vivo y botón 1-click)
  ├── CoursesAPI.syncDuocData() en api.ts (Carga y upsert en Supabase/Convex)
  └── Catálogo oficial precargado: 5 Ramos, 10 Secciones, 190 Alumnos validados
```

---

## 2. Archivos Disponibles

1. `sync_daemon_bridge.cjs`: Servidor Bridge en Node.js que se conecta al Chromium con CDP (puerto 9222) de tu Ubuntu Server y expone un endpoint REST en el puerto 9223 para sincronización en caliente.
2. `duoc_keepalive.js`: Demonio de mantenimiento de sesión viva que interactúa periódicamente con la pestaña de Vivo Duoc para evitar timeouts de inactividad de SAML/Azure AD.
3. `duoc_scraper.js`: Script en Node.js con Playwright para scraping directo o ejecución desatendida.
4. `package.json`: Dependencias mínimas para el servidor Ubuntu (`express`, `cors`, etc.).
5. `.env.example`: Variables de configuración (IP del servidor, puerto CDP, llaves de API).

---

## 3. Puesta en Marcha en tu Ubuntu Server (`192.168.0.202`)

### Paso A: Verificar que Chromium esté corriendo con CDP
Tu navegador Chromium en el servidor debe ejecutarse con el flag `--remote-debugging-port=9222`:
```bash
google-chrome --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir=~/chrome-profile &
```
*(Puedes verificarlo desde tu PC abriendo `http://192.168.0.202:9222/json/version` en el navegador).*

### Paso B: Iniciar el Bridge Daemon (`sync_daemon_bridge.cjs`)
```bash
cd /path/to/QuestIA/scripts/duoc_sync
npm install
node sync_daemon_bridge.cjs
```
O con `pm2` para mantenerlo siempre activo:
```bash
pm2 start sync_daemon_bridge.cjs --name "duoc-bridge"
pm2 save
```

El bridge escuchará en `http://192.168.0.202:9223` y responderá a:
- `GET /status`: Comprueba el estado de la sesión de Chromium y las pestañas abiertas.
- `POST /sync`: Extrae y normaliza los ramos y estudiantes.
- `POST /keepalive`: Envía un pulso para mantener la sesión de Duoc activa.

---

## 4. Uso desde la Interfaz de QuestIA

En el panel docente de QuestIA (`/teacher`):
1. Ingresa a la sección **"Mis Ramos"** o haz clic en el banner superior **"Sincronizar Vivo Duoc"**.
2. Verás el componente `DuocSyncPanel` indicando el estado del servidor (`192.168.0.202:9222`).
3. Si cambias de IP o puerto, puedes configurarlo directamente en el modal de ajustes con un clic.
4. Presiona **"Sincronizar Ahora"**: el sistema cargará automáticamente las 5 asignaturas (`EAI4122`, `GDP4475`, `PEI1110`, `TAEX1061`, `PEI1108`), las 10 secciones y los 190 estudiantes con sus respectivos RUTs y registros curriculares.

---

## 5. Integración con n8n (Opcional)

Si utilizas n8n en el mismo Ubuntu Server:
- Crea un flujo con un **Schedule Trigger** (ej. cada 6 horas).
- Añade un nodo **HTTP Request** haciendo `POST` a `http://localhost:9223/sync`.
- El resultado se inyecta directamente a la base de datos de QuestIA.

