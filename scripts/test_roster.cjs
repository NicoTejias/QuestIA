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
          
          const usersRes = await $http.get('/learn/api/public/v1/courses/_756691_1/users?expand=user&limit=10');
          return {
            status: usersRes.status,
            results: usersRes.data.results?.map(r => ({
              id: r.id,
              userId: r.userId,
              role: r.courseRoleId,
              user: r.user ? { name: r.user.name?.given + ' ' + r.user.name?.family, email: r.user.contact?.email } : null
            }))
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
      console.log('Course users:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
