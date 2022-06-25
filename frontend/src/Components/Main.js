import { useEffect, useState } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    if (friends.length > 0) {
      friends.forEach((element) => {
        axios
          .get(`http://localhost:3000/people/personbyid/${element}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            setFriendsInfo([...friendsInfo, data[0]]);
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
          chatData: e.target.parentNode.previousSibling.firstChild.value,
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
      });
  };

  return (
    <div>
      <div>
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
        <SearchBar setFriends={setFriends} />
        <Friends
          friendsInfo={friendsInfo}
          setReceiver={setReceiver}
          setFriends={setFriends}
          setChat={setChat}
          searchText={searchText}
          setFoundPeople={setFoundPeople}
          setAllPeople={setAllPeople}
        />
      </div>
      <AddFriend
        setFriends={setFriends}
        setSearchText={setSearchText}
        searchText={searchText}
        foundPeople={foundPeople}
        setFoundPeople={setFoundPeople}
        allPeople={allPeople}
        setAllPeople={setAllPeople}
      />
      <div>
        <div>{receiver && `To: ${receiver.name}`}</div>
        <div>{chat && <Chat chat={chat} />}</div>
        {receiver && (
          <div>
            <div>
              <textarea cols="50" rows="5"></textarea>
            </div>
            <div>
              <button
                type="button"
                onClick={(e) => {
                  handleSendClick(e);
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Main;
