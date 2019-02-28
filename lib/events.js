'use strict';

function getLambdaEventSource(event) {
    if (event.Records && event.Records[0].eventSource === 'aws:sqs') return 'isSqs';
    if (event.httpMethod) return 'isApiGateway';
    return null;
}

module.exports.getLambdaEventSource = getLambdaEventSource;
