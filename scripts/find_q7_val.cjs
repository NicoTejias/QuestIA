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
          const txt = await (await window.fetch('https://ultra.content.blackboardcdn.com/ultra/uiv4000.21.0-rel.61_e5a0070/app-9783a56a1e8e381e.js')).text();
          const target = '509342(e,t,n)';
          const pos = txt.indexOf(target);
          const q7Pos = txt.indexOf('q7:()=>', pos);
          const varName = txt.substring(q7Pos + 7, q7Pos + 12).split(/[,;}\s]/)[0];
          
          // Now find the definition of varName in module 509342
          const defPos = txt.indexOf('let ' + varName + '=', pos);
          const defPos2 = txt.indexOf(varName + '=\"', pos);
          return {
            q7Pos,
            varName,
            snippet1: defPos !== -1 ? txt.substring(defPos, defPos + 100) : null,
            snippet2: defPos2 !== -1 ? txt.substring(defPos2 - 10, defPos2 + 60) : null
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
      console.log('q7 details:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
