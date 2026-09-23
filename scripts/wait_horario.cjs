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
      setTimeout(() => {
        const code = `
          (() => {
            const h = document.getElementById('horario');
            return {
              html: h ? h.innerHTML : 'No horario element',
              text: h ? h.innerText : ''
            };
          })()
        `;
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, returnByValue: true } }));
      }, 3000);
    });
    ws.on('message', m => {
      console.log('Horario text/html:', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
