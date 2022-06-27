const ws = new WebSocket(
  `ws://https://chat-app-guts.herokuapp.com/${process.env.PORT}`
);

export default ws;
