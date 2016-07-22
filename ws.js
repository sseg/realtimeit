const WSServer = require('ws').Server;
const Rethink = require('./repos/rethink');


module.exports = class SocketServer {
    constructor (app) {
        this.app = app;
        this.clientSessions = {};
    }

    listen (server) {
        this.server = new WSServer({server: server});
        this.server.on('connection', this.onConnection.bind(this));
    }

    onConnection (socket) {
        socket.id =  Math.random().toString(36).substring(2, 10);
        this.clientSessions[socket.id] = socket;
        console.log('Websocket connection opened with new client ID: ' + socket.id);

        socket.discussionSubscription = null;
        socket.dbConn = null;

        socket.onDataUpdate = (row) => {
            let doc = row.new_val;
            let update = {
                id: doc.id,
                topic: doc.topic,
                comments: doc.rollUp,
                dateCreated: doc.dateCreated,
                dateModified: doc.dateModified
            };
            socket.send(JSON.stringify(update, null, 2));
        };

        socket.on('close', this.onClose.bind(this, socket.id));
        socket.on('error', this.onError.bind(this, socket.id));
        socket.on('message', this.onMessage.bind(this, socket.id));

    }

    onClose (clientId) {
        console.log('Client <%s> disconnected', clientId);
        let socket = this.clientSessions[clientId];
        socket.dbConn.close();
        delete this.clientSessions[clientId];
    }

    onError (clientId, error) {
        console.log(error);
        delete this.clientSessions[clientId];
    }

    onMessage (clientId, message, flags) {
        console.log('Received from client: %s', clientId);
        let socket = this.clientSessions[clientId];
        socket.discussionSubscription = getSubscriptionId(message);
        updateSubscription(socket);
    }
};


function getSubscriptionId(message) {
    try {
        let data = JSON.parse(message);
        if (data.hasOwnProperty('discussion')) {
            return data.discussion;
        }
    } catch (e) {console.log(e);}
    return null;
}


function updateSubscription(socket) {
    if (socket.dbConn !== null) {
        socket.dbConn.close();
        socket.dbConn = null;
    }

    if (socket.discussionSubscription === null) {
        return;
    }

    Rethink.openConnection().then(
        (conn) => {
            socket.dbConn = conn;
            Rethink.subscribeToDiscussion(
                socket.discussionSubscription
            ).run(
                conn, (err, cursor) => {
                    if (err) throw err;
                    cursor.each((err, row) => {
                        if (err) throw err;
                        socket.onDataUpdate(row);
                    });
                }
            );
        }
    );
}
