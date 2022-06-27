import axios from 'axios';
import { useRef } from 'react';

function SearchBar(props) {
  const searchInput = useRef(null);

  const handleChange = (e) => {
    if (e.target.value !== '') {
      props.setFriendSearchText(searchInput.current.value);
      const foundFriendsCopy = [];
      axios
        .get(
          `http://localhost:3000/people/${localStorage.id}/${e.target.value}`
        )
        .then((request) => {
          return request.data;
        })
        .then((data) => {
          props.friendsInfo.forEach((obj1) => {
            data.forEach((obj2) => {
              if (JSON.stringify(obj1) === JSON.stringify(obj2)) {
                foundFriendsCopy.push(obj1);
                foundFriendsCopy.sort((a, b) => {
                  return b.isOnline - a.isOnline;
                });
              }
            });
          });
          props.setFoundFriends(
            foundFriendsCopy.sort((a, b) => {
              return b.isOnline - a.isOnline;
            })
          );
        });
    } else {
      props.setFoundFriends([]);
      props.setFriendSearchText('');
    }
  };

  return (
    <div>
      <input
        type="search"
        style={{ marginTop: '5px' }}
        ref={searchInput}
        onChange={(e) => {
          handleChange(e);
        }}
      />
    </div>
  );
}

export default SearchBar;
