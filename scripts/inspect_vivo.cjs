const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const tab = list.find(t => t.url && t.url.includes('experienciavivo.duoc.cl/docentes/mis-cursos'));
    if (!tab) return;
    const wsUrl = tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (() => {
          return {
            links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })),
            buttons: Array.from(document.querySelectorAll('button')).map(b => ({ text: b.innerText.trim(), id: b.id, class: b.className })),
            iframes: Array.from(document.querySelectorAll('iframe')).map(i => ({ id: i.id, src: i.src })),
            meta: Array.from(document.querySelectorAll('meta')).map(m => ({ name: m.name, content: m.content }))
          };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      const parsed = JSON.parse(m);
      console.log(JSON.stringify(parsed.result?.result?.value, null, 2));
      ws.close();
    });
  });
});
