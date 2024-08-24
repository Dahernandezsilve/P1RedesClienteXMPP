import React, { useState, useEffect } from 'react';
import './Slidebar.css';
import Header from '@components/Header';
import { addContact, updatePresence } from '@services/xmppService'; // Asegúrate de importar la función para actualizar presencia

const defaultProfileImage = './usuario.png';
const notificationSound = new Audio('./popSound.mp3'); // Ruta al archivo de sonido

const Slidebar = ({ contacts, onSelectContact, presence, unreadMessages }) => {
  const [newContact, setNewContact] = useState(''); // Estado para el nuevo contacto
  const [customMessage, setCustomMessage] = useState(''); // Estado para el mensaje personalizado
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false); // Estado para mostrar/ocultar menú de presencia
  const [presenceMessage, setPresenceMessage] = useState('unknown'); // Estado para el mensaje de presencia
  const [status, setStatus] = useState(''); // Estado para el estado de presencia

  const handleAddContact = () => {
    if (newContact.trim()) {
      addContact(newContact, customMessage); // Llama a la función para añadir contacto
      setNewContact(''); // Limpia el input de nuevo contacto
      setCustomMessage(''); // Limpia el input de mensaje personalizado
    } else {
      console.error('Please enter a valid contact username');
    }
  };

  const handleTogglePresenceMenu = () => {
    setIsPresenceMenuOpen(!isPresenceMenuOpen);
  };

  const handlePresenceChange = (message) => {
    setPresenceMessage(message);
    updatePresence(message, status); // Llama a la función para actualizar el mensaje de presencia en el servidor
    setIsPresenceMenuOpen(false); // Cierra el menú después de seleccionar un mensaje
  };

  // Efecto para reproducir el sonido cuando llegan nuevos mensajes
  useEffect(() => {
    const hasUnreadMessages = Object.values(unreadMessages).some(count => count > 0);

    if (hasUnreadMessages) {
      notificationSound.play().catch(error => console.error('Error playing sound:', error));
    }
  }, [unreadMessages]);

  return (
    <div className="slidebar">
      <div className="header-actions">
        <Header /> 
        <button onClick={handleTogglePresenceMenu} className="presence-button">
            <img src="./engranajes3.gif" alt="Settings" className="gear-icon" /> {/* Cambia la ruta según tu archivo de icono */}
        </button>
      </div>
      <div className="header-actions">
      
        {isPresenceMenuOpen && (
          <div className="presence-menu">
            <button onClick={() => handlePresenceChange('available')}>Available</button>
            <button onClick={() => handlePresenceChange('dnd')}>Busy</button>
            <button onClick={() => handlePresenceChange('away')}>Away</button>
            <button onClick={() => handlePresenceChange('xa')}>Not available</button>
            <button onClick={() => handlePresenceChange('chat')}>Chat</button>
            <input
              type="text"
              placeholder="Custom Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="custom-status-input"
            />
            <button  className='changeStatus' onClick={() => handlePresenceChange(presenceMessage)}>
              Change Status
            </button>
          </div>
        )}
      </div>
      <ul className="contacts-list">
        {contacts.map((contact, index) => {
          // Obtener el estado de presencia del contacto o establecer un valor predeterminado
          const contactPresence = presence[contact.jid] || { show: 'unavailable', status: 'No available' };
          const unreadCount = unreadMessages[contact.jid] || 0; 
          // Mostrar 'busy' en lugar de 'dnd', 'Not Available' en lugar de 'xa', y mostrar el show si es diferente de 'unavailable', de lo contrario, mostrar el tipo
          const presenceDisplay = contactPresence.show === 'dnd'
            ? 'busy'
            : contactPresence.show === 'xa'
            ? 'notavailable'
            : contactPresence.show !== 'unknown'
            ? contactPresence.show
            : contactPresence.type;

          return (
            <li key={index} onClick={() => onSelectContact(contact.jid)}>
              <img 
                src={contact.profileImage || defaultProfileImage} 
                alt={`${contact.jid} profile`} 
                className="profile-image" 
              />
              <div className="contact-info">
                {contact.isGroup ? <span className="contact-name">{contact.name}</span> : <span className="contact-name">{contact.jid}</span>}
                {contact.isGroup ? null:
                  (<div className="presence-container">
                    <span className={`presence-indicator ${presenceDisplay}`}>
                      {contactPresence.show === 'dnd' ? 'busy' : contactPresence.show === 'xa' ? 'Not Available' : contactPresence.show !== 'unknown' ? contactPresence.show : contactPresence.type}
                    </span>
                    <span className="presence-status">
                    Status: {contactPresence.status}
                    </span>
                    </div>)
                }
              </div>

              <div className={`notification-badge ${unreadCount > 0 ? 'has-notifications count' : ''}`} >
                {unreadCount >= 0 ? unreadCount : ''}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="add-contact-section">
        <input
          type="text"
          placeholder="New Contact"
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
          className="lego-inputS"
        />
        <input
          type="text"
          placeholder="Custom Message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="lego-inputS"
        />
        <button onClick={handleAddContact} className="lego-buttonS">
          Add Contact
        </button>
      </div>
    </div>
  );
};

export default Slidebar;
