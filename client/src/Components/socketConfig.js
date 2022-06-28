const HOST = window.location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(`${HOST}`);

export default ws;
