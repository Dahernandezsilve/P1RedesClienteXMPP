import React, { useState } from 'react';
import Chat from '@components/Chat';
import Login from '@components/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  return (
    <div>
      {user ? (
        <Chat user={user} messages={messages} />
      ) : (
        <Login setUser={setUser} setMessages={setMessages} />
      )}
    </div>
  );
};

export default App;
