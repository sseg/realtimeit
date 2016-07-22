const r = require('rethinkdb');

repo = module.exports = {};

repo.getConnection = () => {
    var conn = null;
    r.connect({host: '127.0.0.1', port: 28015});
};
