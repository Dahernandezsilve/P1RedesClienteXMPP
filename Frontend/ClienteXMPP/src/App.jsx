import React, { useState } from 'react';
import Chat from '@components/Chat';
import Login from '@components/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [presence, setPresence] = useState({});
  const [messageHistories, setMessageHistories] = useState({});
  return (
    <div>
      {user ? (
        <Chat user={user} messages={messages} contacts={contacts} usersList={usersList} presence={presence} setMessageHistories={setMessageHistories} messageHistories={messageHistories}/>
      ) : (
        <Login setUser={setUser} setMessages={setMessages} setContacts={setContacts} setUsersList={setUsersList} setPresence={setPresence} setMessageHistories={setMessageHistories}/>
      )}
    </div>
  );
};

export default App;
