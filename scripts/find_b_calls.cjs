const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl/ultra/course') && t.title === 'Cursos');
    const wsUrl = bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (async () => {
          const txt = await (await window.fetch('https://ultra.content.blackboardcdn.com/ultra/uiv4000.21.0-rel.61_e5a0070/9403-9783a56a1e8e381e.js')).text();
          const target = 'b=(0,h.YQ)(y.swQ,g.dZ)';
          const pos = txt.indexOf(target);
          // Look down for where b is called
          const bCalls = [];
          let p = pos + 25;
          while ((p = txt.indexOf('b(', p)) !== -1) {
            bCalls.push(txt.substring(Math.max(0, p - 50), Math.min(txt.length, p + 200)));
            p += 2;
            if (bCalls.length > 5) break;
          }
          return bCalls;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('b calls:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
