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
          return Array.from(document.querySelectorAll('a')).map(a => ({
            text: (a.innerText || '').trim().replace(/\\s+/g, ' '),
            href: a.href,
            target: a.target
          })).filter(x => x.text.length > 0 || x.href.includes('duoc'));
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      const result = JSON.parse(m).result?.result?.value;
      console.log('Enlaces encontrados:', JSON.stringify(result, null, 2));
      ws.close();
    });
  });
});
