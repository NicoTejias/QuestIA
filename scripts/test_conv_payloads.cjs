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
          const $http = injector.get('$http');

          // Try POST /learn/api/v1/courses/_734484_1/conversations with different payload shapes
          const payloads = [
            {
              // Shape 1: with message object
              participants: ["_765172_1"],
              message: {
                body: "Prueba"
              }
            },
            {
              // Shape 2: participantIds and message object
              participantIds: ["_765172_1"],
              message: {
                body: { rawText: "Prueba" }
              }
            },
            {
              // Shape 3: messages array
              participantIds: ["_765172_1"],
              messages: [
                { body: { rawText: "Prueba" } }
              ]
            },
            {
              // Shape 4: with includesAllMembers: true (broadcast to entire class)
              includesAllMembers: true,
              message: {
                body: "Prueba de envio"
              }
            }
          ];

          const tests = [];
          for (let p of payloads) {
            try {
              const r = await $http.post('/learn/api/v1/courses/_734484_1/conversations', p);
              tests.push({ payload: p, status: r.status, data: r.data });
              break; // If success, stop
            } catch(err) {
              tests.push({ payload: p, status: err.status, error: err.data?.message || err.data });
            }
          }
          return tests;
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Test conversation payloads:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
