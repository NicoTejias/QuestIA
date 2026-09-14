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
          // Check performance entries for recent API calls
          const perfEntries = performance.getEntriesByType('resource')
            .map(r => r.name)
            .filter(url => url.includes('/learn/api') || url.includes('/ultra/') || url.includes('duoc.cl'));

          // Check courses visible on DOM
          const courseCards = Array.from(document.querySelectorAll('div, li, a, tr'))
            .filter(el => el.innerText && el.innerText.includes('2026-') && el.innerText.length < 300)
            .map(el => el.innerText.trim());

          return {
            perfEntries: perfEntries.slice(-15),
            courseCards: courseCards.slice(0, 10)
          };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: code,
          returnByValue: true
        }
      }));
    });
    ws.on('message', m => {
      console.log('Result:', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
