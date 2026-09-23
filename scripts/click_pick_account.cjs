const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    // Buscar la pestaña que tiene "Pick an account"
    const msTabs = list.filter(t => t.url && t.url.includes('login.microsoftonline.com'));
    console.log('MS tabs encontradas:', msTabs.length);

    msTabs.forEach((tab, i) => {
      const ws = new WebSocket(tab.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
      ws.on('open', () => {
        const code = `
          (() => {
            const body = document.body.innerText;
            if (body.includes('Pick an account') || body.includes('Selecciona una cuenta') || body.includes('ni.tejias@profesor.duoc.cl')) {
              const accountTile = document.querySelector('[data-test-id*="ni.tejias"], [aria-label*="ni.tejias"], small, .table-row, [role="button"]');
              if (accountTile) {
                accountTile.click();
                return { clicked: true, text: accountTile.innerText, url: location.href };
              }
              // Alternativa: hacer click en el elemento con texto del correo
              const all = Array.from(document.querySelectorAll('*'));
              const el = all.find(e => e.innerText && e.innerText.includes('ni.tejias@profesor.duoc.cl') && e.children.length === 0);
              if (el) {
                el.click();
                return { clicked: true, text: el.innerText, url: location.href };
              }
            }
            return { clicked: false, bodyPreview: body.substring(0, 100) };
          })()
        `;
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, returnByValue: true } }));
      });
      ws.on('message', m => {
        console.log(`Tab ${i} result:`, JSON.stringify(JSON.parse(m).result?.result?.value));
        ws.close();
      });
    });
  });
});
