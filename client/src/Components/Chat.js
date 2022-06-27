function Chat(props) {
  return (
    <>
      {props.chat.map((chatVal, i) => {
        const date = new Date(chatVal.date);
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        const minutes = date.getMinutes();
        return (
          <div key={i}>
            <div
              className={
                chatVal.sender_id === localStorage.id
                  ? 'myTextDate'
                  : 'friendTextDate '
              }
            >
              <span>
                {date.getDay()} {`${months[date.getMonth()]} `}
              </span>
              <span>
                {date.getHours()}:{minutes > 9 ? minutes : `0${minutes}`}
              </span>
            </div>
            <div
              className={
                chatVal.sender_id === localStorage.id
                  ? 'me chatText'
                  : 'friend chatText'
              }
            >
              {chatVal.chatData}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default Chat;
