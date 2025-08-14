const { EventEmitter } = require('events');

const emitter = new EventEmitter();

function sendMessage(payload) {
  return new Promise((resolve) => {
    emitter.once('response', resolve);
    emitter.emit('request', payload);
  });
}

function registerHandler(handler) {
  emitter.on('request', async (payload) => {
    const result = await handler(payload);
    emitter.emit('response', result);
  });
}

module.exports = { sendMessage, registerHandler };
