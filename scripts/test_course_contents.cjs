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
          
          // Let's test different content endpoints on _734484_1 (GESTION DE PROYECTOS II_002D)
          // or _730882_1 (MANTENIMIENTO DE INSTALACIONES ELECTRICAS Y AUTOMATICAS_008D)
          const courseId = '_730882_1';
          const tests = [
            '/learn/api/public/v1/courses/' + courseId + '/contents',
            '/learn/api/v1/courses/' + courseId + '/contents',
            '/learn/api/v1/courses/' + courseId + '/outline',
            '/learn/api/v1/courses/' + courseId + '/contentOutline',
            '/learn/api/v1/courses/' + courseId + '/gradebook'
          ];
          
          const res = {};
          for (let u of tests) {
            try {
              const r = await $http.get(u);
              res[u] = { status: r.status, data: r.data };
            } catch(e) {
              res[u] = { status: e.status, err: e.data?.message || e.statusText };
            }
          }
          return res;
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Results:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
