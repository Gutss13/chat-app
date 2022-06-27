const ws = new WebSocket(
  `ws://chat-app-guts.herokuapp.com/${process.env.PORT || 3000}`
);

export default ws;
