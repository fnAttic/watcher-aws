'use strict';

const AWS = require('aws-sdk');
const SES = new AWS.SES({
    region: process.env.SES_REGION
});

function* sendEmail(sender, recipient_to, subject, body_html, recipient_cc, body_text, reply_to) {
    let req = {
        Source: sender,
        Destination: {
            // CcAddresses: ['EMAIL_ADDRESS'],
            ToAddresses: Array.isArray(recipient_to) ? recipient_to : [recipient_to]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: body_html
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        }
    };
    if (recipient_cc) req.Destination.CcAddresses = Array.isArray(recipient_cc) ? recipient_cc : [recipient_cc];
    if (body_text) req.Message.Body.Text = {
        Charset: "UTF-8",
        Data: body_text
    }
    if (reply_to) req.ReplyToAddresses = Array.isArray(reply_to) ? reply_to : [reply_to];
    let resp = yield SES.sendEmail(req).promise();
    return resp;
}

module.exports.sendEmail = sendEmail;
