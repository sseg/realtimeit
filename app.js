var koa = require('koa');
var app = koa();
var views = require('./views');
var utils = require('./utils');
var WS = require('./ws');


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
