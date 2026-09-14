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
          // Check what text elements exist under course card
          const cards = Array.from(document.querySelectorAll('.course-element-card'));
          return cards.map(c => {
            const h4 = c.querySelector('h4');
            const link = c.querySelector('a');
            return {
              h4Text: h4 ? h4.innerText : '',
              h4Html: h4 ? h4.innerHTML : '',
              h4Attributes: h4 ? Array.from(h4.attributes).map(a => a.name + '=' + a.value) : [],
              linkId: link ? link.id : '',
              ariaLabel: link ? link.getAttribute('aria-label') : ''
            };
          }).slice(0, 10);
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('H4 Details:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
