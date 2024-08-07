import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';

const Chat = ({ user, messages }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageQueue, setMessageQueue] = useState([]); // Estado para la cola de mensajes

  // Maneja el envío de mensajes
  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      const newMessage = {
        sender: user,  // El usuario que envía el mensaje
        text: message, // El texto del mensaje enviado
      };

      // Actualizar la cola de mensajes
      setMessageQueue((prevQueue) => [...prevQueue, newMessage]);

      // Enviar el mensaje a través del servicio XMPP
      sendMessage(recipient, message);
      setMessage('');
    }
  };

  // Maneja el cierre de sesión
  const handleLogout = () => {
    window.location.reload();
  };

  // Efecto para actualizar la cola de mensajes cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      // Solo agregar nuevos mensajes que no están en la cola
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
      <div className="chat-header">
        <h2>{user}'s Chat</h2>
        <button onClick={handleLogout} className="lego-button">Logout</button>
      </div>
      <div className="chat-messages">
        {/* Mostrar la cola de mensajes (enviados y recibidos) */}
        {messageQueue.map((msg, index) => (
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
