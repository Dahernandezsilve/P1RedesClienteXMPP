import React, { useState } from 'react';
import Chat from '@components/Chat';
import Login from '@components/Login';

// Componente principal de la aplicación
const App = () => {
  const [user, setUser] = useState(null); // Estado para el nombre de usuario
  const [messages, setMessages] = useState([]); // Estado para los mensajes
  const [contacts, setContacts] = useState([]); // Estado para la lista de contactos
  const [usersList, setUsersList] = useState([]); // Estado para la lista de usuarios
  const [presence, setPresence] = useState({}); // Estado para la presencia de los usuarios
  const [messageHistories, setMessageHistories] = useState({}); // Estado para los historiales de mensajes
  const [groupsList, setGroupsList] = useState([]); // Estado para la lista de grupos
  return (
    <div>
      {user ? ( // Mostrar el chat si el usuario está autenticado
        <Chat // Componente para el chat
          user={user}
          messages={messages}
          contacts={contacts}
          usersList={usersList}
          presence={presence}
          setMessageHistories={setMessageHistories}
          messageHistories={messageHistories}
          groupsList={groupsList}
        />
      ) : ( // Mostrar el inicio de sesión si el usuario no está autenticado
        <Login // Componente para el inicio de sesión
          setUser={setUser}
          setMessages={setMessages}
          setContacts={setContacts}
          setUsersList={setUsersList}
          setPresence={setPresence}
          setMessageHistories={setMessageHistories}
          setGroupsList={setGroupsList}
        />
      )}
    </div>
  );
};

export default App;
