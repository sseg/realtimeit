var koa = require('koa');
var app = koa();
var views = require('./views');

app.use(views.index);
app.listen(3000);
