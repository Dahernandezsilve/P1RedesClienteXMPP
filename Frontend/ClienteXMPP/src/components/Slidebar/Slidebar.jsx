import React, { useState } from 'react';
import './Slidebar.css';
import Header from '@components/Header';
import { addContact } from '@services/xmppService'; // Importa la función para añadir contacto

const defaultProfileImage = './usuario.png';

const Slidebar = ({ contacts, onSelectContact }) => {
  const [newContact, setNewContact] = useState(''); // Estado para el nuevo contacto
  const [customMessage, setCustomMessage] = useState(''); // Estado para el mensaje personalizado

  const handleAddContact = () => {
    if (newContact.trim()) {
      addContact(newContact, customMessage); // Llama a la función para añadir contacto
      setNewContact(''); // Limpia el input de nuevo contacto
      setCustomMessage(''); // Limpia el input de mensaje personalizado
    } else {
      console.error('Please enter a valid contact username');
    }
  };

  return (
    <div className="slidebar">
      <Header />
      <ul>
        {contacts.map((contact, index) => (
          <li key={index} onClick={() => onSelectContact(contact.jid)}>
            <img 
              src={contact.profileImage || defaultProfileImage} 
              alt={`${contact.jid} profile`} 
              className="profile-image" 
            />
            {contact.jid}
          </li>
        ))}
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
