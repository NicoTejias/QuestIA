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
        (() => {
          const card = document.querySelector('.course-element-card');
          if (!card) return 'No card found';
          return {
            fullHtml: card.innerHTML,
            dataset: Object.assign({}, card.dataset),
            angularScope: (window.angular && window.angular.element) ? Object.keys(window.angular.element(card).scope() || {}) : 'no angular'
          };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Card details:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
