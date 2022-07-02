import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../Styles/reset.css';
import '../Styles/Main.css';
import messageReceived from '../Sounds/message_sound.mp3';
import search_image from '../Images/search_icon.png';
import ws from './socketConfig';
import SearchBar from './SearchBar';
import Chat from './Chat';
import AddFriend from './AddFriend';
import Friends from './Friends';
import { v4 as uuidv4 } from 'uuid';

function Main(props) {
  const [friends, setFriends] = useState([]);
  const [friendsInfo, setFriendsInfo] = useState([]);
  const [receiver, setReceiver] = useState();
  const [chat, setChat] = useState();
  const [searchText, setSearchText] = useState();
  const [foundPeople, setFoundPeople] = useState();
  const [allPeople, setAllPeople] = useState();
  const [isTyping, setIsTyping] = useState(null);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [foundFriends, setFoundFriends] = useState([]);
  const [friendSearchText, setFriendSearchText] = useState('');
  const [currUser, setCurrUser] = useState('');
  const [isSeen, setIsSeen] = useState(false);
  const [replyTo, setReplyTo] = useState();
  const [toggleFriends, setToggleFriends] = useState(false);
  const textInput = useRef(null);
  const chatSearchInput = useRef(null);

  useEffect(() => {
    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data && data[0]) {
          setCurrUser(data[0]);
          ws.send(
            JSON.stringify({
              instructions: {
                instruction: ['refreshFriends', 'refreshPeople'],
                me: localStorage.id,
              },
            })
          );
        }
      });
  }, [friends]);

  useEffect(() => {
    if (friends.length > 0 && currUser) {
      const friendsPromises = friends.map(async (friend) => {
        let friendData = await axios
          .get(`/api/people/personbyid/${friend}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            if (
              currUser.notifications &&
              data[0].id in currUser[0].notifications
            ) {
              return {
                ...data[0],
                notifications: {
                  number: currUser[0].notifications[data[0].id].number,
                  date: currUser[0].notifications[data[0].id].date,
                },
              };
            } else {
              return {
                ...data[0],
                notifications: { number: 0 },
              };
            }
          });
        return friendData;
      });
      Promise.all(friendsPromises).then((friendsArr) => {
        const friendsInfoCopy = friendsArr;
        friendsInfoCopy.sort((a, b) => {
          if (a.notifications.number !== 0 && b.notifications.number !== 0) {
            return b.notifications.date - a.notifications.date;
          } else if (b.notifications.number !== 0) {
            return 1;
          } else {
            return b.isOnline - a.isOnline;
          }
        });
        setFriendsInfo([...friendsInfoCopy]);
      });
    } else {
      setFriendsInfo([]);
    }
  }, [currUser, friends]);

  useEffect(() => {
    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data && data[0]) {
          setFriends([...data[0].friendList.friends]);
          setCurrUser(data[0]);
          ws.send(
            JSON.stringify({
              instructions: {
                instruction: ['refreshFriends', 'refreshPeople'],
                me: localStorage.id,
              },
            })
          );
        }
      });

    props.setIsLoggedIn(true);

    const updateStatusLogOut = () => {
      ws.send(
        JSON.stringify({
          instructions: {
            instruction: ['refreshFriends', 'refreshPeople'],
            me: localStorage.id,
            searchText: {
              id: localStorage.id,
              searchText,
              url: window.location.origin,
            },
          },
        })
      );
    };

    window.addEventListener('beforeunload', updateStatusLogOut);
    ws.addEventListener('close', updateStatusLogOut);
    return () => {
      window.removeEventListener('beforeunload', updateStatusLogOut);
      ws.removeEventListener('close', updateStatusLogOut);
    };
  }, []);

  useEffect(() => {
    axios
      .patch(
        `/api/people/${localStorage.id}/${localStorage.id}/${searchText}`,
        {
          isOnline: true,
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
              instruction: ['refreshFriends', 'refreshPeople'],
              me: localStorage.id,
            },
          })
        );
      });
  }, []);

  useEffect(() => {
    const updateChat = (e) => {
      const newData = JSON.parse(e.data);
      if (receiver) {
        if (
          newData.instruction === 'refreshChat' &&
          newData.msgSender === receiver.id
        ) {
          axios
            .get(`/api/chat/${receiver.id}/${localStorage.id}`)
            .then((request) => {
              return request.data;
            })
            .then((data) => {
              setChat(data.sort());
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
        setReceiver(null);
      }
      if (
        newData.instruction !== 'refreshPeople' &&
        newData.instruction !== 'refreshRequests' &&
        newData.instruction !== 'refreshChat' &&
        newData.instruction !== 'refreshFriends'
      ) {
        if (receiver) {
          if (
            newData.isTypingTarget &&
            newData.isTypingTarget === localStorage.id &&
            newData.msgSender === receiver.id
          ) {
            setIsFriendTyping(newData.isTyping);
          }
        }
      }
    };
    const updateNotifications = (e) => {
      const newData = JSON.parse(e.data);
      if (newData.instruction === 'refreshNotifications') {
        if (
          document.activeElement === textInput.current &&
          receiver &&
          newData.msgSender === receiver.id
        ) {
          axios.patch(
            `/api/notifications/${localStorage.id}/${receiver.id}/onSeen`
          );
        } else {
          axios
            .get(`/api/people/personbyid/${localStorage.id}`)
            .then((request) => {
              return request.data;
            })
            .then((data) => {
              if (data[0]) {
                setFriends([...data[0].friendList.friends]);
                setCurrUser(data[0]);
              }
            });
        }
        if (newData.msgSender === receiver.id) {
          new Audio(messageReceived).play();
        }
      }
    };
    ws.addEventListener('message', updateChat);
    ws.addEventListener('message', updateChatStatusTyping);
    ws.addEventListener('message', updateNotifications);
    return () => {
      ws.removeEventListener('message', updateChat);
      ws.removeEventListener('message', updateChatStatusTyping);
      ws.removeEventListener('message', updateNotifications);
    };
  }, [receiver]);

  useEffect(() => {
    const updateChatStatusSeen = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction !== 'refreshPeople' &&
        newData.instruction !== 'refreshRequests' &&
        newData.instruction !== 'refreshChat' &&
        newData.instruction !== 'refreshFriends'
      ) {
        if (receiver && chat) {
          if ('isSeenVal' in newData) {
            if (chat[0].sender_id === localStorage.id && newData.isSeenVal) {
              setIsSeen(newData.isSeenVal);
            } else {
              setIsSeen(false);
            }
          }
        }
      }
    };
    ws.addEventListener('message', updateChatStatusSeen);
    return () => ws.removeEventListener('message', updateChatStatusSeen);
  }, [receiver, chat]);

  const handleSendClick = () => {
    const msgId = uuidv4();
    if (textInput.current.value && textInput.current.value.trim()) {
      if (replyTo) {
        axios
          .post(
            `/api/chat`,
            {
              chatData: textInput.current.value.trim(),
              sender_id: localStorage.id,
              receiver_id: receiver.id,
              id: msgId,
              replyTo,
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
          .patch(`/api/notifications/${receiver.id}/${localStorage.id}/update`)
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshNotifications'],
                  msgSender: localStorage.id,
                },
              })
            );
          });

        const chatCopy = [...chat];
        chatCopy.push({
          chatData: textInput.current.value,
          sender_id: localStorage.id,
          receiver_id: receiver.id,
          id: msgId,
          date: new Date().toJSON(),
          replyTo,
        });
        chatCopy.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setReplyTo(null);
        setChat(chatCopy);
      } else {
        axios
          .post(
            `/api/chat`,
            {
              chatData: textInput.current.value.trim(),
              sender_id: localStorage.id,
              receiver_id: receiver.id,
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
          .patch(`/api/notifications/${receiver.id}/${localStorage.id}/update`)
          .then(() => {
            ws.send(
              JSON.stringify({
                instructions: {
                  instruction: ['refreshNotifications'],
                  msgSender: localStorage.id,
                },
              })
            );
          });

        const chatCopy = [...chat];
        chatCopy.push({
          chatData: textInput.current.value.trim(),
          sender_id: localStorage.id,
          receiver_id: receiver.id,
          id: msgId,
          date: new Date().toJSON(),
        });
        chatCopy.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setChat(chatCopy);
      }
      textInput.current.focus();
      textInput.current.value = '';
    }
    setIsTyping(false);
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

  const handleChangeTyping = (e) => {
    textInput.current.value = e.target.value;
    if (textInput.current.value) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  };
  useEffect(() => {
    if (isTyping !== null) {
      ws.send(
        JSON.stringify({
          instructions: [
            {
              isTyping: isTyping,
              isTypingTarget: receiver.id,
              msgSender: localStorage.id,
            },
          ],
        })
      );
    }
  }, [isTyping]);
  const updateFriendsInfo = (id) => {
    const friendsInfoCopy = friendsInfo.map((friend) => {
      if (friend.id === id) {
        const updatedFriend = friend;
        updatedFriend.notifications = {};
        return updatedFriend;
      } else {
        return friend;
      }
    });
    setFriendsInfo(friendsInfoCopy);
  };
  const handleChatSearchClick = (e) => {
    e.preventDefault();
    if (e.target.parentNode.parentNode.parentNode.nextSibling) {
      e.target.parentNode.parentNode.parentNode.nextSibling.childNodes.forEach(
        (element) => {
          if (
            element.lastChild &&
            element.lastChild.firstChild.lastChild &&
            element.lastChild.firstChild.lastChild.textContent
              .toLowerCase()
              .includes(chatSearchInput.current.value.toLowerCase())
          ) {
            element.lastChild.firstChild.lastChild.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            element.lastChild.firstChild.firstChild.focus({
              preventScroll: true,
            });
          } else if (
            element.lastChild &&
            element.lastChild.firstChild.firstChild &&
            element.lastChild.firstChild.firstChild.textContent
              .toLowerCase()
              .includes(chatSearchInput.current.value.toLowerCase())
          ) {
            element.lastChild.firstChild.firstChild.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            element.lastChild.firstChild.firstChild.focus({
              preventScroll: true,
            });
          }
        }
      );
    } else if (e.target.parentNode.parentNode.nextSibling) {
      e.target.parentNode.parentNode.nextSibling.childNodes.forEach(
        (element) => {
          if (
            element.lastChild &&
            element.lastChild.firstChild.lastChild &&
            element.lastChild.firstChild.lastChild.textContent
              .toLowerCase()
              .includes(chatSearchInput.current.value.toLowerCase())
          ) {
            element.lastChild.firstChild.lastChild.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            element.lastChild.firstChild.lastChild.focus({
              preventScroll: true,
            });
          } else if (
            element.lastChild &&
            element.lastChild.firstChild.firstChild &&
            element.lastChild.firstChild.firstChild.textContent
              .toLowerCase()
              .includes(chatSearchInput.current.value.toLowerCase())
          ) {
            element.lastChild.firstChild.firstChild.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            element.lastChild.firstChild.firstChild.focus({
              preventScroll: true,
            });
            console.log(element.lastChild.firstChild.firstChild);
          }
        }
      );
    }
  };
  return (
    <div className="mainDiv">
      <div>
        <div className="logOut">
          <input
            type="button"
            value="Log Out"
            onClick={(e) => {
              e.preventDefault();
              axios
                .patch(
                  `/api/people/${localStorage.id}/${localStorage.id}/${searchText}`,
                  {
                    isOnline: false,
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
                        instruction: ['refreshFriends', 'refreshPeople'],
                        me: localStorage.id,
                      },
                    })
                  );
                });
              props.setIsLoggedIn(false);
              localStorage.clear();
            }}
          />
          <span className="loggedIn">Logged in: </span>
          <span className="currUser">{currUser && currUser.full_name}</span>
        </div>
        <div className="peopleDiv">
          <div className="addFriendDiv">
            <AddFriend
              setCurrUser={setCurrUser}
              setFriends={setFriends}
              receiver={receiver}
              setReceiver={setReceiver}
              setSearchText={setSearchText}
              searchText={searchText}
              foundPeople={foundPeople}
              setFoundPeople={setFoundPeople}
              allPeople={allPeople}
              setAllPeople={setAllPeople}
              setIsSeen={setIsSeen}
            />
          </div>
          <div className="friendsDiv">
            <input
              type="button"
              className="friendsBtn"
              value="Friends"
              onClick={() => {
                setToggleFriends(!toggleFriends);
              }}
            />
            <div
              style={toggleFriends ? { display: 'none' } : { display: 'block' }}
            >
              <SearchBar
                setFriends={setFriends}
                foundFriends={foundFriends}
                setFoundFriends={setFoundFriends}
                friendsInfo={friendsInfo}
                friendSearchText={friendSearchText}
                setFriendSearchText={setFriendSearchText}
              />
              <Friends
                friendsInfo={friendsInfo}
                setReceiver={setReceiver}
                receiver={receiver}
                setFriends={setFriends}
                setChat={setChat}
                chat={chat}
                searchText={searchText}
                setFoundPeople={setFoundPeople}
                setAllPeople={setAllPeople}
                setFoundFriends={setFoundFriends}
                foundFriends={foundFriends}
                friendSearchText={friendSearchText}
                setFriendSearchText={setFriendSearchText}
                setIsSeen={setIsSeen}
                setCurrUser={setCurrUser}
                textInput={textInput}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="chatDiv">
        <div>
          {receiver && `To: ${receiver.name}`}
          <div className="chatSearch">
            <input
              type="text"
              id="chatSearchInputId"
              className="chatSearchTerm"
              placeholder="What are you looking for?"
              ref={chatSearchInput}
              onKeyDown={(e) => {
                if (receiver) {
                  if (
                    document.activeElement ===
                      document.getElementById('chatSearchInputId') &&
                    e.key === 'Enter'
                  ) {
                    handleChatSearchClick(e);
                  }
                }
              }}
            />
            <button
              type="submit"
              className="chatSearchButton"
              onClick={(e) => {
                handleChatSearchClick(e);
              }}
            >
              <img src={search_image} alt="" />
            </button>
          </div>
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
                    setReplyTo(null);
                  }}
                />
              </div>
            </div>
          )}

          <div className="isTyping">
            {isFriendTyping && receiver ? 'Typing...' : null}
          </div>
          <div className="isSeen">{isSeen && receiver ? 'Seen' : null}</div>

          {chat && receiver ? (
            <Chat
              chat={chat}
              setChat={setChat}
              receiver={receiver}
              setReplyTo={setReplyTo}
            />
          ) : (
            <div className="emptyChat">Click on Friend to Start Chatting</div>
          )}
        </div>
        {receiver && (
          <div>
            <div className="sendTextDiv">
              <div>
                <textarea
                  autoFocus
                  id="textareaId"
                  onChange={(e) => {
                    handleChangeTyping(e);
                  }}
                  onFocus={() => {
                    if (
                      chat &&
                      chat[0] &&
                      chat[0].sender_id !== localStorage.id
                    ) {
                      axios.patch(
                        `/api/notifications/${localStorage.id}/${receiver.id}/onSeen`
                      );
                      updateFriendsInfo(receiver.id);
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
                    }
                  }}
                  onKeyDown={(e) => {
                    if (receiver) {
                      if (
                        document.activeElement ===
                          document.getElementById('textareaId') &&
                        e.key === 'Enter'
                      ) {
                        e.preventDefault();
                        handleSendClick();
                      }
                    }
                  }}
                  ref={textInput}
                ></textarea>
              </div>
              <div>
                <input
                  type="button"
                  value="Send"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendClick();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main;
