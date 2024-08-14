// src/services/xmppService.js

const WS_URL = 'ws://localhost:8000'; // URL de tu servidor FastAPI WebSocket

let loginSocket;

export const connectXmpp = (username, password, setMessages, setContacts, setUsersList) => {
    return new Promise((resolve, reject) => {
        loginSocket = new WebSocket(`${WS_URL}/ws/${username}/${password}`);

        loginSocket.onopen = () => {
            console.log('WebSocket login connection opened');
        };

        loginSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
        
            if (message.status === 'error') {
                console.error('Login failed:', message.message);
                loginSocket.close(); // Cierra la conexión si el login falla
                resolve({ success: false, error: message.message });
            } else if (message.action === 'show_all_users' && Array.isArray(message.users)) {
                // Manejar la lista de todos los usuarios
                console.log('All users list received:', message.users);
                setUsersList(message.users);
            } else if (message.status === 'success' && message.users && message.action === "contacts") {
                // Manejar la lista de contactos
                console.log('Contacts list received:', message.users);
                setContacts(message.users);
            } else if (message.action === "add_contact") {
                // Manejar la respuesta de agregar contacto
                if (message.status === 'success') {
                    console.log(`Contact ${message.message} added successfully.`);
                    // Aquí podrías actualizar la lista de contactos o notificar al usuario
                } else {
                    console.error('Failed to add contact:', message.message);
                }
            } else if (Array.isArray(message.root) && message.root.length > 0) {
                // Manejar mensajes entrantes
                message.root.forEach((rootItem) => {
                    if (Array.isArray(rootItem.message)) {
                        rootItem.message.forEach((msg) => {
                            if (msg.body && Array.isArray(msg.body) && msg.body.length > 0) {
                                const newMessage = {
                                    sender: msg['@from'],
                                    text: msg.body[0]
                                };
                                setMessages((messages) => [...messages, newMessage]);
                            }
                        });
                    }
                });
            } else if (message.message && message.from) {
                const newMessage = {
                    sender: message.from,
                    text: message.message
                };
                setMessages((messages) => [...messages, newMessage]);
            } else {
                console.log('Message received:', message);
                console.warn('No valid messages received');
            }
            resolve({ success: true });
        };
        

        loginSocket.onclose = () => {
            console.log('WebSocket login connection closed');
        };

        loginSocket.onerror = (error) => {
            reject('WebSocket error: ' + error.message);
        };
    });
};

// Función para solicitar la lista de todos los usuarios
export const showAllUsers = () => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const request = { action: "show_all_users" };
        loginSocket.send(JSON.stringify(request));
    } else {
        console.error('WebSocket is not open. Unable to request user list.');
    }
};

export const addContact = (contact_username, custom_message = "") => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const request = {
            action: "add_contact",
            contact_username,
            custom_message
        };
        loginSocket.send(JSON.stringify(request));
    } else {
        console.error('WebSocket is not open. Unable to add contact.');
    }
};

export const sendMessage = (to, body) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { action: "send_message", to, body };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to send message.');
    }
};

export const registerUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const registerSocket = new WebSocket(`${WS_URL}/register`);

        registerSocket.onopen = () => {
            const registerMessage = { username, password };
            registerSocket.send(JSON.stringify(registerMessage));
        };

        registerSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.status === 'error') {
                reject(message.message);
            } else {
                resolve(message.message); // Resolviendo con el mensaje de éxito
                console.log('WebSocket registration connection opened');
            }
        };

        registerSocket.onclose = () => {
            console.log('WebSocket registration connection closed');
        };

        registerSocket.onerror = (error) => {
            reject('WebSocket error: ' + error.message);
        };
    });
};
