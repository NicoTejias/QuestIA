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
          const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('ultra/uiv'));
          
          let results = [];
          for (let s of scripts) {
            const txt = await (await window.fetch(s)).text();
            let pos = 0;
            while ((pos = txt.indexOf('swQ', pos)) !== -1) {
              results.push({
                file: s.split('/').pop(),
                snippet: txt.substring(Math.max(0, pos - 40), Math.min(txt.length, pos + 100))
              });
              pos += 3;
              if (results.length > 10) break;
            }
            if (results.length > 10) break;
          }
          return results;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Results across bundles:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
