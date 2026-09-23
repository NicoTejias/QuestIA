const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const msTabs = list.filter(t => t.url && t.url.includes('login.microsoftonline.com'));
    console.log('MS TABS:', msTabs.length);
    msTabs.forEach((tab, idx) => {
      const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
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
                  text: document.body.innerText.substring(0, 500),
                  buttons: Array.from(document.querySelectorAll('input, button')).map(b => b.value || b.innerText || b.id)
                };
              })()
            `,
            returnByValue: true
          }
        }));
      });
      ws.on('message', m => {
        console.log(`Tab ${idx}:`, JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
        ws.close();
      });
    });
  });
});
