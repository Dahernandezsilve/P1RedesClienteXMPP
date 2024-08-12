import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';
import Slidebar from '@components/Slidebar'; // Importa el componente Slidebar
import Modal from '@components/Modal'; // Importa el componente Modal
import { showAllUsers } from '../../services/xmppService';

const Chat = ({ user, messages, contacts, usersList}) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageQueue, setMessageQueue] = useState([]);
  const [modalOpen, setModalOpen] = useState(false)

  const mockUsers = [
    { username: 'alice123', name: 'Alice Johnson', email: 'alice.johnson@example.com' },
    { username: 'bob456', name: 'Bob Smith', email: 'bob.smith@example.com' },
    { username: 'charlie789', name: 'Charlie Brown', email: 'charlie.brown@example.com' },
    { username: 'david101', name: 'David Wilson', email: 'david.wilson@example.com' },
    { username: 'eve202', name: 'Eve Davis', email: 'eve.davis@example.com' },
    { username: 'frank303', name: 'Frank Miller', email: 'frank.miller@example.com' },
    { username: 'grace404', name: 'Grace Lee', email: 'grace.lee@example.com' },
    { username: 'hank505', name: 'Hank Anderson', email: 'hank.anderson@example.com' },
  ];

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

  const openModal = () => {
    // Aquí deberías hacer la llamada para obtener todos los usuarios
    // Por ejemplo:
    showAllUsers();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
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
          <button onClick={openModal} className="lego-button2">Show All Users</button>
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
      <Modal isOpen={modalOpen} onClose={closeModal} users={usersList} />
    </div>
  );
};

export default Chat;
