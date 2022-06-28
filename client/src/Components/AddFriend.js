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
      .get(`/api/people/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        props.setAllPeople(
          data.sort((a, b) => {
            return b.isOnline - a.isOnline;
          })
        );
      });

    ws.addEventListener('message', (e) => {
      const newData = JSON.parse(e.data);
      if (
        (newData.instruction === 'refreshPeople' ||
          newData.instruction === 'refreshRequests') &&
        newData.me !== localStorage.id
      ) {
        axios
          .get(`/api/people/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            props.setAllPeople(
              data.sort((a, b) => {
                return b.isOnline - a.isOnline;
              })
            );
          });
        if (
          searchInput.current !== null &&
          searchInput.current.value !== null
        ) {
          axios
            .get(`/api/people/${localStorage.id}/${searchInput.current.value}`)
            .then((request) => {
              return request.data;
            })
            .then((data) => {
              props.setFoundPeople(
                data.sort((a, b) => {
                  return b.isOnline - a.isOnline;
                })
              );
            });
        }
      }
    });
  }, []);

  const handleChange = (e) => {
    if (e.target.value !== '') {
      props.setSearchText(searchInput.current.value);
      axios
        .get(`/api/people/${localStorage.id}/${e.target.value}`)
        .then((request) => {
          return request.data;
        })
        .then((data) => {
          props.setFoundPeople(
            data.sort((a, b) => {
              return b.isOnline - a.isOnline;
            })
          );
        });
    } else {
      props.setFoundPeople(null);
      props.setSearchText('');
    }
  };

  const handleClickAddFriend = async (e) => {
    e.preventDefault();
    const person_receiver = await axios
      .get(`/api/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const person_sender = await axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });

    axios
      .patch(
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
        ws.send(
          JSON.stringify({
            instructions: {
              instruction: ['refreshRequests'],
              me: localStorage.id,
            },
          })
        );
      });
    axios
      .patch(
        `/api/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
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
    const meFriendList = me.friendList.friends.filter(
      (val) => val !== e.target.className
    );
    const friendFriendList = friend.friendList.friends.filter(
      (val) => val !== localStorage.id
    );
    props.setFriends([...meFriendList]);

    axios
      .patch(
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
          JSON.stringify({
            instructions: {
              instruction: ['refreshFriends', 'refreshPeople'],
              me: localStorage.id,
            },
          })
        );
      });
    axios
      .patch(
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
      });
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
    props.setIsSeen(false);
  };

  const acceptFriendRequest = async (e) => {
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
    const incomingKeyName = Object.keys(me.friendList.requests.incoming).find(
      (key) => me.friendList.requests.incoming[key] === e.target.className
    );
    delete me.friendList.requests.incoming[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.sent).find(
      (key) => friend.friendList.requests.sent[key] === localStorage.id
    );
    delete friend.friendList.requests.sent[sentKeyName];
    props.setFriends([...me.friendList.friends, e.target.className]);
    axios
      .patch(
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
            instructions: {
              instruction: ['refreshFriends', 'refreshRequests'],
              me: localStorage.id,
            },
          })
        );
      });
    axios
      .patch(
        `/api/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
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
      });
    const updatedRequests = incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    setIncomingRequests([...updatedRequests]);
  };

  const rejectFriendRequest = async (e) => {
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
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
          JSON.stringify({
            instructions: {
              instruction: ['refreshRequests'],
              me: localStorage.id,
            },
          })
        );
      });
    axios
      .patch(
        `/api/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
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
      });
    const updatedRequests = incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    setIncomingRequests(updatedRequests);
  };

  const handleClickCancelRequest = async (e) => {
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
        `/api/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
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
          JSON.stringify({
            instructions: {
              instruction: ['refreshRequests', 'refreshPeople'],
              me: localStorage.id,
            },
          })
        );
      });
    axios
      .patch(
        `/api/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
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
      });
  };
  return (
    <div>
      <FriendRequests
        setFriends={props.setFriends}
        setAllPeople={props.setAllPeople}
        searchText={props.searchText}
        setFoundPeople={props.setFoundPeople}
        incomingRequests={incomingRequests}
        setIncomingRequests={setIncomingRequests}
      />
      {!isSearch ? (
        <div className="inline-block">
          <input
            type="button"
            style={{ marginTop: '5px' }}
            value="Add friend"
            className="inline-block"
            onClick={() => {
              setIsSearch(true);
            }}
          />
        </div>
      ) : (
        <div>
          <div className="peopleInnerDiv" style={{ marginTop: '5px' }}>
            <input
              type="text"
              className="searchBar"
              ref={searchInput}
              onChange={(e) => {
                handleChange(e);
              }}
            />
            <input
              type="button"
              className="inline-block"
              value="Cancel"
              onClick={() => {
                setIsSearch(false);
              }}
            />
          </div>

          <div className="peopleContainer">
            {props.foundPeople && props.searchText
              ? props.foundPeople.map((person, i) => {
                  return (
                    <div key={i} className="people peopleInnerDiv">
                      <div>
                        <div
                          className={person.isOnline ? 'online' : 'offline'}
                        ></div>
                        <div>
                          {person.first_name} {person.last_name}
                        </div>
                      </div>
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
                          <input
                            type="button"
                            value="Accept"
                            className={person.id}
                            onClick={(e) => {
                              acceptFriendRequest(e);
                            }}
                          />
                          <input
                            type="button"
                            value="Reject"
                            className={person.id}
                            onClick={(e) => {
                              rejectFriendRequest(e);
                            }}
                          />
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
                    <div key={i} className="people peopleInnerDiv">
                      <div>
                        <div
                          className={person.isOnline ? 'online' : 'offline'}
                        ></div>
                        <div>
                          {person.first_name} {person.last_name}
                        </div>
                      </div>
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
    </div>
  );
}

export default AddFriend;
