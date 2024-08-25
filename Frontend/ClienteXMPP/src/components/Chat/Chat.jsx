import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { sendMessage, sendFile, joinGroup } from '@services/xmppService'; 
import Slidebar from '@components/Slidebar';
import Modal from '@components/Modal';
import ModalGroups from '@components/ModalGroups';
import ModalCreateGroups from '@components/ModalCreateGroups';
import { showAllUsers, discoverGroups, createGroup } from '../../services/xmppService';
import { deleteAcount } from '../../services/xmppService';

const Chat = ({ user, messages, contacts, usersList, presence, messageHistories, setMessageHistories, groupsList }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGroupsOpen, setModalGroupsOpen] = useState(false);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set()); 
  const [unreadMessages, setUnreadMessages] = useState({});
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [hasFetchedGroups, setHasFetchedGroups] = useState(false);
  const [file, setFile] = useState(null); 
  const [modalCreateGroupOpen, setModalCreateGroupOpen] = useState(false);

  const openModalCreateGroup = () => {
    setModalCreateGroupOpen(true);
  };
  
  const closeModalCreateGroup = () => {
    setModalCreateGroupOpen(false);
  };

  const handleCreateGroup = (groupName, groupDescription) => {
    // Aquí llamas a la función que creará el grupo en tu servicio XMPP.
    // Puedes crear una función `createGroup` en tu `xmppService`.
    createGroup(groupName, groupDescription)
      .then(() => {
        // Actualizar la lista de grupos o realizar otras acciones necesarias
        discoverGroups(); // para actualizar la lista de grupos después de crear uno nuevo
      })
      .catch((error) => {
        console.error('Failed to create group:', error);
      });
  };
  

  
  const formatFileName = (fileName) => {
    if (fileName.length > 19) {
      return `${fileName.slice(0, 16)}...`;
    }
    return fileName;
  };

  const handleSend = () => {
    if (message.trim() && recipient.trim()) {
      const newMessage = {
        sender: user,
        text: message,
        timestamp: new Date().toISOString(),
      };

      setMessageHistories((prevHistories) => {
        const updatedHistories = {
          ...prevHistories,
          [recipient]: [...(prevHistories[recipient] || []), newMessage],
        };
        return updatedHistories;
      });
      console.log('Sending message 🚨:', message);
      console.log('recipient:', recipient);
      sendMessage(recipient, message);
      setMessage('');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileSend = () => {
    if (file && recipient.trim()) {
      sendFile(recipient, file).then(() => {
        console.log('File sent successfully');
        setFile(null); // Limpiar el archivo después de enviarlo
      }).catch((error) => {
        console.error('Failed to send file:', error);
      });
    } else {
      console.log('No file selected or recipient is empty.');
    }
  };

  const deleteAccount = async () => {
    try {
      await deleteAcount();
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const openModal = () => {
    if (!hasFetchedUsers) {
      showAllUsers();
      setHasFetchedUsers(true);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const openModalGroups = () => {
    discoverGroups();
    setModalGroupsOpen(true);
  };

  const closeModalGroups = () => {
    setModalGroupsOpen(false);
  };

  const handleJoinGroup = (group) => {
    joinGroup(group);
    setModalGroupsOpen(false);
  };


  const handleLogout = () => {
    window.location.reload();
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setRecipient(contact);
    setUnreadMessages((prevUnreadMessages) => ({
      ...prevUnreadMessages,
      [contact]: 0,
    }));
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = messages.filter((msg) => {
        const receiver = msg.receiver || user;
        const senderMatches = msg.sender.split('/')[0] === (selectedContact.split('/')[0] || '');
        const receiverMatches = receiver.split('/')[0] === (receiver.split('/')[0] || '');
        const isDuplicate = processedMessageIds.has(msg.id_message);
        
        return (senderMatches || receiverMatches) && !isDuplicate;
      });

      if (newMessages.length > 0) {
        setMessageHistories((prevHistories) => {
          const updatedHistories = { ...prevHistories };
          newMessages.forEach((msg) => {
            if (msg.isGroup) {
              updatedHistories[msg.groupFullName] = [
                ...(updatedHistories[msg.groupFullName] || []),
                {
                  ...msg,
                  receivedAt: new Date().toISOString(),
                },
              ];
            } else {
              const sender = msg.sender.split('/')[0];
              updatedHistories[sender] = [
                ...(updatedHistories[sender] || []),
                {
                  ...msg,
                  receivedAt: new Date().toISOString(),
                },
              ];
          }
        });
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
            if (msg.isGroup) {
              const contact = msg.groupFullName
              if (selectedContact !== contact) {
                updatedUnreadMessages[contact] = (updatedUnreadMessages[contact] || 0) + 1;
              }
            } else {
              const contact = msg.sender.split("/")[0];
              if (selectedContact !== contact) {
                updatedUnreadMessages[contact] = (updatedUnreadMessages[contact] || 0) + 1;
              }
          }});
          return updatedUnreadMessages;
        });
      }
    }
    console.log('Updated message histories:', messageHistories);
    console.log('Updated messages:', messages);
  }, [messages, selectedContact, processedMessageIds]);

  useEffect(() => {
    console.log('Updated presence:', presence);
  }, [presence]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
      setMessage('');
    }
  };

  const renderMessageContent = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    const pdfExtension = /\.pdf$/i;
    const pdfImage = './pdf.png';

    if (urlPattern.test(text)) {
      return text.split(urlPattern).map((part, index) => {
        if (urlPattern.test(part)) {
          const isImage = imageExtensions.test(part);
          const isPdf = pdfExtension.test(part);
          return isImage ? (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              <img src={part} alt={`Image ${index}`} style={{ maxWidth: '50%', maxHeight: '100px', margin: '10px 0', cursor: 'pointer', borderRadius: '10px' }} />
            </a>
          ) : isPdf ? (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              <img src={pdfImage} alt="PDF" style={{ maxWidth: '40px', cursor: 'pointer' }} />
            </a>
          ) : (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        } else {
          if (part === 'https') {
            return null
          }
          return part;
        }
      });
    }
    return text;
  };

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [selectedContact, messageHistories]);
  

  return (
    <div className="chat-container">
      <Slidebar contacts={contacts} onSelectContact={handleSelectContact} presence={presence} unreadMessages={unreadMessages}/>
      <div className="chat-content">
        <div className="chat-header">
          <h2>{selectedContact ? selectedContact.split('@')[0] : 'Select a Contact'}'s Chat</h2>
          <button onClick={openModalGroups} className="lego-button">Show All Groups</button>
          <button onClick={openModal} className="lego-button">Show All Users</button>
          <button onClick={openModalCreateGroup} className="lego-button">Create Group</button>
          <button onClick={handleLogout} className="lego-button">Logout</button>
          <button onClick={deleteAccount} className="lego-button">Delete Account</button>
        </div>
        <div className="chat-messages">
          {console.log('Selected contact 👁️:', selectedContact)}
          {console.log('Message histories 👁️:', messageHistories)}
          {(selectedContact && messageHistories[selectedContact] || []).map((msg, index) => (
            <>
            { msg.isGroup ? (
              <div key={index} className={`chat-message ${msg.sender === user ? 'sent' : 'received'}`}>
                <span className="chat-sender">{msg.sender ? msg.sender.split('@')[0] : 'Unknown'}</span>: 
                <span className="chat-text">
                  {renderMessageContent(msg.text)}
                </span>
              </div>
            ) : 
            (
              <div key={index} className={`chat-message ${msg.sender === user ? 'sent' : 'received'}`}>
                <span className="chat-sender">{msg.sender ? msg.sender.split('@')[0] : 'Unknown'}</span>: 
                <span className="chat-text">
                  {renderMessageContent(msg.text)}
                </span>
              </div>
            ) }

            </>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-inputs">
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="lego-input"
            onKeyDown={handleKeyDown}
          />
          <div className="legoFile">
            <label htmlFor="file-upload" className="custom-file-button">
              {file ? formatFileName(file.name) : 'Seleccionar archivo'}
            </label>
            <input id="file-upload" type="file" onChange={handleFileChange} />
          </div>
          <button onClick={handleFileSend} className="lego-button" style={{marginRight: '10px'}}>file</button>
          <button onClick={handleSend} className="lego-button">Send</button>
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={closeModal} users={usersList} />
      {
        modalGroupsOpen && groupsList.length > 0 && <ModalGroups isOpen={modalGroupsOpen} onClose={closeModalGroups} users={groupsList} handleJoinGroup={handleJoinGroup} />

      }
      <ModalCreateGroups 
        isOpen={modalCreateGroupOpen} 
        onClose={closeModalCreateGroup} 
        onCreateGroup={handleCreateGroup} 
      />
    </div>
  );
};

export default Chat;
