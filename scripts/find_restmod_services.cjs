const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl/ultra/course') && t.title === 'Cursos');
    const wsUrl = bb.webSocketDebuggerUrl.replace('localhost:9222', '192.168.0.202:9222');
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      const code = `
        (async () => {
          const injector = window.angular?.element(document.body)?.injector();
          if (!injector) return 'No injector';
          
          // Let's find any service whose name ends with Conversation or similar
          // Or inspect angular modules
          const services = [];
          for (let name of ['courseConversation', 'conversation', 'conversations', 'courseMessages', 'Conversation']) {
            try {
              if (injector.has(name)) services.push(name);
            } catch(e) {}
          }
          
          // Find restmod models registered
          // In restmod, models are factories
          let restmod = null;
          try { restmod = injector.get('restmod'); } catch(e) {}

          return {
            services,
            hasRestmod: !!restmod
          };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: code, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.on('message', m => {
      console.log('Angular services:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
