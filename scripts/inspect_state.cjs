const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl/ultra/course'));
    if (!bb) {
      console.log('No Blackboard course tab found.');
      return;
    }
    console.log('Connecting to BB tab:', bb.title);
    const wsUrl = bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            return {
              origin: window.location.origin,
              href: window.location.href,
              cookies: document.cookie,
              localStorageKeys: Object.keys(localStorage)
            };
          })()`,
          returnByValue: true
        }
      }));
    });

    ws.on('message', (msg) => {
      const resp = JSON.parse(msg);
      if (resp.id === 1) {
        console.log('BB State:', JSON.stringify(resp.result?.result?.value, null, 2));
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
    });
  });
});
