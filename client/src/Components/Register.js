import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ws from './socketConfig';

function Register(props) {
  const firstNameInput = useRef(null);
  const lastNameInput = useRef(null);
  const mailInput = useRef(null);
  const passwordInput = useRef(null);
  const idInput = useRef(null);
  const [validationError, setValidationError] = useState({
    'first name': '',
    'last name': '',
    mail: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrorCopy = {
      'first name': '',
      'last name': '',
      mail: '',
      password: '',
    };
    if (!firstNameInput.current.value.length) {
      validationErrorCopy['first name'] = 'First name is required';
    } else if (firstNameInput.current.value.length < 4) {
      validationErrorCopy['first name'] =
        'Your first name should have at least 4 letters';
    }
    if (!firstNameInput.current.value.length) {
      validationErrorCopy['last name'] = 'Last name is required';
    } else if (lastNameInput.current.value.length < 4) {
      validationErrorCopy['last name'] =
        'Your last name should have at least 4 letters';
    }
    if (!mailInput.current.value) {
      validationErrorCopy.mail = 'Email is required';
    } else if (!mailInput.current.value.match(/^\S+@\S+\.\S+$/)) {
      validationErrorCopy.mail = 'Enter valid email';
    } else {
      axios
        .post(
          `/api/people/person`,
          { email: mailInput.current.value },
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
          if (data.length > 0)
            validationErrorCopy.mail = 'This email is already used';
        });
    }
    if (!passwordInput.current.value.length) {
      validationErrorCopy.password = 'Password is required';
    } else if (passwordInput.current.value.length < 6) {
      validationErrorCopy.password =
        'Your password should have at least 6 letters';
    }
    setValidationError({ ...validationError, ...validationErrorCopy });
    if (
      validationErrorCopy['first name'] === '' &&
      validationErrorCopy['last name'] === '' &&
      validationErrorCopy.mail === '' &&
      validationErrorCopy.password === ''
    ) {
      ws.send(
        JSON.stringify({
          newPerson: {
            first_name: firstNameInput.current.value,
            last_name: lastNameInput.current.value,
            email: mailInput.current.value,
            password: passwordInput.current.value,
            id: idInput.current.value,
          },
          instructions: { instruction: ['refreshPeople'], me: localStorage.id },
        })
      );
      localStorage.setItem('id', idInput.current.value);
      props.setIsLoggedIn(true);
    }
  };

  return (
    <div>
      <form className="register">
        <div>
          <label htmlFor="first_name">First Name*:</label>
          <input type="text" id="first_name" ref={firstNameInput} required />
          <div className="validationDiv">{validationError['first name']}</div>
        </div>
        <div>
          <label htmlFor="">Last Name*:</label>
          <input type="text" id="last_name" ref={lastNameInput} required />
          <div className="validationDiv">{validationError['last name']}</div>
        </div>
        <div>
          <label htmlFor="mail">Email*:</label>
          <input type="email" id="mail" ref={mailInput} required />
          <div className="validationDiv">{validationError.mail}</div>
        </div>
        <div>
          <label htmlFor="password">Password*:</label>
          <input type="password" id="password" ref={passwordInput} required />
          <div className="validationDiv">{validationError.password}</div>
        </div>
        <input type="hidden" value={uuidv4()} required ref={idInput} />
        <div>
          <button
            type="button"
            value="submit"
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

export default Register;
