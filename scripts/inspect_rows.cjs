const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl/ultra/course'));
    const wsUrl = bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (() => {
          // Check if session is expired or what elements are in main content
          const main = document.querySelector('main') || document.body;
          const rows = Array.from(main.querySelectorAll('[role="row"], [class*="element-card"], [class*="course-"]'))
            .map(r => r.innerText.trim().replace(/\\n+/g, ' '));
          return {
            title: document.title,
            url: window.location.href,
            rowsCount: rows.length,
            rowsSample: rows.slice(0, 10),
            visibleText: document.body.innerText.substring(0, 500)
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
      console.log('Result:', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
