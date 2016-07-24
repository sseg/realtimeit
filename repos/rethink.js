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
    insert: (discussionId, parentPath, text) => {
        let comment = {
            comment: [{
                text: text,
                ts: r.now()
            }]
        };

        const appendComment = a => {
            return {children: a('children').default([]).append(comment)};
        };
        const treeReplace = root => treeTraverse(root, parentPath, appendComment);

        return repo.Discussion.get(discussionId).replace(
            r.row
                .do(changeDateModified)
                .do(treeReplace)
                .do(updateRollUp),
            {returnChanges: true}
        );
    },

    update: (discussionId, commentId, text) => {

    },

    getCommentHistory: (discussionId, commentId) => {},

};


const changeDateModified = doc => doc.merge({dateModified: r.now()});


const treeTraverse = (root, path, mergeCallback) => {
    let stack = [root],
        reversedPath = [],
        currentNode;

    path.forEach((el, i) => {
        stack = stack.concat(stack[i]("children")(el));
        reversedPath.unshift([el, i]);
    });

    currentNode = stack.slice(-1).pop();
    currentNode = currentNode.merge(mergeCallback(currentNode));

    reversedPath.forEach(obj => {  // replace with r.fold
        let [el, i] = obj;
        currentNode = stack[i].merge({
            children: stack[i]("children").changeAt(
                el, currentNode
            )
        });
    });

    return currentNode;
};


const updateRollUp = doc => doc;


// rollUpStack = rollUpStack.concat(rollUpStack[i]("children")(el));
//     let commentHistory = currentNode("children").nth(commentPos)("comment"),
//         initialVersion = commentHistory.nth(0),
//         latestVersion = commentHistory.nth(-1),  // this history doesn't exist yet...
//         comment = {
//             dateCreated: initialVersion("ts"),
//             dateModified: initialVersion("ts"),
//             dateDeleted: null,
//             text: initialVersion("text")
//         },
//         updates = {
//             dateModified: latestVersion("ts"),
//             dateDeleted: latestVersion("text") === null ? latestVersion("ts") : null,
//             text: latestVersion("text")
//         };
//     Object.assign(comment, updates);
//
//     rollUpNode = rollUpStack.slice(-1).pop();
//     rollUpNode = rollUpNode.merge({
//         "children": rollUpNode("children").default([]).changeAt(commentPos, comment)
//     });
//
// rollUpNode = rollUpStack[i].merge({
//     children: rollUpStack[i]("children").changeAt(
//         el, rollUpNode
//     )
// });
