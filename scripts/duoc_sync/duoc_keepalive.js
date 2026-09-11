/**
 * Keepalive Daemon para Duoc UC / AVA
 * Monitorea continuamente las pestañas de Chromium vía CDP:
 * 1. Detecta modales de "¿Quieres seguir conectado?" / "Continuar sesión" y les hace click automáticamente.
 * 2. Emite un ping de actividad (scrolling suave / mouse move invisible o fetch a sesión) cada 3 minutos para evitar timeout por inactividad.
 */

const { chromium } = require('playwright');
require('dotenv').config();

const CDP_URL = process.env.CDP_URL || 'http://localhost:9222';
const CHECK_INTERVAL_MS = 60 * 1000; // Revisar cada 1 minuto

async function startKeepAlive() {
    console.log(`[KeepAlive] Iniciando centinela contra desconexión en ${CDP_URL}...`);

    let browser;
    try {
        browser = await chromium.connectOverCDP(CDP_URL);
    } catch (e) {
        console.error(`[KeepAlive] No se pudo conectar a CDP: ${e.message}. Reintentando en 15s...`);
        setTimeout(startKeepAlive, 15000);
        return;
    }

    browser.on('disconnected', () => {
        console.warn('[KeepAlive] Desconectado de Chromium. Reconectando...');
        setTimeout(startKeepAlive, 5000);
    });

    setInterval(async () => {
        try {
            const contexts = browser.contexts();
            if (contexts.length === 0) return;

            const pages = contexts[0].pages();
            for (const page of pages) {
                const url = page.url();

                // Filtrar páginas relevantes (Duoc / AVA / Blackboard / Vivo)
                if (url.includes('duoc.cl') || url.includes('blackboard') || url.includes('experienciavivo')) {
                    // 1. Buscar y hacer clic en botones típicos de sesión expirando
                    const keepAliveSelectors = [
                        'button:has-text("Continuar")',
                        'button:has-text("Seguir conectado")',
                        'button:has-text("Mantener sesión")',
                        'button:has-text("Sí")',
                        'button:has-text("Extender sesión")',
                        '#stay-logged-in',
                        '.session-timeout-continue',
                        'button[id*="continue"]',
                        'button[id*="extend"]'
                    ];

                    for (const selector of keepAliveSelectors) {
                        try {
                            const btn = page.locator(selector).first();
                            if (await btn.isVisible({ timeout: 500 })) {
                                console.log(`[KeepAlive] Detectado modal de sesión en ${url} -> Haciendo clic en ${selector}`);
                                await btn.click();
                            }
                        } catch (err) {
                            // Selector no presente o no clickeable, continuar
                        }
                    }

                    // 2. Simular micro-interacción para refrescar el temporizador de inactividad de Javascript
                    try {
                        await page.evaluate(() => {
                            window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
                        });
                    } catch (err) {
                        // Ignorar si el contexto de la página cambió
                    }
                }
            }
        } catch (loopError) {
            console.error('[KeepAlive] Error en ciclo:', loopError.message);
        }
    }, CHECK_INTERVAL_MS);
}

startKeepAlive();
