const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const tab = list.find(t => t.url && t.url.includes('experienciavivo.duoc.cl/docentes/mis-cursos'));
    if (!tab) {
      console.log('No tab encontrada');
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      const code = `
        (() => {
          const links = Array.from(document.querySelectorAll('a'));
          const horarioLink = links.find(a => (a.innerText || '').trim().toLowerCase() === 'horario' || a.href.includes('/horario'));
          if (horarioLink) {
            horarioLink.click();
            return { clicked: true, text: horarioLink.innerText, href: horarioLink.href };
          }
          return { clicked: false, available: links.map(a => a.innerText.trim()).filter(Boolean) };
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, returnByValue: true } }));
    });
    ws.on('message', m => {
      const msg = JSON.parse(m);
      console.log('Click result:', msg.result?.result?.value);
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: { expression: '({ url: location.href, title: document.title, text: document.body.innerText.substring(0, 1000) })', returnByValue: true }
        }));
      }, 3000);
      if (msg.id === 2) {
        console.log('Page after click:', msg.result?.result?.value);
        ws.close();
      }
    });
  });
});
