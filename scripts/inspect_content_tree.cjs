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
        (async () => {
          const injector = window.angular?.element(document.body)?.injector();
          const $http = injector.get('$http');
          const courseId = '_730882_1';
          
          // Get root contents
          const root = await $http.get('/learn/api/v1/courses/' + courseId + '/contents');
          const items = root.data?.results || [];
          
          // Print summary of items and inspect any folders
          const summary = [];
          for (let item of items) {
            const entry = {
              id: item.id,
              title: item.title,
              handler: item.contentHandler,
              isFolder: item.contentDetail?.['resource/x-bb-lesson']?.isFolder || false,
              bodyUrl: item.body?.webLocation || item.body?.fileLocation
            };
            // If it's a folder or lesson, check its children: /learn/api/v1/courses/{courseId}/contents/{id}/children
            if (entry.isFolder || item.contentHandler?.includes('folder') || item.contentHandler?.includes('lesson')) {
              try {
                const ch = await $http.get('/learn/api/v1/courses/' + courseId + '/contents/' + item.id + '/children');
                entry.children = (ch.data?.results || []).map(c => ({
                  id: c.id,
                  title: c.title,
                  handler: c.contentHandler,
                  fileLocation: c.body?.fileLocation,
                  webLocation: c.body?.webLocation
                }));
              } catch(e) {
                entry.childrenErr = e.status;
              }
            }
            summary.push(entry);
          }
          return summary;
        })()
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: code, awaitPromise: true, returnByValue: true } }));
    });
    ws.on('message', m => {
      console.log('Tree:\n', JSON.stringify(JSON.parse(m).result?.result?.value, null, 2));
      ws.close();
    });
  });
});
