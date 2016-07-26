const express = require('express');
const server = express();
const port = 3000;

server.use(express.static('bin'));
server.listen(port, function() { console.log(`Server running at localhost:${port}`); });
