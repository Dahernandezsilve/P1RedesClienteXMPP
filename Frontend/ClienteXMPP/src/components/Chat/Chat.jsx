import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';
import Slidebar from '@components/Slidebar';
import Modal from '@components/Modal';
import { showAllUsers } from '../../services/xmppService';

const Chat = ({ user, messages, contacts, usersList, presence }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageHistories, setMessageHistories] = useState({});
  const [selectedContact, setSelectedContact] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); // Estado para almacenar los ID de mensajes procesados

  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      const newMessage = {
        sender: user,
        text: message,
        timestamp: new Date().toISOString(),
      };

      console.log('Sending message:', newMessage);
      console.log('Recipient:', recipient);

      setMessageHistories((prevHistories) => {
        const updatedHistories = {
          ...prevHistories,
          [recipient]: [...(prevHistories[recipient] || []), newMessage],
        };

        console.log('Updated message histories:', updatedHistories);
        return updatedHistories;
      });

      sendMessage(recipient, message);
      setMessage('');
    } else {
      console.log('Message or recipient is empty.');
    }
  };

  const openModal = () => {
    console.log('Opening modal to show all users.');
    showAllUsers();
    setModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal.');
    setModalOpen(false);
  };

  const handleLogout = () => {
    console.log('Logging out.');
    window.location.reload();
  };

  const handleSelectContact = (contact) => {
    console.log('Contact selected:', contact);
    setSelectedContact(contact);
    setRecipient(contact);
  };

  useEffect(() => {
    if (messages.length > 0) {
      console.log('New messages received:', messages);
    }

    if (selectedContact) {
      console.log('Selected contact:', selectedContact);

      const newMessages = messages.filter((msg) => {
        // Se asume que el receptor es el usuario autenticado si no se especifica
        const receiver = msg.receiver || user;
        const senderMatches = msg.sender.split('/')[0] === selectedContact.split('/')[0];
        const receiverMatches = receiver.split('@')[0] === selectedContact.split('@')[0];

        // Verificar si el mensaje ya fue procesado
        const isDuplicate = processedMessageIds.has(msg.id_message);
        
        return (senderMatches || receiverMatches) && !isDuplicate;
      });

      if (newMessages.length > 0) {
        console.log('Filtered new messages:', newMessages);

        // Actualizar el historial de mensajes y almacenar los ID procesados
        setMessageHistories((prevHistories) => {
          const updatedHistories = {
            ...prevHistories,
            [selectedContact]: [
              ...(prevHistories[selectedContact] || []),
              ...newMessages.map((msg) => ({
                ...msg,
                receivedAt: new Date().toISOString(), // Marca cuando se recibió el mensaje
              })),
            ],
          };

          console.log('Updated message histories with new messages:', updatedHistories);
          return updatedHistories;
        });

        // Añadir los nuevos IDs al conjunto de IDs procesados
        setProcessedMessageIds((prevIds) => {
          const updatedIds = new Set(prevIds);
          newMessages.forEach((msg) => updatedIds.add(msg.id_message));
          return updatedIds;
        });
      } else {
        console.log('No new messages to update.');
      }
    }
  }, [messages, selectedContact, processedMessageIds]);

  useEffect(() => {
    console.log('Updated presence:', presence);
  }, [presence]);

  return (
    <div className="chat-container">
      <Slidebar contacts={contacts} onSelectContact={handleSelectContact} presence={presence} />
      <div className="chat-content">
        <div className="chat-header">
          <h2>{selectedContact ? selectedContact.split('@')[0] : 'Select a Contact'}'s Chat</h2>
          <button onClick={openModal} className="lego-button2">Show All Users</button>
          <button onClick={handleLogout} className="lego-button">Logout</button>
        </div>
        <div className="chat-messages">
          {(selectedContact && messageHistories[selectedContact] || []).map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender === user ? 'sent' : 'received'}`}>
              <span className="chat-sender">{msg.sender ? msg.sender.split('@')[0] : 'Unknown'}</span>: {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-inputs">
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
