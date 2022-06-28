import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../Styles/reset.css';
import '../Styles/Main.css';
import ws from './socketConfig';
import SearchBar from './SearchBar';
import Chat from './Chat';
import AddFriend from './AddFriend';
import Friends from './Friends';

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
  const textInput = useRef(null);

  useEffect(() => {
    if (friends.length > 0) {
      const friendsInfoCopy = [];
      friends.forEach((friend) => {
        axios
          .get(`/api/people/personbyid/${friend}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            friendsInfoCopy.push(data[0]);
            friendsInfoCopy.sort((a, b) => {
              return b.isOnline - a.isOnline;
            });
            setFriendsInfo([...friendsInfoCopy]);
          });
      });
    } else {
      setFriendsInfo([]);
    }
  }, [friends]);

  useEffect(() => {
    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data && data[0]) setFriends([...data[0].friendList.friends]);
      });
    props.setIsLoggedIn(true);

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

    const updateStatus = () => {
      ws.send(
        JSON.stringify({
          instructions: {
            instruction: ['refreshFriends', 'refreshPeople'],
            searchText: {
              id: localStorage.id,
              searchText,
              url: window.location.origin,
            },
          },
        })
      );
    };

    window.addEventListener('beforeunload', updateStatus);

    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => setCurrUser(data[0]));

    return () => {
      window.removeEventListener('beforeunload', updateStatus);
    };
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
              setChat(data);
            });
        }
      }
    };
    const updateChatStatus = (e) => {
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
          if (
            newData.isSeenTarget &&
            newData.isSeenTarget === localStorage.id &&
            newData.msgSender === receiver.id
          ) {
            setIsSeen(newData.isSeen);
          }
        }
      }
    };
    ws.addEventListener('message', updateChatStatus);
    ws.addEventListener('message', updateChat);

    return () => {
      ws.removeEventListener('message', updateChat);
      ws.removeEventListener('message', updateChatStatus);
    };
  }, [receiver]);

  const handleSendClick = () => {
    axios
      .post(
        '/api/chat',
        {
          chatData: textInput.current.value.trim(),
          sender_id: localStorage.id,
          receiver_id: receiver.id,
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
    if (textInput.current.value) {
      textInput.current.value = '';
    }
    setIsTyping(false);
    if (textInput.current.value && chat) {
      setIsSeen(false);
      ws.send(
        JSON.stringify({
          instructions: [
            {
              isSeen: false,
              isSeenTarget: chat[0].sender_id,
              msgSender: localStorage.id,
            },
          ],
        })
      );
    }
    axios
      .get(`/api/chat/${receiver.id}/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        setChat(data);
      });
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
  return (
    <div className="mainDiv">
      <div>
        <div className="logOut">
          <button
            type="button"
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
          >
            Log Out
          </button>
          <span className="loggedIn">Logged in: </span>
          <span className="currUser">{currUser && currUser.full_name}</span>
        </div>
        <div className="peopleDiv">
          <div className="addFriendDiv">
            <AddFriend
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
            <span>Friends</span>
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
              searchText={searchText}
              setFoundPeople={setFoundPeople}
              setAllPeople={setAllPeople}
              setFoundFriends={setFoundFriends}
              foundFriends={foundFriends}
              friendSearchText={friendSearchText}
              setFriendSearchText={setFriendSearchText}
              setIsSeen={setIsSeen}
            />
          </div>
        </div>
      </div>
      <div className="chatDiv">
        <div>{receiver && `To: ${receiver.name}`}</div>
        <div className="chat">
          <div className="isTyping">
            {isFriendTyping && receiver ? 'Typing...' : null}
          </div>
          <div className="isSeen">{isSeen && receiver ? 'Seen' : null}</div>

          {chat && receiver ? (
            <Chat chat={chat} />
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
                  rows="5"
                  id="textareaId"
                  onChange={(e) => {
                    handleChangeTyping(e);
                  }}
                  onFocus={() => {
                    if (chat && chat[0].sender_id !== localStorage.id) {
                      ws.send(
                        JSON.stringify({
                          instructions: [
                            {
                              isSeen: true,
                              isSeenTarget: chat[0].sender_id,
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendClick();
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main;
