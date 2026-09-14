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
        (async () => {
          const injector = window.angular?.element(document.body)?.injector();
          const $http = injector.get('$http');
          const courseId = '_730882_1';
          const semana1Id = '_90977727_1';
          
          try {
            const ch = await $http.get('/learn/api/v1/courses/' + courseId + '/contents/' + semana1Id + '/children');
            return ch.data;
          } catch(e) {
            return { error: e.status, msg: e.data?.message };
          }
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Semana 1 children:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
