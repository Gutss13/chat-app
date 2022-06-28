const HOST = window.location.origin.replace(/^http/, 'ws');

const ws = new WebSocket(`${HOST}${process.env.PORT}`);

export default ws;
