const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const loginTab = list[0];
    const wsUrl = loginTab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (() => {
          const div = Array.from(document.querySelectorAll('div')).find(d => d.innerText && d.innerText.includes('ni.tejias@profesor.duoc.cl') && d.classList.contains('content'));
          const row = div ? div.closest('.table-row') || div.closest('[role="button"]') || div.parentElement : null;
          if (row) {
            row.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            row.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return 'Dispatched click on: ' + row.className + ' / ' + row.tagName;
          }
          return 'Row not found';
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Result:', JSON.parse(m).result?.result?.value);
      ws.close();
    });
  });
});
