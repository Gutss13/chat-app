import axios from 'axios';
import { useEffect } from 'react';
import ws from './socketConfig';

function Friends(props) {
  useEffect(() => {
    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (data[0]) props.setFriends([...data[0].friendList.friends]);
      });
    const updateFriends = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction === 'refreshFriends' &&
        newData.me !== localStorage.id
      ) {
        axios
          .get(`/api/people/personbyid/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            if (data[0]) {
              props.setFriends([...data[0].friendList.friends]);
              props.setCurrUser(data[0]);
            }
          });
      }
    };
    ws.addEventListener('message', updateFriends);
    return () => ws.removeEventListener('message', updateFriends);
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    axios
      .get(`/api/chat/${e.target.className}/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        props.setChat([...data]);
        props.setReceiver({
          ...props.receiver,
          name: e.target.textContent,
          id: e.target.className,
        });
      });
  };

  const handleClickRemoveFriend = async (e) => {
    e.preventDefault();
    const friend = await axios
      .get(`/api/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const me = await axios
      .get(`/api/people/personbyid/${localStorage.id}`)
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
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
          props.setFoundPeople(
            data.foundPeople.sort((a, b) => {
              return b.isOnline - a.isOnline;
            })
          );
        }
        props.setAllPeople(
          data.allPeople.sort((a, b) => {
            return b.isOnline - a.isOnline;
          })
        );

        ws.send(
          JSON.stringify({
            instructions: {
              instruction: ['refreshFriends', 'refreshPeople'],
              me: localStorage.id,
            },
          })
        );
      });
    axios.patch(
      `/api/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
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
    if (props.receiver && e.target.className === props.receiver.id) {
      props.setReceiver(null);
      ws.send(
        JSON.stringify({
          instructions: {
            instruction: ['removeReceiver'],
            me: e.target.className,
          },
        })
      );
    }
    // props.setIsSeen(false);

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

  return (
    <div className="friendsContainer">
      {props.foundFriends && props.friendSearchText
        ? props.foundFriends.map((person, i) => {
            return (
              <div key={i} className="people friends peopleInnerDiv">
                <div>
                  <div className={person.isOnline ? 'online' : 'offline'}></div>
                  <div
                    className={person.id}
                    onClick={(e) => {
                      handleClick(e);
                    }}
                  >
                    {person.first_name} {person.last_name}
                  </div>
                </div>
                <input
                  type="button"
                  value="Remove"
                  className={person.id}
                  onClick={(e) => {
                    handleClickRemoveFriend(e);
                  }}
                />
              </div>
            );
          })
        : props.friendsInfo.length > 0
        ? props.friendsInfo.map((person, i) => {
            return (
              <div key={i} className="people friends peopleInnerDiv">
                <div>
                  <div>
                    <div
                      className={
                        person && person.isOnline ? 'online' : 'offline'
                      }
                    ></div>
                    {person && person.notifications.number > 0 && (
                      <div className="notificationOuterDiv">
                        <div className="notificationDiv">
                          {person.notifications.number}
                        </div>
                      </div>
                    )}
                    <div
                      className={person && person.id}
                      style={{ display: 'inline' }}
                      onClick={(e) => {
                        handleClick(e);
                      }}
                    >
                      {person && person.first_name} {person && person.last_name}
                    </div>
                  </div>
                </div>
                <input
                  type="button"
                  value="Remove"
                  className={person && person.id}
                  onClick={(e) => {
                    handleClickRemoveFriend(e);
                  }}
                />
              </div>
            );
          })
        : null}
    </div>
  );
}

export default Friends;
