import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

function Login(props) {
  const mailInput = useRef(null);
  const passwordInput = useRef(null);
  const [user, setUser] = useState();
  const [userError, setUserError] = useState();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!passwordInput.current.value) {
      setUserError({ password: 'Password field is empty' });
    }
    if (!mailInput.current.value) {
      setUserError({ email: 'Email field is empty' });
    }
    if (mailInput.current.value && passwordInput.current.value) {
      axios
        .get(
          `/api/people/person/${mailInput.current.value}/${passwordInput.current.value}`
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
    if (user) {
      if (user.length > 0) {
        localStorage.setItem('id', user[0].id);
        props.setIsLoggedIn(true);
      } else {
        setUserError({
          noMatch: 'Email or password is incorrect',
        });
      }
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
          <input
            type="button"
            value="Submit"
            onClick={(e) => {
              handleSubmit(e);
            }}
          />
        </div>
        {userError && userError.email ? (
          <div className="validationDiv">{userError.email}</div>
        ) : userError && userError.password ? (
          <div className="validationDiv">{userError.password}</div>
        ) : userError && userError.noMatch ? (
          <div className="validationDiv">{userError.noMatch}</div>
        ) : null}
      </form>
    </div>
  );
}

export default Login;
