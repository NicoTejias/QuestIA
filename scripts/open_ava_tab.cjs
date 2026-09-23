const http = require('http');

const req = http.request('http://192.168.0.202:9222/json/new?https://campusvirtual.duoc.cl/', { method: 'PUT' }, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Nueva pestaña abierta en Ubuntu Server:', data);
  });
});
req.on('error', err => console.error('Error:', err.message));
req.end();
