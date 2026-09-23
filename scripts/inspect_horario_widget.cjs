const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const tab = list.find(t => t.url && t.url.includes('experienciavivo.duoc.cl/docentes/horario'));
    if (!tab) {
      console.log('No tab encontrada');
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      const code = `
        (() => {
          const widgets = Array.from(document.querySelectorAll('.widget-definition, [id*="horario"], [id*="docente"], table, iframe, [class*="calendar"]')).map(el => ({
            id: el.id,
            className: el.className,
            text: el.innerText.substring(0, 1000)
          }));
          return {
            widgets,
            htmlSnippet: document.querySelector('.widget-definition')?.outerHTML?.substring(0, 1500)
          };
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Widget Horario:', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
