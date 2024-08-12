import React, { useState } from 'react';
import './Modal.css'; // Asegúrate de tener este archivo para el estilo

const Modal = ({ isOpen, onClose, users }) => {
  if (!isOpen) return null;

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // Número de usuarios por página

  // Calcular el índice del primer y último usuario de la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  // Calcular el número total de páginas
  const totalPages = Math.ceil(users.length / usersPerPage);

  // Función para cambiar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-button">×</button>
        <h2>All Users (👉ﾟヮﾟ)👉</h2>
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={index}>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`page-button ${index + 1 === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Modal;
