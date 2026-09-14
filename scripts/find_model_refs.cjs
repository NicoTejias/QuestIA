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
          const target = 'let F=\"CourseConversationMessageModel\"';
          const target2 = 'CourseConversationMessageModel';
          const pos = txt.indexOf(target2);
          
          // Let's find where CourseConversationModel is used in factories/controllers
          const matches = [];
          let p = 0;
          while ((p = txt.indexOf('CourseConversationModel', p)) !== -1) {
            matches.push({
              pos: p,
              snippet: txt.substring(Math.max(0, p - 60), Math.min(txt.length, p + 200))
            });
            p += 23;
            if (matches.length > 5) break;
          }
          return matches;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Matches:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
