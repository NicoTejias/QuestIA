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
          
          const root = await $http.get('/learn/api/v1/courses/' + courseId + '/contents');
          const items = root.data?.results || [];
          
          async function scan(parentId, depth = 0) {
            if (depth > 4) return [];
            try {
              const res = await $http.get('/learn/api/v1/courses/' + courseId + '/contents/' + parentId + '/children');
              const chs = res.data?.results || [];
              let found = [];
              for (let c of chs) {
                found.push({ id: c.id, title: c.title, handler: c.contentHandler, depth });
                const sub = await scan(c.id, depth + 1);
                found = found.concat(sub);
              }
              return found;
            } catch(e) {
              return [];
            }
          }
          
          let all = [];
          for (let it of items) {
            all.push({ id: it.id, title: it.title, handler: it.contentHandler, depth: 0 });
            const sub = await scan(it.id, 1);
            all = all.concat(sub);
          }
          return all;
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      const val = JSON.parse(m).result?.result?.value;
      console.log('Total items in course:', val?.length);
      console.log('All items:\n', JSON.stringify(val, null, 2));
      ws.close();
    });
  });
});
