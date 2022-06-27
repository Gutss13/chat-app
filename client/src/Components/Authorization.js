import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../Styles/reset.css';
import '../Styles/Authorization.css';

function FirstLogin(props) {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="authorization">
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
      </div>
      <div>
        {isRegister ? (
          <Register setIsLoggedIn={props.setIsLoggedIn} />
        ) : (
          <Login setIsLoggedIn={props.setIsLoggedIn} />
        )}
      </div>
    </div>
  );
}

export default FirstLogin;
