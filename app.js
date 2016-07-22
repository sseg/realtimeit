const koa = require('koa');
const body = require('koa-bodyparser');
const views = require('./views');
const utils = require('./utils');
const WS = require('./ws');
const Rethink = require('./repos/rethink');


Rethink.openConnection().then((conn) => {
    Rethink.prepareTables().run(conn).then(
        () => {
            conn.close();
        }
    );
});


var app = koa();
app.use(body());

for (var mdw of utils.middlewares) {
    app.use(mdw);
}


app.use(views.routes());
app.use(views.allowedMethods());


app.ws = new WS(app);
const koaListen = app.listen;
app.listen = (port, callback) => {
    app.server = koaListen.apply(app, [port, callback]);
    app.ws.listen(app.server);
    return app;
};


app.listen(3000, () => { console.log('Listening on port 3000'); });
