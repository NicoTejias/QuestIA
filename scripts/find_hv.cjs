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
          const res = await window.fetch('https://ultra.content.blackboardcdn.com/ultra/uiv4000.21.0-rel.61_e5a0070/9403-9783a56a1e8e381e.js');
          const txt = await res.text();
          const target = '706152(e,t,r)';
          const idx = txt.indexOf(target);
          // Look for uses of export hV (class a which is POST s)
          const targetExport = 'hV:()=>a';
          const exportMatches = [];
          let pos = 0;
          while ((pos = txt.indexOf('hV', pos)) !== -1) {
            exportMatches.push(txt.substring(Math.max(0, pos - 50), Math.min(txt.length, pos + 100)));
            pos += 3;
            if (exportMatches.length > 5) break;
          }
          return { exportMatches };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Result:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
