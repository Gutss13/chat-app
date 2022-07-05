import { useEffect, useRef, useState } from 'react';
import ChatMessages from './ChatMessages';
import ws from './socketConfig';
import axios from 'axios';
import ChatSearchNav from './ChatSearchNav';
import ChatSearch from './ChatSearch';
import ChatSectionFooter from './ChatSectionFooter';

function ChatSection(props) {
  const [isTyping, setIsTyping] = useState(null);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [replyTo, setReplyTo] = useState();
  const [searchResultsNodelist, setSearchResultsNodelist] = useState([]);
  const [searchResultsIndex, setSearchResultsIndex] = useState({
    length: 0,
    current: 0,
  });
  const [msgEdit, setMsgEdit] = useState();
  const textInput = useRef(null);

  useEffect(() => {
    const updateChatStatusSeen = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction !== 'refreshPeople' &&
        newData.instruction !== 'refreshRequests' &&
        newData.instruction !== 'refreshChat' &&
        newData.instruction !== 'refreshFriends'
      ) {
        if (props.receiver && props.chat) {
          if ('isSeenVal' in newData) {
            if (
              props.chat[0].sender_id === localStorage.id &&
              newData.isSeenVal
            ) {
              props.setIsSeen(newData.isSeenVal);
            } else {
              props.setIsSeen(false);
            }
          }
        }
      }
    };
    ws.addEventListener('message', updateChatStatusSeen);
    return () => ws.removeEventListener('message', updateChatStatusSeen);
  }, [props.receiver, props.chat]);

  useEffect(() => {
    const updateChat = (e) => {
      const newData = JSON.parse(e.data);
      if (props.receiver) {
        if (
          newData.instruction === 'refreshChat' &&
          newData.msgSender === props.receiver.id
        ) {
          axios
            .get(`/api/chat/${props.receiver.id}/${localStorage.id}`)
            .then((request) => {
              return request.data;
            })
            .then((data) => {
              props.setChat(data.sort());
            });
        }
      }
    };
    const updateChatStatusTyping = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction === 'removeReceiver' &&
        newData.me === localStorage.id
      ) {
        props.setReceiver(null);
      }
      if (
        newData.instruction !== 'refreshPeople' &&
        newData.instruction !== 'refreshRequests' &&
        newData.instruction !== 'refreshChat' &&
        newData.instruction !== 'refreshFriends'
      ) {
        if (props.receiver) {
          if (
            newData.isTypingTarget &&
            newData.isTypingTarget === localStorage.id &&
            newData.msgSender === props.receiver.id
          ) {
            setIsFriendTyping(newData.isTyping);
          }
        }
      }
    };
    ws.addEventListener('message', updateChat);
    ws.addEventListener('message', updateChatStatusTyping);
    return () => {
      ws.removeEventListener('message', updateChat);
      ws.removeEventListener('message', updateChatStatusTyping);
    };
  }, [props.receiver]);
  useEffect(() => {
    if (isTyping !== null) {
      ws.send(
        JSON.stringify({
          instructions: [
            {
              isTyping: isTyping,
              isTypingTarget: props.receiver.id,
              msgSender: localStorage.id,
            },
          ],
        })
      );
    }
  }, [isTyping]);

  return (
    <>
      <div className="chatDiv">
        <div>
          {props.receiver && `To: ${props.receiver.name}`}

          {props.receiver && (
            <ChatSearch
              searchResultsNodelist={searchResultsNodelist}
              setSearchResultsNodelist={setSearchResultsNodelist}
              setSearchResultsIndex={setSearchResultsIndex}
              chatSearchInput={props.chatSearchInput}
              receiver={props.receiver}
            />
          )}
        </div>
        <div className="chat">
          {replyTo && (
            <div className="replyDiv">
              <div
                style={
                  replyTo.sender_id === localStorage.id
                    ? {
                        color: 'cyan',
                      }
                    : {
                        color: 'white',
                      }
                }
              >
                Reply to:
              </div>
              <div
                className="chatText"
                style={
                  replyTo.sender_id === localStorage.id
                    ? {
                        backgroundColor: 'cyan',
                        paddingRight: '20px',
                        opacity: '0.6',
                      }
                    : {
                        backgroundColor: 'white',
                        paddingRight: '20px',
                        opacity: '0.6',
                      }
                }
              >
                {replyTo.chatData || (replyTo.isRemoved && 'Removed')}
                <input
                  type="button"
                  value="X"
                  className="closeReply"
                  style={
                    replyTo.sender_id === localStorage.id
                      ? {
                          backgroundColor: 'white',
                        }
                      : {
                          backgroundColor: 'cyan',
                        }
                  }
                  onClick={() => {
                    textInput.current.value = '';
                    setReplyTo(null);
                  }}
                />
              </div>
            </div>
          )}

          <div className="isTyping">
            {isFriendTyping && props.receiver ? 'Typing...' : null}
          </div>
          <div className="isSeen">
            {props.isSeen && props.receiver ? 'Seen' : null}
          </div>

          {props.chat && props.receiver ? (
            <ChatMessages
              chat={props.chat}
              setChat={props.setChat}
              receiver={props.receiver}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              setMsgEdit={setMsgEdit}
              msgEdit={msgEdit}
              textInput={textInput}
            />
          ) : (
            <div className="emptyChat">Click on Friend to Start Chatting</div>
          )}
        </div>
        {props.receiver && (
          <ChatSectionFooter
            textInput={textInput}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            setIsTyping={setIsTyping}
            msgEdit={msgEdit}
            setMsgEdit={setMsgEdit}
            receiver={props.receiver}
            chat={props.chat}
            setChat={props.setChat}
            friendsInfo={props.friendsInfo}
            setFriendsInfo={props.setFriendsInfo}
          />
        )}
        {!!searchResultsNodelist.length && (
          <ChatSearchNav
            searchResultsIndex={searchResultsIndex}
            searchResultsNodelist={searchResultsNodelist}
            setSearchResultsIndex={setSearchResultsIndex}
          />
        )}
      </div>
    </>
  );
}

export default ChatSection;
