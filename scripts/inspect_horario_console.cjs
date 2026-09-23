const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const tab = list.find(t => t.url && t.url.includes('experienciavivo.duoc.cl/docentes/horario'));
    if (!tab) return;
    const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      // Habilitar Console y Log
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      const code = `
        (() => {
          return {
            scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerText.substring(0, 100)).filter(Boolean),
            vueApp: !!window.__VUE__,
            modyo: window.modyo ? Object.keys(window.modyo) : null,
            user: window.user || window.sessionStorage || null
          };
        })()
      `;
      ws.send(JSON.stringify({ id: 3, method: 'Runtime.evaluate', params: { expression: code, returnByValue: true } }));
    });
    ws.on('message', m => {
      const msg = JSON.parse(m);
      if (msg.method === 'Console.messageAdded' || msg.method === 'Log.entryAdded') {
        console.log('Browser log:', msg.params);
      }
      if (msg.id === 3) {
        console.log('Page objects:', msg.result?.result?.value);
        setTimeout(() => ws.close(), 1500);
      }
    });
  });
});
