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
    document.getElementById('textareaId').focus();
    if (props.msgEdit) {
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.parentNode.previousSibling.style.paddingRight =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.right =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
        'none';
      props.setMsgEdit(null);
    }
  };

  const editMsg = (e, targetMsg) => {
    document.getElementById('textareaId').focus();
    if (props.msgEdit) {
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.parentNode.previousSibling.style.paddingRight =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.right =
        '0px';
      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
        'none';
    }
    props.setMsgEdit({
      editMsgNode: e.lastChild.lastChild.lastChild,
      editMsgData: targetMsg,
    });
    e.parentNode.previousSibling.style.paddingRight = '40px';
    e.style.right = '40px';
    e.style.borderBottom = '5px solid red';
    props.textInput.current.value = e.lastChild.lastChild.lastChild.textContent;
    if (props.replyTo) props.setReplyTo(null);
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
        let editedTextDate;
        if (
          chatVal.editHistory &&
          chatVal.editHistory[chatVal.editHistory.length - 1]
        ) {
          editedTextDate = new Date(
            chatVal.editHistory[chatVal.editHistory.length - 1].date
          );
        }
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
                {date.getDate()} {`${months[date.getMonth()]} `}
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
                {props.msgEdit && props.msgEdit.editMsgData.id === chatVal.id && (
                  <div
                    className="closeEdit"
                    onClick={() => {
                      props.setMsgEdit(null);
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.parentNode.previousSibling.style.paddingRight =
                        '0px';
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.right =
                        '0px';
                      props.msgEdit.editMsgNode.parentNode.parentNode.parentNode.style.borderBottom =
                        'none';
                      props.msgEdit.editMsgNode.textContent =
                        props.msgEdit.editMsgData.chatData;
                    }}
                  >
                    <div className="close edit"></div>
                    <div>Close</div>
                  </div>
                )}
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
                  <div
                    className="myMsgOpts"
                    style={chatVal.isRemoved && { left: '-50px' }}
                  >
                    {!chatVal.isRemoved && (
                      <div
                        className="myMsgRemove msgOpts"
                        onClick={() => {
                          removeMsg(msgId.id);
                        }}
                      >
                        Remove
                      </div>
                    )}

                    <div
                      className="myMsgReply msgOpts"
                      onClick={() => {
                        replyMsg(chatVal);
                      }}
                    >
                      Reply
                    </div>
                    {!chatVal.isRemoved && (
                      <div
                        className="myMsgEdit msgOpts"
                        onClick={(e) => {
                          editMsg(e.target.parentNode.parentNode, chatVal);
                        }}
                      >
                        Edit
                      </div>
                    )}
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
                    <div className="editedMessageFlex">
                      {chatVal.editHistory && chatVal.editHistory.length > 0 && (
                        <div
                          className="isEdited"
                          style={
                            chatVal.sender_id === localStorage.id
                              ? { paddingLeft: '15px' }
                              : { paddingRight: '15px' }
                          }
                        >
                          Edited
                          {editedTextDate && (
                            <div className="editTimeDiv">
                              <span>
                                {editedTextDate.getDate()}{' '}
                                {`${months[editedTextDate.getMonth()]} `}
                              </span>
                              <span>
                                {editedTextDate.getHours()}:
                                {editedTextDate.getMinutes() > 9
                                  ? editedTextDate.getMinutes()
                                  : `0${editedTextDate.getMinutes()}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        style={
                          chatVal.sender_id === localStorage.id
                            ? { paddingLeft: '15px' }
                            : { paddingRight: '15px' }
                        }
                        tabIndex="0"
                      >
                        {chatVal.chatData}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="editedMessageFlex">
                    {chatVal.editHistory && chatVal.editHistory.length > 0 && (
                      <div
                        className="isEdited"
                        style={
                          chatVal.sender_id === localStorage.id
                            ? { paddingLeft: '15px' }
                            : { paddingRight: '15px' }
                        }
                      >
                        Edited
                        {editedTextDate && (
                          <div className="editTimeDiv">
                            <span>
                              {editedTextDate.getDate()}{' '}
                              {`${months[editedTextDate.getMonth()]} `}
                            </span>
                            <span>
                              {editedTextDate.getHours()}:
                              {editedTextDate.getMinutes() > 9
                                ? editedTextDate.getMinutes()
                                : `0${editedTextDate.getMinutes()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      style={
                        chatVal.sender_id === localStorage.id
                          ? { paddingLeft: '15px' }
                          : { paddingRight: '15px' }
                      }
                      tabIndex="0"
                    >
                      {chatVal.chatData}
                    </div>
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
