const r = require('rethinkdb');

repo = module.exports = {};

repo.openConnection = () => {
    return r.connect({host: '127.0.0.1', port: 28015});
};


repo.prepareTables = () => r.branch(
    r.dbList().contains('realtimeit').not(),
    r.db('realtimeit').tableCreate('discussions').do(r.dbCreate('realtimeit')),
    r.db('realtimeit').tableList()
);


repo.subscribeToDiscussion = (docId) => {
    return r.db('realtimeit').table('discussions').get(docId).changes();
};


repo.Discussion = {
    get: docId => r.db('realtimeit').table('discussions').get(docId),

    post: topic => r.db('realtimeit').table('discussions')
        .insert({
            topic: topic,
            dateCreated: r.now(),
            dateModified: r.now(),
            rollUp: [],
            children: []
        })('generated_keys').nth(0)
};


repo.Comment = {

};
