'use strict';
const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB();

function* get(id) {
    let req = {
        Key: {
            "id": {
                S: id
            },
        },
        TableName: "watchers"
    };
    let resp = yield DDB.getItem(req).promise();
    try {
        return resp.Item;
    } catch (ex) {
        return null;
    }
}

function* update(id, data) {
    // only expecting 'content' element in data
    let req = {
        Key: {
            "id": {
                S: id
            },
        },
        UpdateExpression: "set content = :c, checked_at = :now",
        ExpressionAttributeValues: {
            ":c": {
                S: data.content
            },
            ":now": {
                S: (new Date()).toISOString()
            }
        },
        TableName: "watchers"
    };
    let resp = yield DDB.updateItem(req).promise();
    return resp;
}

function* scan() {
    let req = {
        TableName: "watchers"
    };
    let resp = yield DDB.scan(req).promise();
    try {
        return resp.Items;
    } catch (ex) {
        return null;
    }
}

module.exports.get = get;
module.exports.update = update;
module.exports.scan = scan;
