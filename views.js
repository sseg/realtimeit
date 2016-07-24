const Rethink = require('./repos/rethink');


const Discussion = {
    get: function* getDiscussion() {
        /**
        * Get a single discussion document.
        *
        * @param {dispatch} id - the ID of the discussion.
        * @throws {404} discussion not found.
        * @return {body json} the requested discussion document.
        */
        let conn = yield Rethink.openConnection();
        let doc = yield Rethink.Discussion.get(this.params.id).run(conn);
        yield conn.close();

        if (doc) {
            this.body = {
                id: doc.id,
                comments: doc.rollUp,
                topic: doc.topic,
                dateCreated: doc.dateCreated,
                dateModified: doc.dateModified
            };
        } else {
            this.throw(404);
        }
    },

    post: function* postDiscussion() {
        /**
        * Create a new discussion document.
        *
        * @param {body string} topic - the topic of the new discussion.
        * @return {body json} object with new discussion ID.
        */
        let topic = this.request.body.topic || 'No topic';
        let conn = yield Rethink.openConnection();
        let docId = yield Rethink.Discussion.post(topic).run(conn);
        yield conn.close();

        this.body = {discussionId: docId};
    },

};


const Comment = {
    get: function* getComment() {
        /**
        * Get a single comment.
        *
        * @param {dispatch} discussionId - the ID of the discussion containing the comment.
        * @param {dispatch} commentId - the ID of the comment.
        * @throws {404} discussion or comment not found.
        * @return {body json} the requested comment object.
        */
        let conn = yield Rethink.openConnection();
        let doc = yield Rethink.Discussion.get(this.params.discussionId).run(conn);
        yield conn.close();

        if (!doc) {
            this.throw(404);
        }

        let node = doc.rollUp,
            commentPath = this.params.commentId.split('.');

        try {
            for (let index of commentPath) {
                node = node[index];
            }
        } catch (e) {
            console.log(e);
            this.throw(404);
        }

        this.body = node;
    },

    put: function* putComment() {
        /**
        * Create or update a comment.
        *
        * @param {dispatch} discussionId - the ID of the discussion.
        * @param {optional dispatch} - the ID of the comment being updated. Defaults
        *     to new comment creation.
        * @param {body string} text - the text content of the comment.
        * @param {optional body string} parent - the ID of the parent comment
        *     being replied to. Defaults to top-level reply.
        * @throws {404} discussion or comment not found.
        * @return {body json} object with new or amended comment ID.
        */

        let discussionId = this.params.discussionId,
            commentId = this.params.commentId,
            text = this.request.body.text,
            parent = this.request.body.parent,
            parentPath,
            discussionChanges;

        if (parent) {
            parentPath = parent.split('.').map(Number);
        } else {
            parentPath = [];
        }

        if (parentPath.length >= 20) {
            // will overflow rethink callstack
            this.throw(402);
        }

        let conn = yield Rethink.openConnection();
        if (commentId) {
            discussionChanges = yield Rethink.Comment.update(
                discussionId, commentId, text
            ).run(conn);
        } else {
            discussionChanges = yield Rethink.Comment.insert(
                discussionId, parentPath, text
            ).run(conn);
        }
        yield conn.close();

        this.body = discussionChanges;
    },

    delete: function* deleteComment() {
        yield;
    },

    getHistory: function* getCommentHistory() {
        /**
        * Get the edit history of a comment.
        *
        * @param {dispatch} discussionId - the ID of the discussion containing the comment.
        * @param {dispatch} commentId - the ID of the comment.
        * @throws {404} discussion or comment not found.
        * @return {body json} an array of versions of the comment.
        */
        yield;
        this.body = `You have retrieved a comment history!`;
    },

};


var router =  module.exports = require('koa-router')();
router.get('getDiscussion', '/discussion/:id', Discussion.get);
router.post('postDiscussion', '/discussion', Discussion.post);

router.get('getComment', '/discussion/:discussionId/comment/:commentId', Comment.get);
router.put('updateComment', '/discussion/:discussionId/comment/:commentId', Comment.put);
router.put('createComment', '/discussion/:discussionId/comment', Comment.put);
router.delete('deleteComment', '/discussion/:discussionId/comment/:commentId', Comment.delete);
router.get('getCommentHistory', '/discussion/:discussionId/comment/:commentId/history', Comment.getHistory);
