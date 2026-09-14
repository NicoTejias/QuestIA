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
          const target = 'No initial message provided';
          const idx = txt.indexOf(target);
          if (idx === -1) {
            // Find in other bundle or search case-insensitively
            const regex = /initial message/i;
            const match = txt.match(regex);
            return match ? { match: match[0], idx: match.index, context: txt.substring(match.index - 50, match.index + 200) } : 'Not in 9403';
          }
          return { found: true, context: txt.substring(idx - 100, idx + 200) };
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
