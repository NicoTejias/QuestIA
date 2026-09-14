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
          
          // Let's inspect the first 4 root folders:
          // _90977695_1: Orientaciones de la asignatura
          // _90977696_1: Unidad 1: Redes de distribución eléctrica...
          // _90977697_1: Unidad 2: Circuitos de alumbrado y fuerza
          // _90977698_1: Unidad 3: Mantenimiento de motores y generadores
          const folderIds = ['_90977695_1', '_90977696_1', '_90977697_1', '_90977698_1'];
          const details = {};
          
          for (let fid of folderIds) {
            try {
              const res = await $http.get('/learn/api/v1/courses/' + courseId + '/contents/' + fid + '/children');
              details[fid] = (res.data?.results || []).map(item => ({
                id: item.id,
                title: item.title,
                handler: item.contentHandler,
                file: item.body?.fileLocation,
                web: item.body?.webLocation
              }));
            } catch(e) {
              details[fid] = { err: e.status };
            }
          }
          return details;
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Unidades children:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
