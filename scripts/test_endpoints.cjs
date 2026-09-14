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
          
          const endpoints = [
            '/learn/api/public/v1/users/_765172_1/courses',
            '/learn/api/public/v1/users/me/courses',
            '/learn/api/v1/users/_765172_1/courses',
            '/learn/api/v1/users/me/memberships',
            '/learn/api/public/v1/courses',
            '/learn/api/v1/courses/conversations/counts'
          ];
          
          const results = {};
          for (let ep of endpoints) {
            try {
              const r = await $http.get(ep);
              results[ep] = { status: r.status, count: r.data?.results?.length || (Array.isArray(r.data) ? r.data.length : 'obj'), sample: r.data?.results?.[0] || r.data };
            } catch(e) {
              results[ep] = { status: e.status, error: e.data?.message || e.statusText };
            }
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
      console.log('Endpoints check:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
