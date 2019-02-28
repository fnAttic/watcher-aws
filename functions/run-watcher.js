'use strict';

const assert = require('assert');
const co = require('co');
const AWS = require('aws-sdk');
const request = require('superagent');
var dom = require('xmldom').DOMParser;
const xpath = require('xpath');
const events = require('../lib/events.js');
const email = require('../lib/email.js');
const Watcher = require('../models/watcher.js');

// get a web page by URL
function* getPage(url) {
    let req = request.get(url);
    let res = yield req;
    return req;
}

// extract content from a web page 
function extractContent(html, path) {
    const doc = new dom().parseFromString(html);
    var nodes = xpath.select(path, doc);
    try {
        return nodes[0].nodeValue;
    } catch (ex) {
        return '';
    }
}

// extract 'message' part of the event depending on the source (API Gateway or SQS)
function eventMapper(event, context) {
    var eventSource = events.getLambdaEventSource(event);
    if ( eventSource === 'isSqs' ) {
        return JSON.parse(event.Records[0].body);
    }
    return event;
}

// lambda function handler
const handler = co.wrap(function* (event, context, cb) {
    // get the message from the event which might come from API Gateway or SQS
    let message = eventMapper(event);
    assert.ok('id' in message, 'Missing id attribute');
    const id = message.id;

    // retrieve the watcher item from the database
    let watcher = yield Watcher.get(id);
    assert.ok(watcher !== null, `Could not find a Watcher id=${id}`);
    const location = watcher.location.S;
    const path = watcher.path.S;

    // fetch the web page, extract the content at the path
    // send a message if the content has changed since the last check,
    //     update the database item with the new content
    let page = yield getPage(location);
    let content = extractContent(page.text, path);
    if ( content !== watcher.content ) {
        // sender, recipient_to, subject, body_html, recipient_cc, body_text, reply_to
        yield email.sendEmail(
            process.env.SES_SENDER,
            process.env.SES_RECIPIENT, 
            `Chages on ${location} at ${path}`,
            content);
        yield Watcher.update(id, {
            'content': content
        }); 
    }

    // send response with the content (visible to client via the API Gateway)
    let response = {
        statusCode: 200,
        body: content
    };
    cb(null, response);
});

module.exports.handler = handler;
