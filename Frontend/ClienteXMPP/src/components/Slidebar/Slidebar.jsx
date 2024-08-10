import React from 'react';
import './Slidebar.css';
import Header from '@components/Header';

const defaultProfileImage = 'https://via.placeholder.com/150/CCCCCC/000000?Text=DefaultImage';

const Slidebar = ({ contacts, onSelectContact }) => {
  return (
    <div className="slidebar">
      <Header />
      <ul>
        {contacts.map((contact, index) => (
          <li key={index} onClick={() => onSelectContact(contact)}>
            <img 
              src={contact.profileImage || defaultProfileImage} 
              alt={`${contact.name} profile`} 
              className="profile-image" 
            />
            {contact.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Slidebar;
