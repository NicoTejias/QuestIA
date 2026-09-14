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
          // Check if angular debug info is enabled or find angular injector
          const el = document.querySelector('[ng-app]') || document.querySelector('.course-element-card') || document.body;
          const injector = window.angular?.element(document.body)?.injector() || window.angular?.element(document.querySelector('[ui-view]'))?.injector();
          
          let services = [];
          if (injector) {
            try {
              services = ['$http', '$rootScope', 'baseCourses', 'courseService'].filter(s => injector.has(s));
            } catch(e) {}
          }

          // Also check network cookies for BbRouter
          const cookies = document.cookie;

          return {
            hasAngular: !!window.angular,
            hasInjector: !!injector,
            services,
            cookiesSub: cookies.split(';').map(c => c.trim().split('=')[0])
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
      console.log('Angular state:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
