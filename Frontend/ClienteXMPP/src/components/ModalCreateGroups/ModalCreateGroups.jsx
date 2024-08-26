import React, { useState } from 'react';
import './ModalCreateGroups.css';

// Componente para el modal de creación de grupos
const ModalCreateGroup = ({ isOpen, onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState(''); // Estado para el nombre del grupo
  const [groupDescription, setGroupDescription] = useState(''); // Estado para la descripción del grupo

  // Función para manejar la creación de un grupo
  const handleCreateGroup = () => {
    onCreateGroup(groupName, groupDescription);
    setGroupName('');
    setGroupDescription('');
    onClose();
  };

  // Renderizar el modal si está abierto
  if (!isOpen) return null;
  return (
    <div className="create-group-modal-overlay">
      <div className="create-group-modal-content">
        <h2>Create New Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="create-group-input"
        />
        <input
          type="text"
          placeholder="Group Description"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          className="create-group-input"
        />
        <button onClick={handleCreateGroup} className="create-group-button">Create</button>
        <button onClick={onClose} className="create-group-button">Cancel</button>
      </div>
    </div>
  );
};

export default ModalCreateGroup;
