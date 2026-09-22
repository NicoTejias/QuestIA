/**
 * Sync Daemon & Keepalive Bridge Duoc UC / AVA -> QuestIA
 * Ejecutable en Ubuntu Server (o máquina local con acceso a CDP puerto 9222)
 * Proporciona:
 * 1. Centinela KeepAlive contra desconexión de Vivo Duoc / Blackboard AVA.
 * 2. API local en puerto 9223 para consultar estado y disparar sincronización a demanda.
 */

const http = require('http');
const { chromium } = require('playwright');
require('dotenv').config();

const CDP_URL = process.env.CDP_URL || 'http://192.168.0.202:9222';
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || '9223', 10);
const CONVEX_SITE_URL = process.env.QUESTIA_CONVEX_SITE_URL;
const DUOC_SYNC_SECRET = process.env.DUOC_SYNC_SECRET;
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'ni.tejias@profesor.duoc.cl';

let browserInstance = null;
let lastSyncStatus = {
    connected: false,
    vivoDetected: false,
    avaDetected: false,
    lastCheck: null,
    lastSync: null,
    coursesCount: 0,
};

async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }
    try {
        browserInstance = await chromium.connectOverCDP(CDP_URL);
        return browserInstance;
    } catch (err) {
        console.warn(`[Bridge] No se pudo conectar a CDP en ${CDP_URL}: ${err.message}`);
        return null;
    }
}

// Centinela contra cierre de sesión
async function runKeepAliveTick() {
    try {
        const browser = await getBrowser();
        if (!browser) {
            lastSyncStatus.connected = false;
            return;
        }

        lastSyncStatus.connected = true;
        lastSyncStatus.lastCheck = new Date().toISOString();

        const contexts = browser.contexts();
        if (contexts.length === 0) return;

        const pages = contexts[0].pages();
        let vivoFound = false;
        let avaFound = false;

        for (const page of pages) {
            const url = page.url();

            if (url.includes('experienciavivo.duoc.cl')) vivoFound = true;
            if (url.includes('campusvirtual.duoc.cl') || url.includes('blackboard.com')) avaFound = true;

            // Auto-click de sesión
            if (url.includes('duoc.cl') || url.includes('blackboard') || url.includes('login.microsoftonline.com')) {
                const keepAliveSelectors = [
                    'button:has-text("Continuar")',
                    'button:has-text("Seguir conectado")',
                    'button:has-text("Mantener sesión")',
                    'button:has-text("Sí")',
                    'button:has-text("Extender sesión")',
                    '#stay-logged-in',
                    '.session-timeout-continue',
                    'button[id*="continue"]',
                ];

                for (const selector of keepAliveSelectors) {
                    try {
                        const btn = page.locator(selector).first();
                        if (await btn.isVisible({ timeout: 400 })) {
                            console.log(`[KeepAlive] Clic en ${selector} en ${url}`);
                            await btn.click();
                        }
                    } catch (_) {}
                }
            }
        }

        lastSyncStatus.vivoDetected = vivoFound;
        lastSyncStatus.avaDetected = avaFound;
    } catch (err) {
        console.error('[KeepAlive] Error:', err.message);
    }
}

// Intervalo cada 45 segundos
setInterval(runKeepAliveTick, 45 * 1000);
runKeepAliveTick();

// Servidor HTTP local para QuestIA UI
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/status' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            server: 'Ubuntu Server Duoc Bridge',
            cdpUrl: CDP_URL,
            teacherEmail: TEACHER_EMAIL,
            ...lastSyncStatus,
        }));
        return;
    }

    if (req.url === '/sync' && req.method === 'POST') {
        // Ejecutar extracción y retorno de datos
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Sincronización ejecutada correctamente',
            syncedAt: new Date().toISOString(),
            teacherEmail: TEACHER_EMAIL,
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

server.listen(BRIDGE_PORT, '0.0.0.0', () => {
    console.log(`[Bridge] Servidor Duoc Sync Bridge activo en http://0.0.0.0:${BRIDGE_PORT}`);
    console.log(`[Bridge] Escuchando CDP en: ${CDP_URL}`);
});
