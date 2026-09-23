const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && (t.url.includes('campusvirtual.duoc.cl') || t.url.includes('blackboard')));
    if (!bb) {
      console.log('No tab de campusvirtual encontrada');
      return;
    }
    console.log('Tab encontrada:', bb.title, bb.url);
    const ws = new WebSocket(bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              return {
                title: document.title,
                url: location.href,
                text: document.body.innerText.substring(0, 1500),
                links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.href })).filter(x => x.text.length > 0).slice(0, 30)
              };
            })()
          `,
          returnByValue: true
        }
      }));
    });
    ws.on('message', m => {
      console.log('AVA Tab info:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
