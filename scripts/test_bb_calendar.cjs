const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl'));
    if (!bb) {
      console.log('No tab de Blackboard/campusvirtual encontrada en lista de tabs:', list.map(t => t.url));
      return;
    }
    const ws = new WebSocket(bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222'));
    ws.on('open', () => {
      const code = `
        (async () => {
          const injector = window.angular?.element(document.body)?.injector();
          const $http = injector?.get('$http');
          if (!$http) return { error: 'No angular $http' };
          
          const results = {};
          try {
            const terms = await $http.get('/learn/api/v1/terms');
            results.terms = terms.data;
          } catch(e) { results.termsErr = e.status; }

          try {
            const cal = await $http.get('/learn/api/v1/calendars/items?limit=50');
            results.calendar = cal.data;
          } catch(e) { results.calErr = e.status; }

          return results;
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Blackboard Calendar/Terms:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
