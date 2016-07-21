var koa = require('koa');
var app = koa();
var views = require('./views');
var utils = require('./utils');
var ws = require('./ws');


for (var mdw of utils.middlewares) {
    app.use(mdw);
}

app.use(views.routes());
app.use(views.allowedMethods());

app.listen(3000);
ws.listen(app);
