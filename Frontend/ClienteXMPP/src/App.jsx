import React, { useState } from 'react';
import Chat from '@components/Chat';
import Login from '@components/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [usersList, setUsersList] = useState([]);

  return (
    <div>
      {user ? (
        <Chat user={user} messages={messages} contacts={contacts} usersList={usersList}/>
      ) : (
        <Login setUser={setUser} setMessages={setMessages} setContacts={setContacts} setUsersList={setUsersList}/>
      )}
    </div>
  );
};

export default App;
