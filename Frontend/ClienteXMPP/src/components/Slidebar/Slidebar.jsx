import React from 'react';
import './Slidebar.css';
import Header from '@components/Header';

const defaultProfileImage = './usuario.png';

const Slidebar = ({ contacts, onSelectContact }) => {
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
    </div>
  );
};

export default Slidebar;
