// add later
// const HOST = window.location.origin.replace(/^http/, 'ws');
const HOST = 'ws://localhost:3000/';
const ws = new WebSocket(HOST);

export default ws;
