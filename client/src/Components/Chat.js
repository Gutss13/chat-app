import axios from 'axios';
import { useEffect, useState } from 'react';
import ws from './socketConfig';

function Chat(props) {
  const [msgId, setMsgId] = useState({ isShow: false, id: '' });

  const removeMsg = (target_id) => {
    axios
      .patch(
        `/api/chat/msg/remove/${props.receiver.id}/${localStorage.id}/${target_id}`,
        {
          chatData: '',
          isRemoved: true,
        }
      )
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        ws.send(
          JSON.stringify({
            instructions: {
              instruction: ['refreshChat'],
              msgSender: localStorage.id,
            },
          })
        );
        props.setChat(data);
      });
  };
  const replyMsg = (targetMsg) => {
    props.setReplyTo({
      chatData: targetMsg.chatData,
      date: targetMsg.date,
      sender_id: targetMsg.sender_id,
      receiver_id: targetMsg.receiver_id,
      id: targetMsg.id,
      isRemoved: targetMsg.isRemoved,
    });
  };

  useEffect(() => {
    window.addEventListener('click', (e) => {
      if (msgId.isShow && !e.target.classList.value.includes('messageOptions'))
        setMsgId({ ...msgId, isShow: false });
    });
    return () => {
      window.removeEventListener('click', (e) => {
        if (
          msgId.isShow &&
          !e.target.classList.value.includes('messageOptions')
        )
          setMsgId({ ...msgId, isShow: false });
      });
    };
  }, [msgId]);

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
            <div>
              <div
                className={
                  chatVal.sender_id === localStorage.id
                    ? 'me chatText'
                    : 'friend chatText'
                }
                id={chatVal.id}
              >
                {chatVal.sender_id === localStorage.id && (
                  <div
                    className="friend messageOptions"
                    onClick={(e) => {
                      if (msgId.id === chatVal.id) {
                        setMsgId({
                          isShow: !msgId.isShow,
                          id: e.target.parentNode.id,
                        });
                      } else {
                        setMsgId({
                          isShow: true,
                          id: e.target.parentNode.id,
                        });
                      }
                    }}
                  ></div>
                )}
                {msgId.isShow &&
                msgId.id === chatVal.id &&
                chatVal.sender_id === localStorage.id ? (
                  <div className="myMsgOpts">
                    <div
                      className=" msgOpts"
                      onClick={() => {
                        removeMsg(msgId.id);
                      }}
                    >
                      Remove
                    </div>
                    <div
                      className=" msgOpts"
                      onClick={() => {
                        replyMsg(chatVal);
                      }}
                    >
                      Reply
                    </div>
                  </div>
                ) : null}

                {chatVal.isRemoved ? (
                  <div
                    className="isRemoved"
                    style={
                      chatVal.sender_id === localStorage.id
                        ? { paddingLeft: '15px' }
                        : { paddingRight: '15pxs' }
                    }
                  >
                    Removed
                  </div>
                ) : chatVal.replyTo ? (
                  <div>
                    <div>
                      <div
                        className={
                          chatVal.replyTo.isRemoved
                            ? 'isRemoved chatReplyDiv'
                            : 'chatReplyDiv'
                        }
                        style={
                          chatVal.sender_id === localStorage.id
                            ? {
                                marginLeft: '15px',
                                borderBottom: '1px solid white',
                                borderLeft: '1px solid white',
                              }
                            : {
                                marginRight: '15px',
                                borderBottom: '1px solid cyan',
                                borderLeft: '1px solid cyan',
                              }
                        }
                      >
                        Reply To:{' '}
                        {chatVal.replyTo.isRemoved
                          ? 'Removed'
                          : chatVal.replyTo.chatData}
                      </div>
                    </div>
                    <div
                      style={
                        chatVal.sender_id === localStorage.id
                          ? { paddingLeft: '15px' }
                          : { paddingRight: '15pxs' }
                      }
                    >
                      {chatVal.chatData}
                    </div>
                  </div>
                ) : (
                  <div
                    style={
                      chatVal.sender_id === localStorage.id
                        ? { paddingLeft: '15px' }
                        : { paddingRight: '15pxs' }
                    }
                  >
                    {chatVal.chatData}
                  </div>
                )}

                {msgId.isShow &&
                msgId.id === chatVal.id &&
                chatVal.sender_id !== localStorage.id ? (
                  <div
                    className="replyMsg msgOpts"
                    onClick={() => {
                      replyMsg(chatVal);
                    }}
                  >
                    Reply
                  </div>
                ) : null}
                {chatVal.sender_id !== localStorage.id && (
                  <div
                    className="me messageOptions"
                    onClick={(e) => {
                      if (msgId.id === chatVal.id) {
                        setMsgId({
                          isShow: !msgId.isShow,
                          id: e.target.parentNode.id,
                        });
                      } else {
                        setMsgId({
                          isShow: true,
                          id: e.target.parentNode.id,
                        });
                      }
                    }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default Chat;
