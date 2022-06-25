import axios from 'axios';
import { useEffect } from 'react';
import ws from './socketConfig';

function Friends(props) {
  useEffect(() => {
    axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data[0]) props.setFriends(data[0].friendList.friends);
      });
    ws.addEventListener('message', (e) => {
      const newData = e.data;
      if (newData === 'refreshFriends') {
        axios
          .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            if (data[0]) props.setFriends([...data[0].friendList.friends]);
          });
      }
    });
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    props.setReceiver({
      name: e.target.textContent,
      id: e.target.className,
    });
    axios
      .get(
        `http://localhost:3000/chat/${e.target.className}/${localStorage.id}`
      )
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        props.setChat([...data]);
      });
  };

  const handleClickRemoveFriend = async (e) => {
    e.preventDefault();
    const friend = await axios
      .get(`http://localhost:3000/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const me = await axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const myFriendList = me.friendList.friends.filter(
      (val) => val !== e.target.className
    );
    const friendFriendList = friend.friendList.friends.filter(
      (val) => val !== localStorage.id
    );
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            friends: [...myFriendList],
            requests: { ...me.friendList.requests },
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
        if (props.searchText) {
          props.setFoundPeople([...data.foundPeople]);
        }
        props.setAllPeople([...data.allPeople]);

        ws.send(
          JSON.stringify({ instructions: ['refreshFriends', 'refreshPeople'] })
        );
      });
    axios.patch(
      `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
      {
        friendList: {
          friends: [...friendFriendList],
          requests: { ...friend.friendList.requests },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    props.setFriends([...myFriendList]);
  };

  return (
    <div>
      {props.friendsInfo.length > 0 &&
        props.friendsInfo.map((person, i) => {
          return (
            <div key={i} className="people friends">
              <div className={person.isOnline ? 'online' : 'offline'}></div>
              <span
                className={person.id}
                onClick={(e) => {
                  handleClick(e);
                }}
              >
                {person.first_name} {person.last_name}
              </span>
              <button
                type="button"
                className={person.id}
                onClick={(e) => {
                  handleClickRemoveFriend(e);
                }}
              >
                remove
              </button>
            </div>
          );
        })}
    </div>
  );
}

export default Friends;
