import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import FriendRequests from './FriendRequests';
import ws from './socketConfig';

function AddFriend(props) {
  const [isSearch, setIsSearch] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const searchInput = useRef('');
  useEffect(() => {
    axios
      .get(`http://localhost:3000/people/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        props.setAllPeople([...data]);
      });

    ws.addEventListener('message', (e) => {
      const newData = e.data;
      if (newData === 'refreshPeople' || newData === 'refreshRequests') {
        axios
          .get(`http://localhost:3000/people/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            props.setAllPeople([...data]);
          });
        if (searchInput.current.value) {
          axios
            .get(
              `http://localhost:3000/people/${localStorage.id}/${searchInput.current.value}`
            )
            .then((request) => {
              return request.data;
            })
            .then((data) => {
              props.setFoundPeople([...data]);
            });
        }
      }
    });
  }, []);

  const handleChange = (e) => {
    if (e.target.value !== '') {
      props.setSearchText(searchInput.current.value);
      axios
        .get(
          `http://localhost:3000/people/${localStorage.id}/${e.target.value}`
        )
        .then((request) => {
          return request.data;
        })
        .then((data) => {
          props.setFoundPeople([...data]);
        });
    } else {
      props.setFoundPeople(null);
      props.setSearchText('');
    }
  };

  const handleClickAddFriend = async (e) => {
    e.preventDefault();
    const person_receiver = await axios
      .get(`http://localhost:3000/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const person_sender = await axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });

    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...person_sender.friendList,
            requests: {
              ...person_sender.friendList.requests,
              sent: {
                ...person_sender.friendList.requests.sent,
                [person_receiver.email]: e.target.className,
              },
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() => {
        ws.send(JSON.stringify({ instructions: ['refreshRequests'] }));
      });
    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...person_receiver.friendList,
            requests: {
              ...person_receiver.friendList.requests,
              incoming: {
                ...person_receiver.friendList.requests.incoming,
                [person_sender.email]: localStorage.id,
              },
            },
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
    const meFriendList = me.friendList.friends.filter(
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
            friends: [...meFriendList],
            requests: { ...me.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() => {
        ws.send(
          JSON.stringify({ instructions: ['refreshFriends', 'refreshPeople'] })
        );
      });
    axios
      .patch(
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
      )
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (props.searchText) {
          props.setFoundPeople([...data.foundPeople]);
        }
        props.setAllPeople([...data.allPeople]);
      });
  };

  const acceptFriendRequest = async (e) => {
    e.preventDefault();
    //add to friendList.friends for both sides
    //remove from friendList.requests for both sides
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
    const incomingKeyName = Object.keys(me.friendList.requests.incoming).find(
      (key) => me.friendList.requests.incoming[key] === e.target.className
    );
    delete me.friendList.requests.incoming[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.sent).find(
      (key) => friend.friendList.requests.sent[key] === localStorage.id
    );
    delete friend.friendList.requests.sent[sentKeyName];
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            friends: [...me.friendList.friends, e.target.className],
            requests: { ...me.friendList.requests },
          },
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
            instructions: ['refreshRequests', 'refreshFriends'],
          })
        );
      });
    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            friends: [...friend.friendList.friends, localStorage.id],
            requests: { ...friend.friendList.requests },
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
      });
    // setFriends(current user's friendList.friends)
    const updatedRequests = incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    setIncomingRequests([...updatedRequests]);
  };

  const rejectFriendRequest = async (e) => {
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
    const incomingKeyName = Object.keys(me.friendList.requests.incoming).find(
      (key) => me.friendList.requests.incoming[key] === e.target.className
    );
    delete me.friendList.requests.incoming[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.sent).find(
      (key) => friend.friendList.requests.sent[key] === localStorage.id
    );
    delete friend.friendList.requests.sent[sentKeyName];
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...me.friendList,
            requests: { ...me.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() => {
        ws.send(JSON.stringify({ instructions: ['refreshRequests'] }));
      });
    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...friend.friendList,
            requests: { ...friend.friendList.requests },
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
      });
    const updatedRequests = incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    setIncomingRequests(updatedRequests);
  };

  const handleClickCancelRequest = async (e) => {
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
    const incomingKeyName = Object.keys(me.friendList.requests.sent).find(
      (key) => me.friendList.requests.sent[key] === e.target.className
    );
    delete me.friendList.requests.sent[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.incoming).find(
      (key) => friend.friendList.requests.incoming[key] === localStorage.id
    );
    delete friend.friendList.requests.incoming[sentKeyName];
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...me.friendList,
            requests: { ...me.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() => {
        ws.send(
          JSON.stringify({ instructions: ['refreshPeople', 'refreshRequests'] })
        );
      });
    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...friend.friendList,
            requests: { ...friend.friendList.requests },
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
      });
  };
  return (
    <div>
      {!isSearch ? (
        <input
          type="button"
          value="Add friend"
          onClick={() => {
            setIsSearch(true);
          }}
        />
      ) : (
        <div>
          <div>
            <input
              type="text"
              ref={searchInput}
              onChange={(e) => {
                handleChange(e);
              }}
            />
            <input
              type="button"
              value="Cancel"
              onClick={() => {
                setIsSearch(false);
              }}
            />
          </div>
          <div>
            {props.foundPeople && props.searchText
              ? props.foundPeople.map((person, i) => {
                  return (
                    <div key={i} className="people">
                      <div
                        className={person.isOnline ? 'online' : 'offline'}
                      ></div>
                      <span>
                        {person.first_name} {person.last_name}
                      </span>
                      {person.friendList.friends.includes(localStorage.id) ? (
                        <input
                          type="button"
                          value="Remove"
                          className={person.id}
                          onClick={(e) => handleClickRemoveFriend(e)}
                        />
                      ) : Object.keys(person.friendList.requests.incoming).find(
                          (key) =>
                            person.friendList.requests.incoming[key] ===
                            localStorage.id
                        ) ? (
                        <input
                          type="button"
                          value="Cancel Request"
                          className={person.id}
                          onClick={(e) => {
                            handleClickCancelRequest(e);
                          }}
                        />
                      ) : Object.keys(person.friendList.requests.sent).find(
                          (key) =>
                            person.friendList.requests.sent[key] ===
                            localStorage.id
                        ) ? (
                        <div>
                          <button
                            type="button"
                            value="Accept"
                            className={person.id}
                            onClick={(e) => {
                              acceptFriendRequest(e);
                            }}
                          >
                            Accept
                          </button>
                          <button
                            value="Reject"
                            className={person.id}
                            onClick={(e) => {
                              rejectFriendRequest(e);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <input
                          type="button"
                          value="Add"
                          className={person.id}
                          onClick={(e) => handleClickAddFriend(e)}
                        />
                      )}
                    </div>
                  );
                })
              : props.allPeople
              ? props.allPeople.map((person, i) => {
                  return (
                    <div key={i} className="people">
                      <div
                        className={person.isOnline ? 'online' : 'offline'}
                      ></div>
                      <span>
                        {person.first_name} {person.last_name}
                      </span>
                      {person.friendList.friends.includes(localStorage.id) ? (
                        <input
                          type="button"
                          value="Remove"
                          className={person.id}
                          onClick={(e) => handleClickRemoveFriend(e)}
                        />
                      ) : Object.keys(person.friendList.requests.incoming).find(
                          (key) =>
                            person.friendList.requests.incoming[key] ===
                            localStorage.id
                        ) ? (
                        <input
                          type="button"
                          value="Cancel Request"
                          className={person.id}
                          onClick={(e) => {
                            handleClickCancelRequest(e);
                          }}
                        />
                      ) : Object.keys(person.friendList.requests.sent).find(
                          (key) =>
                            person.friendList.requests.sent[key] ===
                            localStorage.id
                        ) ? (
                        <div>
                          <button
                            type="button"
                            value="Accept"
                            className={person.id}
                            onClick={(e) => {
                              acceptFriendRequest(e);
                            }}
                          >
                            Accept
                          </button>
                          <button
                            value="Reject"
                            className={person.id}
                            onClick={(e) => {
                              rejectFriendRequest(e);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <input
                          type="button"
                          value="Add"
                          className={person.id}
                          onClick={(e) => handleClickAddFriend(e)}
                        />
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      )}
      <FriendRequests
        setFriends={props.setFriends}
        setAllPeople={props.setAllPeople}
        searchText={props.searchText}
        setFoundPeople={props.setFoundPeople}
        incomingRequests={incomingRequests}
        setIncomingRequests={setIncomingRequests}
      />
    </div>
  );
}

export default AddFriend;
