const express = require('express');
const app = express();
const messRoutes = require('./routes/messRoutes');

app.use('/api/messes', messRoutes);

app.use((req, res, next) => {
  res.status(404).json({ fallback: true, path: req.path });
});

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log('Listening on port ' + port);
  const http = require('http');
  http.get(`http://localhost:${port}/api/messes/87a7d92a-4128-4af4-a382-5b904d9ee521/reviews`, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Data:', data);
      process.exit(0);
    });
  });
});
