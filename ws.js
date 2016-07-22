const WSServer = require('ws').Server;


module.exports = class SocketServer {
    constructor (app) {
        this.app = app;
    }

    listen (server) {
        this.server = new WSServer({server: server});
        this.server.on('connection', this.onConnection.bind(this));
    }

    onConnection (socket) {
        console.log('Websocket connection opened');

        socket.on('close', this.onClose.bind(this));
        socket.on('error', this.onError.bind(this));
        socket.on('message', this.onMessage.bind(this));
    }

    onClose () {
        console.log('Client disconnected');
    }

    onError (error) {
        console.log(error);
    }

    onMessage (message, flags) {
        console.log('Received message: %s', message);
    }
};
