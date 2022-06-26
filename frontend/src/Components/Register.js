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
  const [mailValidate, setMailValidate] = useState();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      firstNameInput.current.value &&
      lastNameInput.current.value &&
      mailInput.current.value &&
      passwordInput.current.value
    ) {
      axios
        .get(`http://localhost:3000/people/person/${mailInput.current.value}`)
        .then((request) => {
          return request.data;
        })
        .then((data) => {
          setMailValidate(data);
        });
    }
  };

  useEffect(() => {
    if (mailValidate && mailValidate.length === 0) {
      ws.send(
        JSON.stringify({
          newPerson: {
            first_name: firstNameInput.current.value,
            last_name: lastNameInput.current.value,
            email: mailInput.current.value,
            password: passwordInput.current.value,
            id: idInput.current.value,
          },
          instructions: ['refreshPeople'],
        })
      );
      localStorage.setItem('id', idInput.current.value);
      props.setIsLoggedIn(true);
    }
  }, [mailValidate]);

  return (
    <div>
      <form className="register">
        <div>
          <label htmlFor="first_name">First Name*:</label>
          <input type="text" id="first_name" ref={firstNameInput} required />
        </div>
        <div>
          <label htmlFor="">Last Name*:</label>
          <input type="text" id="last_name" ref={lastNameInput} required />
        </div>
        <div>
          <label htmlFor="mail">Email*:</label>
          <input type="email" id="mail" ref={mailInput} required />
          {mailValidate &&
            mailValidate.length > 0 &&
            'This mail is already used'}
        </div>
        <div>
          <label htmlFor="password">Password*:</label>
          <input type="password" id="password" ref={passwordInput} required />
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
            submit
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;
