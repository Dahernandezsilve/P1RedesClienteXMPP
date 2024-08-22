import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';
import Slidebar from '@components/Slidebar'; // Importa el componente Slidebar
import Modal from '@components/Modal'; // Importa el componente Modal
import { showAllUsers } from '../../services/xmppService';

const Chat = ({ user, messages, contacts, usersList, presence }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageHistories, setMessageHistories] = useState({});
  const [selectedContact, setSelectedContact] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      const newMessage = {
        sender: user,
        text: message,
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
        if (msg.sender && msg.receiver && selectedContact) {
          const senderMatches = msg.sender.split('@')[0] === selectedContact.split('@')[0];
          const receiverMatches = msg.receiver.split('@')[0] === selectedContact.split('@')[0];
          const result = senderMatches || receiverMatches;

          console.log(`Filtering message: sender=${msg.sender}, receiver=${msg.receiver}, result=${result}`);
          return result;
        }
        return false;
      });

      if (newMessages.length > 0) {
        console.log('Filtered new messages:', newMessages);

        setMessageHistories((prevHistories) => {
          const updatedHistories = {
            ...prevHistories,
            [selectedContact.split('@')[0]]: [...(prevHistories[selectedContact.split('@')[0]] || []), ...newMessages],
          };

          console.log('Updated message histories with new messages:', updatedHistories);
          return updatedHistories;
        });
      } else {
        console.log('No new messages to update.');
      }
    }
  }, [messages, selectedContact]);

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
