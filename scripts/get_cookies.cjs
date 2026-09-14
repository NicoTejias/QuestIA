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
      ws.send(JSON.stringify({
        id: 1,
        method: 'Network.getCookies',
        params: { urls: ['https://campusvirtual.duoc.cl'] }
      }));
    });
    ws.on('message', m => {
      const resp = JSON.parse(m);
      if (resp.id === 1) {
        const cookies = resp.result?.cookies || [];
        console.log('Total Network Cookies:', cookies.length);
        cookies.forEach(c => console.log(' -', c.name, ':', c.value.substring(0, 30), '| httpOnly:', c.httpOnly, '| secure:', c.secure));
        ws.close();
      }
    });
  });
});
