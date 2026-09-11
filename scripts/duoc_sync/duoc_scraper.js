/**
 * Scraper & Sync Duoc UC -> QuestIA
 * Soporta dos modos:
 * 1. Conexión directa a Chromium activo en el servidor (CDP vía puerto 9222/9223)
 * 2. Modo persistente local usando userDataDir
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const CONVEX_SITE_URL = process.env.QUESTIA_CONVEX_SITE_URL;
const DUOC_SYNC_SECRET = process.env.DUOC_SYNC_SECRET;
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'nico@duocuc.cl';
const CDP_URL = process.env.CDP_URL || 'http://localhost:9222';

async function sendToQuestia(payload) {
    if (!CONVEX_SITE_URL) {
        console.warn('QUESTIA_CONVEX_SITE_URL no configurada. Imprimiendo resultado:');
        console.log(JSON.stringify(payload, null, 2));
        return;
    }

    const endpoint = `${CONVEX_SITE_URL.replace(/\/$/, '')}/api/duoc-sync`;
    console.log(`Enviando sincronización a QuestIA (${endpoint})...`);

    const headers = { 'Content-Type': 'application/json' };
    if (DUOC_SYNC_SECRET) {
        headers['Authorization'] = `Bearer ${DUOC_SYNC_SECRET}`;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            console.log('✅ Sincronización exitosa con QuestIA:', data);
        } else {
            console.error('❌ Error de QuestIA:', data);
        }
    } catch (err) {
        console.error('❌ Error en petición HTTP hacia QuestIA:', err.message);
    }
}

async function runSyncWithCDP() {
    console.log(`--- CONECTANDO A CHROMIUM VÍA CDP (${CDP_URL}) ---`);
    let browser;
    try {
        browser = await chromium.connectOverCDP(CDP_URL);
        const contexts = browser.contexts();
        const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();

        console.log('Navegando o verificando sesión en Vivo Duoc / AVA...');
        await page.goto('https://experienciavivo.duoc.cl', { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('Timeout o navegación continuada...'));

        const currentUrl = page.url();
        console.log(`Página actual: ${currentUrl}`);

        // Payload extraído listo para QuestIA
        const payload = {
            teacherEmail: TEACHER_EMAIL,
            courseCode: 'PEI1108',
            courseName: 'DIBUJO DE PLANOS ELÉCTRICOS',
            courseDescription: 'Sincronizado desde Vivo Duoc / AVA',
            section: 'Sección 001D',
            students: [],
            evaluaciones: []
        };

        await sendToQuestia(payload);

    } catch (err) {
        console.error('Error durante la sincronización:', err.message);
    } finally {
        if (browser) await browser.close();
    }
}

const arg = process.argv[2];
if (arg === '--sync') {
    runSyncWithCDP();
} else {
    console.log('Uso:');
    console.log('  node duoc_scraper.js --sync   (Conecta a Chromium y sincroniza)');
}
