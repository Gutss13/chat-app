import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ws from './socketConfig';
function ChatSectionFooter(props) {
  const handleChangeTyping = (e) => {
    props.textInput.current.value = e.target.value;
    if (props.textInput.current.value) {
      props.setIsTyping(true);
    } else {
      props.setIsTyping(false);
    }
  };
  const handleSendClick = () => {
    const msgId = uuidv4();
    if (props.textInput.current.value && props.textInput.current.value.trim()) {
      if (props.replyTo) {
        axios
          .post(
            `/api/chat`,
            {
              chatData: props.textInput.current.value.trim(),
              sender_id: localStorage.id,
              receiver_id: props.receiver.id,
              id: msgId,
              replyTo: props.replyTo,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshChat'],
                  msgSender: localStorage.id,
                },
              })
            );
          });

        axios
          .patch(
            `/api/notifications/${props.receiver.id}/${localStorage.id}/update`
          )
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshNotifications'],
                  msgSender: localStorage.id,
                  msgReceiver: props.receiver.id,
                },
              })
            );
          });

        const chatCopy = [...props.chat];
        chatCopy.push({
          chatData: props.textInput.current.value,
          sender_id: localStorage.id,
          receiver_id: props.receiver.id,
          id: msgId,
          date: new Date().toJSON(),
          replyTo: props.replyTo,
        });
        chatCopy.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        props.setReplyTo(null);
        props.setChat(chatCopy);
      } else {
        axios
          .post(
            `/api/chat`,
            {
              chatData: props.textInput.current.value.trim(),
              sender_id: localStorage.id,
              receiver_id: props.receiver.id,
              id: msgId,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshChat'],
                  msgSender: localStorage.id,
                },
              })
            );
          });
        axios
          .patch(
            `/api/notifications/${props.receiver.id}/${localStorage.id}/update`
          )
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshNotifications'],
                  msgSender: localStorage.id,
                  msgReceiver: props.receiver.id,
                },
              })
            );
          });

        const chatCopy = [...props.chat];
        chatCopy.push({
          chatData: props.textInput.current.value.trim(),
          sender_id: localStorage.id,
          receiver_id: props.receiver.id,
          id: msgId,
          date: new Date().toJSON(),
        });
        chatCopy.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        props.setChat(chatCopy);
      }
      props.textInput.current.focus();
      props.textInput.current.value = '';
    }
    props.setIsTyping(false);
    ws.send(
      JSON.stringify({
        instructions: [
          {
            isSeenVal: false,
            msgSender: localStorage.id,
          },
        ],
      })
    );
  };

  const handleEditClick = () => {
    if (props.textInput.current.value !== props.msgEdit.editMsgData.chatData) {
      const historyMessateId = uuidv4();
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.parentNode.previousSibling.style.paddingRight =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.right =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
        'none';
      axios
        .patch(
          `/api/chat/msg/edit/${props.receiver.id}/${localStorage.id}/${props.msgEdit.editMsgData.id}`,
          {
            oldMessage: {
              chatData: props.msgEdit.editMsgData.chatData,
              id: props.msgEdit.editMsgData.id,
              date: props.msgEdit.editMsgData.date,
            },
            newMessage: {
              chatData: props.textInput.current.value,
              id: historyMessateId,
              date: new Date().toJSON(),
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
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
          props.setMsgEdit(null);
        });
      document.getElementById('textareaId').value = '';
    }
  };

  const updateFriendsInfo = (id) => {
    const friendsInfoCopy = props.friendsInfo.map((friend) => {
      if (friend.id === id) {
        const updatedFriend = friend;
        updatedFriend.notifications = {};
        return updatedFriend;
      } else {
        return friend;
      }
    });
    friendsInfoCopy.sort((a, b) => {
      if (a.notifications.number !== 0 && b.notifications.number !== 0) {
        return b.notifications.date - a.notifications.date;
      } else if (b.notifications.number !== 0) {
        return 1;
      } else {
        return b.isOnline - a.isOnline;
      }
    });
    props.setFriendsInfo(friendsInfoCopy);
  };
  return (
    <>
      <div>
        <div className="sendTextDiv">
          <div>
            <textarea
              autoFocus
              id="textareaId"
              onChange={(e) => {
                if (props.msgEdit) {
                  props.msgEdit.editMsgNode.textContent =
                    props.textInput.current.value;
                  if (
                    props.textInput.current.value ===
                    props.msgEdit.editMsgData.chatData
                  ) {
                    props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
                      '5px solid red';
                  } else {
                    props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
                      'none';
                  }
                } else {
                  handleChangeTyping(e);
                }
              }}
              onFocus={() => {
                if (
                  props.chat &&
                  props.chat[0] &&
                  props.chat[0].sender_id !== localStorage.id
                ) {
                  updateFriendsInfo(props.receiver.id);
                  axios
                    .patch(
                      `/api/notifications/${localStorage.id}/${props.receiver.id}/onSeen`
                    )
                    .then(() => {
                      ws.send(
                        JSON.stringify({
                          instructions: [
                            {
                              isSeenVal: true,
                              msgSender: localStorage.id,
                            },
                          ],
                        })
                      );
                    });
                }
              }}
              onKeyDown={(e) => {
                if (props.receiver) {
                  if (
                    document.activeElement ===
                      document.getElementById('textareaId') &&
                    e.key === 'Enter'
                  ) {
                    e.preventDefault();
                    if (!props.msgEdit) {
                      handleSendClick();
                    } else {
                      handleEditClick();
                    }
                  } else if (e.key === 'Escape') {
                    if (props.msgEdit) {
                      props.msgEdit.editMsgNode.textContent =
                        props.msgEdit.editMsgData.chatData;
                      props.setMsgEdit(null);
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.parentNode.previousSibling.style.paddingRight =
                        '0px';
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.right =
                        '0px';
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
                        'none';
                      document.getElementById('textareaId').value = '';
                    } else if (props.replyTo) {
                      props.textInput.current.value = '';
                      props.setReplyTo(null);
                    }
                  }
                }
              }}
              ref={props.textInput}
            ></textarea>
          </div>
          <div>
            <input
              type="button"
              value={props.msgEdit ? 'Edit' : 'Send'}
              onClick={(e) => {
                e.preventDefault();
                if (!props.msgEdit) {
                  handleSendClick();
                } else {
                  handleEditClick();
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatSectionFooter;
