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
      // Navegar a horario
      ws.send(JSON.stringify({
        id: 1,
        method: 'Page.navigate',
        params: { url: 'https://experienciavivo.duoc.cl/docentes/horario' }
      }));
    });
    ws.on('message', m => {
      const msg = JSON.parse(m);
      if (msg.id === 1) {
        console.log('Navegando a horario...');
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  return {
                    title: document.title,
                    url: location.href,
                    bodyText: document.body.innerText.substring(0, 3000)
                  };
                })()
              `,
              returnByValue: true
            }
          }));
        }, 3500);
      } else if (msg.id === 2) {
        console.log('HORARIO RESULTADO:\n', msg.result?.result?.value);
        ws.close();
      }
    });
  });
});
