'use strict';

const co = require('co');
const AWS = require('aws-sdk');
const SQS = new AWS.SQS();
const Watcher = require('../models/watcher.js');

function* enqueueRunner(watcher) {
    let req = {
        MessageBody: JSON.stringify({
            'id': watcher.id.S
        }),
        QueueUrl: process.env.FANOUT_QUEUE,
        DelaySeconds: 0
    };
    let resp = yield SQS.sendMessage(req).promise();
    return resp;
}

const handler = co.wrap(function* (event, context, cb) {

    // get all watchers from the database and enqueue them for execution
    let watchers = yield Watcher.scan();
    // NOTE: would have liked to use forEach, but async function with yield is not as trivial as this approach
    for (var i=0; i<watchers.length; i++) {
        yield enqueueRunner(watchers[i]);        
    }

    // return the response
    let response = {
        statusCode: 200
    };
    cb(null, response);
});

module.exports.handler = handler;
