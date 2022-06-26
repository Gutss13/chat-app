function Chat(props) {
  return (
    <>
      {props.chat.map((chatVal, i) => {
        return (
          <div
            key={i}
            className={
              chatVal.sender_id === localStorage.id
                ? 'me chatText'
                : 'friend chatText'
            }
          >
            {chatVal.chatData}
          </div>
        );
      })}
    </>
  );
}

export default Chat;
