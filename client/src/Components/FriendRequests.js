import axios from 'axios';
import { useEffect, useState } from 'react';
import ws from './socketConfig';

function FriendRequests(props) {
  const [isRequestsShown, setIsRequestsShown] = useState(false);

  useEffect(() => {
    axios
      .get(`/api/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        const incomingRequestsCopy = [];
        if (data[0] && data[0].friendList) {
          if (Object.keys(data[0].friendList.requests.incoming).length > 0) {
            Object.keys(data[0].friendList.requests.incoming).forEach((key) => {
              axios
                .get(
                  `/api/people/personbyid/${data[0].friendList.requests.incoming[key]}`
                )
                .then((request) => {
                  return request.data;
                })
                .then((reqSender) => {
                  incomingRequestsCopy.push(reqSender[0]);
                  props.setIncomingRequests([...incomingRequestsCopy]);
                });
            });
          } else {
            props.setIncomingRequests([]);
          }
        }
      });
    const updateRequests = (e) => {
      const newData = JSON.parse(e.data);
      if (
        newData.instruction === 'refreshRequests' &&
        newData.me !== localStorage.id
      ) {
        axios
          .get(`/api/people/personbyid/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            const incomingRequestsCopy = [];
            if (data[0] && data[0].friendList) {
              if (
                Object.keys(data[0].friendList.requests.incoming).length > 0
              ) {
                Object.keys(data[0].friendList.requests.incoming).forEach(
                  (key) => {
                    axios
                      .get(
                        `/api/people/personbyid/${data[0].friendList.requests.incoming[key]}`
                      )
                      .then((request) => {
                        return request.data;
                      })
                      .then((reqSender) => {
                        incomingRequestsCopy.push(reqSender[0]);
                        props.setIncomingRequests([...incomingRequestsCopy]);
                      });
                  }
                );
              } else {
                props.setIncomingRequests([]);
              }
            }
          });
      }
    };
    ws.addEventListener('message', updateRequests);
    return () => ws.removeEventListener('message', updateRequests);
  }, []);

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
      .then(() =>
        ws.send(
          JSON.stringify({
            instructions: {
              instruction: ['refreshFriends', 'refreshRequests'],
              me: localStorage.id,
            },
          })
        )
      );

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
    const updatedRequests = props.incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    props.setIncomingRequests([...updatedRequests]);
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
    const updatedRequests = props.incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    props.setIncomingRequests(updatedRequests);
  };

  useEffect(() => {
    if (props.incomingRequests.length === 0) {
      setIsRequestsShown(false);
    }
  }, [props.incomingRequests]);

  return (
    <>
      <button
        className="inline-block"
        onClick={() => setIsRequestsShown(!isRequestsShown)}
      >
        Requests ({props.incomingRequests.length})
      </button>
      {isRequestsShown && props.incomingRequests.length > 0
        ? props.incomingRequests.map((element, i) => {
            return (
              <div key={i} className="people peopleInnerDiv">
                <div>
                  <div>
                    {element.first_name} {element.last_name}
                  </div>
                </div>
                <div>
                  <input
                    type="button"
                    value="Accept"
                    className={element.id}
                    onClick={(e) => {
                      acceptFriendRequest(e);
                    }}
                  />
                  <input
                    type="button"
                    value="Reject"
                    className={element.id}
                    onClick={(e) => {
                      rejectFriendRequest(e);
                    }}
                  />
                </div>
              </div>
            );
          })
        : null}
    </>
  );
}

export default FriendRequests;
