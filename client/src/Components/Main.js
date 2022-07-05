import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import '../Styles/reset.css';
import '../Styles/Main.css';
import messageReceived from '../Sounds/message_sound.mp3';
import ws from './socketConfig';
import SearchBar from './SearchBar';
import AddFriend from './AddFriend';
import Friends from './Friends';
import ChatSection from './ChatSection';

function Main(props) {
  const [friends, setFriends] = useState([]);
  const [friendsInfo, setFriendsInfo] = useState([]);
  const [receiver, setReceiver] = useState();
  const [chat, setChat] = useState();
  const [searchText, setSearchText] = useState();
  const [foundPeople, setFoundPeople] = useState();
  const [allPeople, setAllPeople] = useState();
  const [foundFriends, setFoundFriends] = useState([]);
  const [friendSearchText, setFriendSearchText] = useState('');
  const [currUser, setCurrUser] = useState('');
  const [isSeen, setIsSeen] = useState(false);
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
          setFriends([...data[0].friendList.friends]);
          setCurrUser(data[0]);
        }
      });
    setTimeout(() => {
      axios
        .patch(
          `/api/people/${localStorage.id}/${localStorage.id}/${null}`,
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
    }, 500);

    props.setIsLoggedIn(true);

    const setStatusOffline = () => {
      ws.send(
        JSON.stringify({
          instructions: {
            instruction: ['refreshFriends', 'refreshPeople'],
            me: localStorage.id,
            toggleStatus: {
              id: localStorage.id,
              url: window.location.origin,
              status: 'offline',
            },
          },
        })
      );
    };
    window.addEventListener('beforeunload', setStatusOffline);
    window.addEventListener('unload', setStatusOffline);
    return () => {
      window.removeEventListener('beforeunload', setStatusOffline);
      window.removeEventListener('unload', setStatusOffline);
    };
  }, []);

  useEffect(() => {
    const updateNotifications = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction === 'refreshNotifications' &&
        newData.msgReceiver === localStorage.id
      ) {
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
          new Audio(messageReceived).play();
        }
      }
    };
    ws.addEventListener('message', updateNotifications);
    return () => {
      ws.removeEventListener('message', updateNotifications);
    };
  }, [receiver]);

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
                setFriendsInfo={setFriendsInfo}
                friends={friends}
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
                currUser={currUser}
              />
            </div>
          </div>
        </div>
      </div>
      <ChatSection
        chat={chat}
        setChat={setChat}
        receiver={receiver}
        setReceiver={setReceiver}
        setIsSeen={setIsSeen}
        chatSearchInput={chatSearchInput}
        friendsInfo={friendsInfo}
        setFriendsInfo={setFriendsInfo}
        isSeen={isSeen}
      />
    </div>
  );
}

export default Main;
