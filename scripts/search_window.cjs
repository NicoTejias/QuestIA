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
          // Look inside webpack chunks or angular modules
          const wChunk = window.webpackChunk_learn_ultra_apps_ultra;
          const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
          
          // Let's find any object in memory that has courses or memberships
          const results = [];
          for (let k in window) {
            try {
              if (k.startsWith('_') || k.startsWith('webkit')) continue;
              const val = window[k];
              if (val && typeof val === 'object') {
                const str = JSON.stringify(val);
                if (str && (str.includes('PEI') || str.includes('memberships') || str.includes('courseId'))) {
                  results.push({ key: k, preview: str.substring(0, 200) });
                }
              }
            } catch(e) {}
          }

          return {
            scriptsSample: scripts.slice(0, 5),
            matchingGlobals: results
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
      console.log('Result:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
