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
          // Busquemos dónde se guardan los datos en memoria en la SPA de Ultra
          const globalProps = Object.keys(window).filter(k => k.toLowerCase().includes('ultra') || k.toLowerCase().includes('bb') || k.toLowerCase().includes('course') || k.toLowerCase().includes('learn'));
          
          // Buscar elementos con título o texto en la tabla/lista de cursos
          const courseElements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
              const text = el.innerText || '';
              return (text.includes('PEI') || text.includes('2026-2')) && el.children.length === 0;
            })
            .map(el => ({ tag: el.tagName, text: el.innerText.trim(), className: el.className, parent: el.parentElement?.className }))
            .slice(0, 15);

          return {
            globalProps,
            courseElements
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
      console.log('DOM elements:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
