'use strict';

const Config = require('getconfig');
const WebSocket = require('ws');
const Wreck = require('wreck');
const internals = {};
internals.states = {};

const url = `wss://${Config.accessKey}:${Config.secretKey}@${Config.host}/v1/subscribe?eventNames=resource.change`;
const socket = new WebSocket(url);

socket.on('open', () => {

  console.log(`${new Date().toISOString()} Socket opened`);
});

socket.on('message', (msg) => {

  msg = JSON.parse(msg);
  if (msg.name !== 'resource.change' ||
      Config.resources.indexOf(msg.resourceType) === -1) {

    return;
  }

  const resource = msg.data.resource;
  internals.states[resource.type] = internals.states[resource.type] || {};
  if (internals.states[resource.type][resource.id] === resource.state) {
    return;
  }

  internals.states[resource.type][resource.id] = resource.state;
  const states = Config.states[msg.resourceType];
  console.log(`${new Date().toISOString()} DEBUG: ${msg.resourceType} ${resource.name} is now in the ${resource.state} state`);
  console.log(require('util').inspect(msg, false, null, true));

  if (states.indexOf(resource.state) === -1) {
    return;
  }

  const payload = JSON.stringify({
    username: 'rancher',
    icon_emoji: ':rancher:',
    channel: Config.slack.channel,
    text: `${msg.resourceType} ${resource.name} is now in the ${resource.state} state`
  });

  console.log(`${new Date().toISOString()} Posting ${payload} to slack`);

  if (Config.notify) {
    Wreck.post(Config.slack.url, { payload: payload, json: true }, (err, res, body) => {

      if (err ||
          res.statusCode !== 200) {

        console.log(`${new Date().toISOString()} ERROR failed to post to slack: ${err.message || res.statusCode}`);
        return;
      }
    });
  }
});

socket.on('close', () => {

  console.log(`${new Date().toISOString()} Socket closed`);
});
