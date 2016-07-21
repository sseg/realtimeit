var ws = module.exports = {};
var SocketServer = require('ws').Server;


ws.listen = (server) => {
    var wss = new SocketServer({server: server});

    wss.on('connection', (sock) => {
        console.log('opened!');

        sock.on('close', () => {
            console.log('closed');
        });
        sock.on('error', err => {
            console.log('error');
            console.log(err);
        });
        sock.on('message', data => {
            console.log('message');
            console.log(data);
        });
    });

};
