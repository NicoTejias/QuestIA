const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const tab = list.find(t => t.url && t.url.includes('experienciavivo.duoc.cl'));
    if (!tab) {
      console.log('No tab de experienciavivo encontrada');
      return;
    }
    const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      // Primero habilitar Page y Network
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({
        id: 2,
        method: 'Page.navigate',
        params: { url: 'https://experienciavivo.duoc.cl/docentes/horario' }
      }));
    });
    ws.on('message', m => {
      const msg = JSON.parse(m);
      if (msg.id === 2) {
        console.log('Navegación iniciada a horario. Esperando carga...');
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  return {
                    url: location.href,
                    title: document.title,
                    text: document.body.innerText,
                    tables: Array.from(document.querySelectorAll('table')).map(t => t.innerText),
                    divs: Array.from(document.querySelectorAll('[class*="horario"], [class*="schedule"], [class*="bloque"], [class*="evento"], [class*="dia"], [class*="semana"]')).map(el => el.innerText.trim()).filter(t => t.length > 0)
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 5000);
      } else if (msg.id === 3) {
        const val = msg.result?.result?.value;
        console.log('=== HORARIO OBTENIDO DESDE UBUNTU SERVER ===');
        console.log('URL:', val?.url);
        console.log('Texto:', val?.text);
        if (val?.tables?.length) console.log('Tablas:', val.tables);
        if (val?.divs?.length) console.log('Bloques:', val.divs.slice(0, 30));
        ws.close();
      }
    });
  });
});
