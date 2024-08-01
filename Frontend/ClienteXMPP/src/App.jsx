import React, { useState } from 'react';
import Chat from '@components/Chat';
import Login from '@components/Login';

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <div>
      {user ? (
        <Chat user={user} />
      ) : (
        <Login setUser={setUser} />
      )}
    </div>
  );
};

export default App;
