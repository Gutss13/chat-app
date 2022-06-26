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
  const textInput = useRef(null);

  useEffect(() => {
    if (friends.length > 0) {
      const friendsInfoCopy = [];
      friends.forEach((friend) => {
        axios
          .get(`http://localhost:3000/people/personbyid/${friend}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            friendsInfoCopy.push(data[0]);
            setFriendsInfo([...friendsInfoCopy]);
          });
      });
    } else {
      setFriendsInfo([]);
    }
  }, [friends]);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data && data[0]) setFriends([...data[0].friendList.friends]);
      });
    props.setIsLoggedIn(true);

    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${searchText}`,
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
            instructions: ['refreshFriends', 'refreshPeople'],
          })
        );
      });

    window.addEventListener('beforeunload', () => {
      ws.send(
        JSON.stringify({
          instructions: [
            'refreshFriends',
            'refreshPeople',
            { id: localStorage.id, searchText: searchText },
          ],
        })
      );
    });

    ws.addEventListener('message', (e) => {
      if (
        e.data !== 'refreshPeople' &&
        e.data !== 'refreshRequests' &&
        e.data !== 'refreshChat' &&
        e.data !== 'refreshFriends'
      ) {
        const newData = JSON.parse(e.data);
        if (newData && newData.target === localStorage.id) {
          setIsFriendTyping(newData.isTyping);
        }
      }
    });
    axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => setCurrUser(data[0]));
  }, []);

  useEffect(() => {
    ws.addEventListener('message', (e) => {
      const newData = e.data;
      if (newData === 'refreshChat' && receiver) {
        axios
          .get(`http://localhost:3000/chat/${receiver.id}/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            setChat([...data]);
          });
      }
    });
  }, [receiver]);

  const handleSendClick = (e) => {
    e.preventDefault();
    axios
      .post(
        'http://localhost:3000/chat',
        {
          chatData: e.target.parentNode.previousSibling.lastChild.value,
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
        ws.send(JSON.stringify({ instructions: ['refreshChat'] }));
        e.target.parentNode.previousSibling.lastChild.value = '';
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
          instructions: [{ isTyping: isTyping, target: receiver.id }],
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
                  `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${searchText}`,
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
                      instructions: ['refreshFriends', 'refreshPeople'],
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
          <span className="currUser">{currUser.full_name}</span>
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
            />
          </div>
        </div>
      </div>
      <div className="chatDiv">
        <div>{receiver && `To: ${receiver.name}`}</div>
        <div className="chat">
          {chat && receiver ? (
            <Chat chat={chat} />
          ) : (
            <div className="emptyChat">Click on Friend to Start Chatting</div>
          )}
        </div>
        {receiver && (
          <div>
            <div>{isFriendTyping ? 'Typing...' : null}</div>
            <div className="sendTextDiv">
              <div>
                <textarea
                  rows="5"
                  onChange={(e) => {
                    handleChangeTyping(e);
                  }}
                  ref={textInput}
                ></textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    handleSendClick(e);
                    setIsTyping(false);
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
