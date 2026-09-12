const WebSocket = require('ws');
const http = require('http');

http.get('http://192.168.0.202:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const bb = list.find(t => t.url && t.url.includes('campusvirtual.duoc.cl/ultra/course'));
    if (!bb) {
      console.log('No Blackboard course tab found. Active tabs:');
      list.forEach(t => console.log(' -', t.title, t.url));
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
          expression: `(async () => {
            try {
              const cookies = document.cookie;
              const xsrfMatch = cookies.match(/(?:^|;\\s*)XSRF-TOKEN=([^;]+)/);
              const xsrf = xsrfMatch ? xsrfMatch[1] : '';
              const url = '/learn/api/v1/users/_765172_1/memberships?expand=course.effectiveAvailability,course.permissions,courseRole&includeCount=true&limit=10000';
              const res = await window.fetch(url, {
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'X-Blackboard-XSRF': xsrf
                }
              });
              const text = await res.text();
              let json;
              try { json = JSON.parse(text); } catch (e) {}
              if (json && json.results) {
                return {
                  total: json.results.length,
                  results: json.results.map(r => ({
                    id: r.courseId,
                    name: r.course?.name || r.course?.displayName,
                    code: r.course?.courseNumber,
                    term: r.course?.termId,
                    created: r.created
                  }))
                };
              }
              return { status: res.status, text: text.substring(0, 300), cookies: cookies.substring(0, 100) };
            } catch (err) {
              return { error: err.stack || err.message };
            }
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    });

    ws.on('message', (msg) => {
      const resp = JSON.parse(msg);
      if (resp.id === 1) {
        console.log('Result from Blackboard:\n', JSON.stringify(resp.result?.result?.value, null, 2));
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
    });
  });
}).on('error', (err) => {
  console.error('HTTP error:', err.message);
});
