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
          try {
            const injector = window.angular?.element(document.body)?.injector();
            const $http = injector.get('$http');
            const targetCourseId = '_734484_1';
            const payload = {
              participantIds: ['rolebucket:TAKING'],
              messages: [{
                body: {
                  rawText: '<p>Estimados alumnos, junto con saludar y esperando que se encuentren bien les pido que el dia lunes 14 de septiembre, lleguen a la hora 8:50, debido a que va a ir una profe a mirar la clase. Gracias Saludos!</p>'
                }
              }],
              canBeRepliedTo: true
            };
            const res = await $http.post('/learn/api/v1/courses/' + targetCourseId + '/conversations?sendEmailToParticipants=true', payload);
            return {
              status: res.status,
              data: res.data
            };
          } catch (err) {
            return {
              status: err.status,
              statusText: err.statusText,
              data: err.data
            };
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
      console.log('Instance properties:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
