const ws = new WebSocket(
  `ws://https://chat-app-guts.herokuapp.com/${process.env.PORT || 3000}`
);

export default ws;
