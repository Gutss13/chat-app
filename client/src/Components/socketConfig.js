const HOST = location.origin.replace(/^https/, 'ws'); // eslint-disable-line

const ws = new WebSocket(HOST);

export default ws;
