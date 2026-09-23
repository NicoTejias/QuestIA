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
          const main = document.querySelector('main') || document.body;
          const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src);
          return {
            title: document.title,
            iframes,
            mainSnippet: main.innerHTML.substring(0, 3000),
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, p, span, button')).map(el => el.innerText.trim()).filter(t => t.length > 3).slice(0, 50)
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
      const result = JSON.parse(m).result?.result?.value;
      console.log('Result:', JSON.stringify(result, null, 2));
      ws.close();
    });
  });
});
