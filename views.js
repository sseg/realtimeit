var router =  module.exports = require('koa-router')();


const Discussion = {
    get: function* getDiscussion() {
        this.body = `This is a discussion with id: ${this.params.id}`;
    },

    post: function* postDiscussion() {
        this.body = `You have created a new discussion!`;
    },

};

const Comment = {
    get: function* getComment() {
        this.body = `This is a comment with id: ${this.params.cid} on discussion with id: ${this.params.did}`;
    },

    put: function* putComment() {
        this.body = `You have posted/edited a comment!`;
    },

    getHistory: function* getCommentHistory() {
        this.body = `You have retrieved a comment history!`;
    }
};

router.get('getDiscussion', '/discussion/:id', Discussion.get);
router.post('postDiscussion', '/discussion', Discussion.post);

router.get('getComment', '/discussion/:did/comment/:cid', Comment.get);
router.put('putComment', '/discussion/:did/comment/:cid', Comment.put);
router.get('getCommentHistory', '/discussion/:did/comment/:cid/history', Comment.getHistory);
