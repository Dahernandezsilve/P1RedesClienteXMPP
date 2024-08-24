import React, { useState } from 'react';
import './ModalGroups.css'; // Asegúrate de tener este archivo para el estilo

const ModalGroups = ({ isOpen, onClose, users }) => {
  if (!isOpen) return null;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // Estado para la barra de búsqueda
  const usersPerPage = 10; // Número de usuarios por página

  // Filtrar y ordenar los usuarios según la búsqueda y el nombre de usuario
  const filteredUsers = users.filter(user => 
      user.jid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Calcular el índice del primer y último usuario de la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Calcular el número total de páginas
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Función para cambiar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generar números de página para mostrar en la paginación
  const getPaginationNumbers = () => {
    const pages = [];
    const delta = 2; // Rango de páginas alrededor de la página actual

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Primera página
        i === totalPages || // Última página
        (i >= currentPage - delta && i <= currentPage + delta) // Páginas alrededor de la página actual
      ) {
        pages.push(i);
      } else if (
        i === currentPage - delta - 1 || // Elipsis después de la primera página
        i === currentPage + delta + 1 // Elipsis antes de la última página
      ) {
        pages.push('...');
      }
    }

    return Array.from(new Set(pages)); // Eliminar duplicados de las elipsis
  };

  // Función para manejar el clic en una fila
  const handleRowClick = (user) => {
    // Aquí puedes definir la lógica que deseas ejecutar cuando una fila sea clickeada
    console.log('Clicked user:', user);
    // Por ejemplo, podrías abrir un modal con detalles del usuario o navegar a una página diferente
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-button">x</button>
        <h2>All groups👾</h2>

        <input
          type="text"
          placeholder="Search..."
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Resetear a la primera página al buscar
          }}
        />

        <table className="user-table">
          <thead>
            <tr>
              <th>JID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={index} onClick={() => handleRowClick(user)} style={{ cursor: 'pointer' }}>
                <td>{user.jid}</td>
                <td>{user.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="pagination">
          {getPaginationNumbers().map((number, index) => (
            <button
              key={index}
              className={`page-button ${number === currentPage ? 'active' : ''}`}
              onClick={() => number !== '...' && handlePageChange(number)}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModalGroups;
