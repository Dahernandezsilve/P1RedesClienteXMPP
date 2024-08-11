import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';
import Slidebar from '@components/Slidebar'; // Importa el componente Slidebar

const Chat = ({ user, messages, contacts}) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);

  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      const newMessage = {
        sender: user,
        text: message,
      };

      setMessageQueue((prevQueue) => [...prevQueue, newMessage]);

      sendMessage(recipient, message);
      setMessage('');
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  const handleSelectContact = (contact) => {
    setRecipient(contact); // Selecciona el contacto para enviarle mensajes
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = messages.filter((msg) => 
        !messageQueue.some((queuedMsg) => queuedMsg.text === msg.text && queuedMsg.sender === msg.sender)
      );

      if (newMessages.length > 0) {
        setMessageQueue((prevQueue) => [...prevQueue, ...newMessages]);
      }
    }
  }, [messages, messageQueue]);

  return (
    <div className="chat-container">
      <Slidebar contacts={contacts} onSelectContact={handleSelectContact} />
      <div className="chat-content">
        <div className="chat-header">
          <h2>{user.split('@')[0]}'s Chat</h2>
          <button onClick={handleLogout} className="lego-button">Logout</button>
        </div>
        <div className="chat-messages">
          {messageQueue.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender === user ? 'sent' : 'received'}`}>
              <span className="chat-sender">{msg.sender.split('@')[0]}</span>: {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-inputs">
          <input
            type="text"
            placeholder="Recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="lego-input"
          />
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="lego-input"
          />
          <button onClick={handleSend} className="lego-button">Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
