import React, { useState } from 'react';
import './Chat.css';

const Chat = ({ user }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSend = () => {
    // Aquí puedes añadir la lógica para enviar el mensaje usando xmppClient.send()
  };

  const handleLogout = async () => {
    window.location.reload();
  };

  return (
    <div className="chat-container">
      <h2>Chat</h2>
      <div>
        <input
          type="text"
          placeholder="Recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Chat;