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
          // Search webpack bundles for "conversations" or "No initial message provided"
          const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('ultra/uiv'));
          
          let foundMatches = [];
          for (let src of scripts) {
            try {
              const res = await window.fetch(src);
              const txt = await res.text();
              if (txt.includes('/conversations') || txt.includes('includesAllMembers')) {
                const idx = txt.indexOf('/conversations');
                foundMatches.push({
                  src: src.split('/').pop(),
                  snippet: txt.substring(Math.max(0, idx - 100), Math.min(txt.length, idx + 200))
                });
              }
            } catch(e) {}
          }
          return foundMatches;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Bundle matches:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
