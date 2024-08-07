import React, { useState } from 'react';
import './Chat.css';

const Chat = ({ user, messages, sendMessage }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      sendMessage(recipient, message);
      setMessage('');
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{user}'s Lego Chat</h2>
        <button onClick={handleLogout} className="lego-button">Logout</button>
      </div>
      <div className="chat-messages">
        {messages && messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === user ? 'sent' : 'received'}`}>
            <span className="chat-sender">{msg.sender}</span>: {msg.text}
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
  );
};

export default Chat;
