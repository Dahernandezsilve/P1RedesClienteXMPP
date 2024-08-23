// src/services/xmppService.js

const WS_URL = 'ws://localhost:8000'; // URL de tu servidor FastAPI WebSocket

let loginSocket;

const processedMessageIds = new Set();

export const connectXmpp = (username, password, setMessages, setContacts, setUsersList, setPresence, setMessageHistories) => {
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
            }
            else if (message.action === "fileUrl") {
                console.log('File URL received:', message.url);
                if (!processedMessageIds.has(message.id_message)) {
                    setMessageHistories((prevHistories) => {
                        const updatedHistories = {
                            ...prevHistories,
                            [message.to]: [
                                ...(prevHistories[message.to] || []),
                                { sender: username, text: message.url }
                            ],
                        };
                        return updatedHistories;
                    });
                    processedMessageIds.add(message.id_message);
                } else {
                    console.log(`Message with ID ${message.id_message} already processed.`);
                }
            } else if (message.action === "presence_update") {
                console.log('Presence update received:', message.presence);
                setPresence(prevPresence => ({
                    ...prevPresence,
                    [message.presence.from.split('/')[0]]: message.presence
                }));
            } else if (Array.isArray(message.root) && message.root.length > 0) {
                // Manejar mensajes entrantes
                message.root.forEach((rootItem) => {
                    if (Array.isArray(rootItem.message)) {
                        rootItem.message.forEach((msg) => {
                            if (msg.body && Array.isArray(msg.body) && msg.body.length > 0) {
                                const newMessage = {
                                    sender: msg['@from'],
                                    text: msg.body[0],
                                };
                                setMessages((messages) => [...messages, newMessage]);
                            }
                        });
                    }
                });
            } else if (message.message && message.from) {
                const newMessage = {
                    sender: message.from,
                    text: message.message,
                    id_message: message.id_message
                };
                console.log('Message received:', message);
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

export const deleteAcount = () => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const request = {
            action: "delete_account",
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

export const sendFile = async (to, file) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        try {
            // Convertir el archivo a Base64
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                const base64Data = fileReader.result.split(',')[1]; // Extraer solo los datos Base64
                const message = {
                    action: "send_file",
                    to,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileData: base64Data
                };
                loginSocket.send(JSON.stringify(message));
            };
            fileReader.readAsDataURL(file);
        } catch (error) {
            console.error('Error sending file:', error);
        }
    } else {
        console.error('WebSocket is not open. Unable to send file.');
    }
};


export const updatePresence = (presence, status) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { action: "set_presence", presence, status };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to set presence.');
    }
};

export const registerUser = (username, password, name, email ) => {
    return new Promise((resolve, reject) => {
        const registerSocket = new WebSocket(`${WS_URL}/register`);

        registerSocket.onopen = () => {
            const registerMessage = { username, password, name, email };
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
