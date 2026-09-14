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
          const injector = window.angular?.element(document.body)?.injector();
          const $http = injector ? injector.get('$http') : null;
          if (!$http) return { error: 'No injector' };

          // 1. Get all courses
          const res = await $http.get('/learn/api/public/v1/users/me/courses');
          const list = res.data.results || [];
          
          const matching = [];
          for (let item of list) {
            try {
              const c = (await $http.get('/learn/api/public/v1/courses/' + item.courseId)).data;
              if (c.name.toLowerCase().includes('gestion') || c.name.toLowerCase().includes('proyecto') || c.courseId.toLowerCase().includes('proyecto')) {
                matching.push({
                  id: c.id,
                  courseId: c.courseId,
                  name: c.name
                });
              }
            } catch(e) {}
          }
          return { total: list.length, matching };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Courses found:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
