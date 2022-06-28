const HOST = window.location.origin.replace(/^https/, 'ws');

const ws = new WebSocket(HOST);

export default ws;
