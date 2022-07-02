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
        <input
          type="button"
          value="Register"
          onClick={() => {
            setIsRegister(true);
          }}
        />
        <input
          type="button"
          value="Log In"
          onClick={() => {
            setIsRegister(false);
          }}
        />
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
