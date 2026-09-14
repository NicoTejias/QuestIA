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
          
          // Let's find references to class a extends n.pT{constructor(e){super(s,e)}} where s is /v1/courses/%courseId%/conversations
          const matches = [];
          const regex = /new\s+[^(\s]+\([^)]*%courseId%[^)]*conversations/g;
          let m;
          while ((m = regex.exec(txt)) !== null) {
            matches.push(txt.substring(Math.max(0, m.index - 50), Math.min(txt.length, m.index + 200)));
          }
          
          // Also let's find POST request creators
          const idxPost = txt.indexOf('post(');
          return { matchesCount: matches.length, matches: matches.slice(0, 5) };
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
