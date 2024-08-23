import React, { useState, useEffect } from 'react';
import './Chat.css';
import { sendMessage } from '@services/xmppService';
import Slidebar from '@components/Slidebar';
import Modal from '@components/Modal';
import { showAllUsers } from '../../services/xmppService';
import { deleteAcount } from '../../services/xmppService';	

const Chat = ({ user, messages, contacts, usersList, presence }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [messageHistories, setMessageHistories] = useState({});
  const [selectedContact, setSelectedContact] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false); // Estado para controlar la ejecución de showAllUsers

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

  const deleteAccount = async () => {
    try {
      console.log('Deleting account...');
      await deleteAcount(); // Llama a la función del servicio para eliminar la cuenta
      console.log('Account deleted successfully.');
      window.location.reload(); // Recargar la página después de eliminar la cuenta
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const openModal = () => {
    console.log('Opening modal to show all users.');
    
    if (!hasFetchedUsers) {
      showAllUsers(); // Ejecutar solo una vez
      setHasFetchedUsers(true);
    }

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
    setUnreadMessages((prevUnreadMessages) => ({
      ...prevUnreadMessages,
      [contact]: 0,
    }));
  };

  useEffect(() => {
    if (messages.length > 0) {
      console.log('New messages received:', messages);

      const newMessages = messages.filter((msg) => {
        const receiver = msg.receiver || user;
        const senderMatches = msg.sender.split('/')[0] === (selectedContact.split('/')[0] || '');
        const receiverMatches = receiver.split('/')[0] === (receiver.split('/')[0] || '');
        const isDuplicate = processedMessageIds.has(msg.id_message);
        
        return (senderMatches || receiverMatches) && !isDuplicate;
      });

      console.log('New messages:', newMessages);
      if (newMessages.length > 0) {
        console.log('Filtered new messages:', newMessages);

        setMessageHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };

          newMessages.forEach((msg) => {
            const sender = msg.sender.split('/')[0];
            updatedHistories[sender] = [
              ...(updatedHistories[sender] || []),
              {
                ...msg,
                receivedAt: new Date().toISOString(),
              },
            ];
          });

          console.log('Updated message histories with new messages:', updatedHistories);
          return updatedHistories;
        });

        setProcessedMessageIds((prevIds) => {
          const updatedIds = new Set(prevIds);
          newMessages.forEach((msg) => updatedIds.add(msg.id_message));
          return updatedIds;
        });

        setUnreadMessages((prevUnreadMessages) => {
          const updatedUnreadMessages = { ...prevUnreadMessages };
          newMessages.forEach((msg) => {
            const contact = msg.sender.split("/")[0];
            console.log('Updating unread messages for:', contact);
            console.log('Selected contact on unread:', selectedContact);
            if (selectedContact !== contact) {
              updatedUnreadMessages[contact] = (updatedUnreadMessages[contact] || 0) + 1;
            }
          });
          return updatedUnreadMessages;
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
      <Slidebar contacts={contacts} onSelectContact={handleSelectContact} presence={presence} unreadMessages={unreadMessages}/>
      <div className="chat-content">
        <div className="chat-header">
          <h2>{selectedContact ? selectedContact.split('@')[0] : 'Select a Contact'}'s Chat</h2>
          <button onClick={openModal} className="lego-button">Show All Users</button>
          <button onClick={handleLogout} className="lego-button">Logout</button>
          <button onClick={deleteAccount} className="lego-button">Delete Account</button>
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
