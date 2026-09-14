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
          const target = 'class o extends n.w_{constructor(e){super(s,e)}}';
          // s is "/v1/courses/%courseId%/conversations"
          // In 9403, o was exported as QT!
          // So new rO.QT(t) where t is { courseId: ... }
          // withBody(a)
          // Look for callers of rM in this app bundle
          const idx = txt.indexOf('rM(');
          const idx2 = txt.indexOf('rM(', idx + 5);
          const idx3 = txt.indexOf('rM(', idx2 + 5);
          const idx4 = txt.indexOf('rM(', idx3 + 5);
          return {
            firstDef: txt.substring(idx - 30, idx + 100),
            second: idx2 !== -1 ? txt.substring(idx2 - 50, idx2 + 150) : null,
            third: idx3 !== -1 ? txt.substring(idx3 - 50, idx3 + 150) : null,
            fourth: idx4 !== -1 ? txt.substring(idx4 - 50, idx4 + 150) : null
          };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Occurrences of rM(:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
