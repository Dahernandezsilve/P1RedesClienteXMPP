import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { sendMessage, sendFile, joinGroup } from '@services/xmppService'; 
import Slidebar from '@components/Slidebar';
import Modal from '@components/Modal';
import ModalGroups from '@components/ModalGroups';
import ModalCreateGroups from '@components/ModalCreateGroups';
import { showAllUsers, discoverGroups, createGroup } from '../../services/xmppService';
import { deleteAcount } from '../../services/xmppService';

// Componente Chat que muestra la interfaz de chat
const Chat = ({ user, messages, contacts, usersList, presence, messageHistories, setMessageHistories, groupsList }) => {
  const [message, setMessage] = useState(''); // Estado para el mensaje actual
  const [recipient, setRecipient] = useState(''); // Estado para el destinatario del mensaje
  const [selectedContact, setSelectedContact] = useState(''); // Estado para el contacto seleccionado
  const [modalOpen, setModalOpen] = useState(false); // Estado para mostrar/ocultar el modal
  const [modalGroupsOpen, setModalGroupsOpen] = useState(false); // Estado para mostrar/ocultar el modal de grupos
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());  // Estado para almacenar los IDs de los mensajes procesados
  const [unreadMessages, setUnreadMessages] = useState({});   // Estado para almacenar los mensajes no leídos
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false); // Estado para saber si se han obtenido los usuarios
  const [hasFetchedGroups, setHasFetchedGroups] = useState(false);  // Estado para saber si se han obtenido los grupos
  const [file, setFile] = useState(null);  // Estado para almacenar el archivo seleccionado
  const [modalCreateGroupOpen, setModalCreateGroupOpen] = useState(false); // Estado para mostrar/ocultar el modal de creación de grupo


  // Función para abrir el modal de creación de grupo
  const openModalCreateGroup = () => {
    setModalCreateGroupOpen(true);
  };
  

  // Función para cerrar el modal de creación de grupo
  const closeModalCreateGroup = () => {
    setModalCreateGroupOpen(false);
  };


  // Función para crear un grupo
  const handleCreateGroup = (groupName, groupDescription) => {
    createGroup(groupName, groupDescription)
      .then(() => {
        discoverGroups(); 
      })
      .catch((error) => {
        console.error('Failed to create group:', error);
      });
  };
  

  // Función para dar formato al nombre del archivo
  const formatFileName = (fileName) => {
    if (fileName.length > 19) {
      return `${fileName.slice(0, 16)}...`;
    }
    return fileName;
  };


  // Función para enviar un mensaje
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


  // Función para manejar el cambio de archivo
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };


  // Función para enviar un archivo
  const handleFileSend = () => {
    if (file && recipient.trim()) {
        console.log("print recipient:", recipient);
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

  // Función para eliminar la cuenta
  const deleteAccount = async () => {
    try {
      await deleteAcount();
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  // Función para abrir el modal de usuarios
  const openModal = () => {
    if (!hasFetchedUsers) {
      showAllUsers();
      setHasFetchedUsers(true);
    }
    setModalOpen(true);
  };

  // Función para cerrar el modal de usuarios
  const closeModal = () => {
    setModalOpen(false);
  };

  // Función para abrir el modal de grupos
  const openModalGroups = () => {
    discoverGroups();
    setModalGroupsOpen(true);
  };

  // Función para cerrar el modal de grupos
  const closeModalGroups = () => {
    setModalGroupsOpen(false);
  };

  // Función para unirse a un grupo
  const handleJoinGroup = (group) => {
    joinGroup(group);
    setModalGroupsOpen(false);
  };

  // Función para actualizar la presencia
  const handleLogout = () => {
    window.location.reload();
  };

  // Función para seleccionar un contacto
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setRecipient(contact);
    setUnreadMessages((prevUnreadMessages) => ({
      ...prevUnreadMessages,
      [contact]: 0,
    }));
  };

  // Función para procesar los mensajes
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
        // Actualizar el historial de mensajes
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

        // Actualizar los IDs de los mensajes procesados
        setProcessedMessageIds((prevIds) => {
          const updatedIds = new Set(prevIds);
          newMessages.forEach((msg) => updatedIds.add(msg.id_message));
          return updatedIds;
        });

        // Actualizar los mensajes no leídos
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

  // Función para actualizar la presencia
  useEffect(() => {
    console.log('Updated presence:', presence);
  }, [presence]);

  // Función para manejar el evento de tecla presionada
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
      setMessage('');
    }
  };

  // Función para renderizar el contenido del mensaje
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
          return isImage ? ( // Si es una imagen, mostrarla
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              <img src={part} alt={`Image ${index}`} style={{ maxWidth: '50%', maxHeight: '100px', margin: '10px 0', cursor: 'pointer', borderRadius: '10px' }} />
            </a>
          ) : isPdf ? ( // Si es un PDF, mostrar la imagen del PDF
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              <img src={pdfImage} alt="PDF" style={{ maxWidth: '40px', cursor: 'pointer' }} />
            </a>
          ) : ( // Si es un enlace, mostrarlo
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

  // Referencia para el scroll al final de la lista de mensajes  
  const messagesEndRef = useRef(null);

  // Función para hacer scroll al final de la lista de mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Efecto para hacer scroll al final de la lista de mensajes
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
