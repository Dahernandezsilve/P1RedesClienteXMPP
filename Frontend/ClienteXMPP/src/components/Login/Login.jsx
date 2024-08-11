import React, { useState } from 'react';
import { connectXmpp, registerUser } from '@services/xmppService';
import Loader from '@components/Loader';
import './Login.css';

const Login = ({ setUser, setMessages, setContacts }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await connectXmpp(username, password, setMessages, setContacts);
      console.log('Login response:', response);
      if (response.success) {
        setUser(username);
        setError('');
      } else {
        setError(response.error || 'Login failed.'); // Muestra el error si el login falla
      }
    } catch (err) {
      setError('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await registerUser(username, password);
      setUser(username);
      setError('');
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
