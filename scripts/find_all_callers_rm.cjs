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
          const res = await window.fetch('https://ultra.content.blackboardcdn.com/ultra/uiv4000.21.0-rel.61_e5a0070/app-9783a56a1e8e381e.js');
          const txt = await res.text();
          const target = 'rM(';
          const pos = 3291207;
          
          // Let's find callers of rM by searching for other modules that import rM or 706152
          const callers = [];
          const regex = /\b[a-zA-Z0-9_$]+\.rM\(|\brM\(/g;
          // Let's search inside the app bundle
          let m;
          while ((m = regex.exec(txt)) !== null) {
            if (m.index !== pos) {
              callers.push({
                idx: m.index,
                snippet: txt.substring(Math.max(0, m.index - 100), Math.min(txt.length, m.index + 300))
              });
            }
          }
          return callers;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Callers:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
