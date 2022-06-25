import Main from './Components/Main';
import Authorization from './Components/Authorization';
import { useState } from 'react';
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      {localStorage.length > 0 ? (
        <Main setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Authorization setIsLoggedIn={setIsLoggedIn} />
      )}
    </>
  );
}

export default App;
