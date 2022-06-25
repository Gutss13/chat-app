function Chat(props) {
  return (
    <div>
      {props.chat.map((chatVal, i) => {
        return (
          <div
            key={i}
            className={
              chatVal.sender_id === localStorage.id ? 'sender' : 'receiver'
            }
          >
            {chatVal.chatData}
          </div>
        );
      })}
    </div>
  );
}

export default Chat;
