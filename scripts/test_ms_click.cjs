const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const loginTab = list.find(t => t.url && t.url.includes('login.microsoftonline.com'));
    if (!loginTab) {
      console.log('No loginTab found');
      return;
    }
    const wsUrl = loginTab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (() => {
          return {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText,
            inputs: Array.from(document.querySelectorAll('input, button, [role="button"]')).map(el => ({ tag: el.tagName, id: el.id, text: el.innerText || el.value, class: el.className }))
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
      console.log('Result:', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
