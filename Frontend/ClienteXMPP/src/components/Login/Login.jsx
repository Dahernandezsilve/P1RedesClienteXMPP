import React, { useState } from 'react';
import { connectXmpp, registerUser } from '@services/xmppService';
import Loader from '@components/Loader';
import './Login.css';

// Componente para el inicio de sesión y registro de usuarios
const Login = ({ setUser, setMessages, setContacts, setUsersList, setPresence, setMessageHistories, setGroupsList }) => {
  const [username, setUsername] = useState(''); // Estado para el nombre de usuario
  const [password, setPassword] = useState(''); // Estado para la contraseña
  const [confirmPassword, setConfirmPassword] = useState(''); // Estado para confirmar la contraseña
  const [name, setName] = useState(''); // Estado para el nombre del usuario
  const [email, setEmail] = useState(''); // Estado para el correo electrónico
  const [error, setError] = useState(''); // Estado para mostrar mensajes de error
  const [isSignUp, setIsSignUp] = useState(false); // Estado para alternar entre inicio de sesión y registro
  const [isLoading, setIsLoading] = useState(false); // Estado para mostrar el indicador de carga

  // Función para manejar el inicio de sesión
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await connectXmpp(username, password, setMessages, setContacts, setUsersList, setPresence, setMessageHistories, setGroupsList);
      console.log('Login response:', response);
      if (response.success) {
        setUser(username);
        setError('');
      } else {
        setError(response.error || 'Login failed.');
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el registro de usuarios
  const handleSignUp = async () => {
    if (!username || !password || !confirmPassword || !name || !email) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(username, password, name, email); 
      await handleLogin();
    } catch (err) {
      setError('Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='background-container'>
      <div className="login-container">
        <div className="login-box">
          <h2>{isSignUp ? '- Sign Up -' : '- Log In -'}</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            disabled={isLoading}
          />
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
                disabled={isLoading}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                disabled={isLoading}
              />
            </>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            disabled={isLoading}
          />
          {isSignUp && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
              disabled={isLoading}
            />
          )}
          {error && <p className="login-error">{error}</p>}
          <button onClick={isSignUp ? handleSignUp : handleLogin} className="login-button" disabled={isLoading}>
            {isLoading ? <Loader /> : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
          <p className="toggle-signup">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-button" disabled={isLoading}>
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
