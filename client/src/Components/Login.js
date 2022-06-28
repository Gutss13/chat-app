import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

function Login(props) {
  const mailInput = useRef(null);
  const passwordInput = useRef(null);
  const [user, setUser] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mailInput.current.value && passwordInput.current.value) {
      axios
        .get(
          `${window.location.origin}/api/people/person/${mailInput.current.value}/${passwordInput.current.value}`
        )
        .then((request) => {
          return request.data;
        })
        .then((data) => {
          setUser(data);
        });
    }
  };

  useEffect(() => {
    if (user && user.length > 0) {
      localStorage.setItem('id', user[0].id);
      props.setIsLoggedIn(true);
    }
  }, [user]);

  return (
    <div className="logIn">
      <form>
        <div>
          <label htmlFor="mail">Email:</label>
          <input type="email" id="mail" ref={mailInput} required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" ref={passwordInput} required />
        </div>
        <div>
          <button
            type="button"
            onClick={(e) => {
              handleSubmit(e);
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
