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
          
          try {
            // 1. Memberships / Cursos
            const coursesResp = await $http.get('/learn/api/v1/users/_765172_1/memberships?expand=course&limit=100');
            
            // 2. Mensajes / Streams no leídos o conversaciones
            const convResp = await $http.get('/learn/api/v1/users/me/stream?limit=20');

            return {
              totalCourses: coursesResp.data.results?.length || 0,
              courses: (coursesResp.data.results || []).map(r => ({
                courseId: r.courseId,
                name: r.course?.name || r.course?.displayName,
                courseNumber: r.course?.courseNumber,
                role: r.courseRoleId,
                term: r.course?.termId
              })),
              streamEntries: (convResp.data.entries || []).slice(0, 5)
            };
          } catch (e) {
            return { error: e.message, status: e.status, data: e.data };
          }
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Courses and messages:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
