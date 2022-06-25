import { useState } from 'react';
import Login from './Login';
import Register from './Register';

function FirstLogin(props) {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setIsRegister(true);
        }}
      >
        Register
      </button>
      <button
        type="button"
        onClick={() => {
          setIsRegister(false);
        }}
      >
        Log In
      </button>
      {isRegister ? (
        <Register setIsLoggedIn={props.setIsLoggedIn} />
      ) : (
        <Login setIsLoggedIn={props.setIsLoggedIn} />
      )}
    </div>
  );
}

export default FirstLogin;
