// src/services/xmppService.js
const WS_URL = 'ws://localhost:8000'; // URL del servidor WebSocket
let loginSocket; // Variable para almacenar la conexión WebSocket
const processedMessageIds = new Set(); // Conjunto para almacenar los ID de mensajes procesados

// Función para conectar al servidor XMPP
export const connectXmpp = (username, password, setMessages, setContacts, setUsersList, setPresence, setMessageHistories, setGroupsList, setRequests) => {
    return new Promise((resolve, reject) => {
        loginSocket = new WebSocket(`${WS_URL}/ws/${username}/${password}`);

        loginSocket.onopen = () => {
            console.log('WebSocket login connection opened');
        };

        loginSocket.onmessage = (event) => { // Manejar los mensajes recibidos
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
        
            if (message.status === 'error') { // Manejar errores
                console.error('Login failed:', message.message);
                loginSocket.close(); 
                resolve({ success: false, error: message.message });
            } else if (message.action === 'show_all_users' && Array.isArray(message.users)) { // Manejar la lista de todos los usuarios
                console.log('All users list received:', message.users);
                setUsersList(message.users);                
            } else if (message.action === 'show_all_groups' && Array.isArray(message.groups)) { // Manejar la lista de todos los grupos
                console.log('All groups list received:', message);
                console.log('All groups list received:', message.groups);
                setGroupsList(message.groups);
            } else if (message.status === 'success' && message.users && message.action === "contacts") { // Manejar la lista de contactos
                console.log('Contacts list received:', message);
                console.log('Contacts list received:', message.users);
                setContacts(message.users);
            } else if (message.action === "add_contact") { // Manejar la adición de un contacto
                if (message.status === 'success') {
                    console.log(`Contact ${message.message} added successfully.`); // Mensaje de éxito
                } else {
                    console.error('Failed to add contact:', message.message);
                }
            } else if (message.action === "fileUrl") { // Manejar la URL del archivo recibido
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
            } else if (message.action === "presence_update") { // Manejar la actualización de presencia
                console.log('Presence update received:', message.presence);
                if (message.presence.type === 'subscribe') {   // Almacena la solicitud de suscripción en `requests`                  
                    setRequests(prevRequests => ({
                        ...prevRequests,
                        [message.presence.from.split('/')[0]]: message.presence
                    }));
                } else { // Actualiza la presencia en el estado `presence`
                    setPresence(prevPresence => ({
                        ...prevPresence,
                        [message.presence.from.split('/')[0]]: message.presence
                    }));
                }
            } else if (Array.isArray(message.root) && message.root.length > 0) {
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
            } else if (message.action === "bookmarks") { // Manejar los marcadores recibidos
                console.log('Bookmarks received:', message.message);
                message.message.map(bookmark => {
                    setContacts((prevContacts) => {
                        const newContacts = [...prevContacts];
                        const groupExists = newContacts.some(contact => contact.jid === bookmark.jid);
                        const groupName = bookmark.jid.split('@')[0];
                        const isGroup = bookmark.jid.includes('@conference');
                        if (!groupExists) {
                            newContacts.push({
                                isGroup: isGroup,
                                name: groupName,
                                jid: bookmark.jid,
                            });
                        }
        
                        return newContacts;
                    });
                });

            } else if (message.message && message.from) { // Manejar los mensajes de chat
                const isGroup = message.from.includes('@conference');

                const [groupFullName, senderName] = message.from.split('/');
                const groupName = isGroup ? groupFullName.split('@')[0] : null;
                const newMessage = {
                    sender: isGroup ? `${senderName}` : message.from,
                    text: message.message,
                    id_message: message.id_message,
                    isGroup: isGroup,
                    groupName: groupName,
                    senderName: senderName,
                    groupFullName: groupFullName,
                };
                console.log('Message received:', message);

                console.log('New group:', groupName);
                if (!processedMessageIds.has(newMessage.id_message)) {
                    processedMessageIds.add(newMessage.id_message);
                    setMessages((messages) => [...messages, newMessage]);
                } else {
                    console.log('Message already processed, skipping:', newMessage.id_message);
                }
            } else {
                console.log('Message received:', message);
                console.warn('No valid messages received');
            }
            resolve({ success: true });
        };
        

        loginSocket.onclose = () => { // Manejar el cierre de la conexión
            console.log('WebSocket login connection closed');
        };

        loginSocket.onerror = (error) => { // Manejar errores de WebSocket
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

// Función para solicitar la lista de todos los grupos
export const createGroup = (groupName, groupDescription) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const request = { action: "create_group", groupName, groupDescription };
        loginSocket.send(JSON.stringify(request));
    } else {
        console.error('WebSocket is not open. Unable to create group.');
    }
};

// Función para solicitar la lista de todos los grupos
export const discoverGroups = () => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const request = { action: "show_all_groups" };
        loginSocket.send(JSON.stringify(request));
    } else {
        console.error('WebSocket is not open. Unable to discover groups.');
    }
}

// Función para unirse a un grupo
export const joinGroup = (group_jid) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        console.log('Joining group:', group_jid);
        const request = { action: "join_group", group_jid };
        loginSocket.send(JSON.stringify(request));
    } else {
        console.error('WebSocket is not open. Unable to join group.');
    }
};

// Función para enviar un mensaje
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

// Funcion para eliminar una cuenta
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

// Función para enviar un mensaje
export const sendMessage = (to, body) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { action: "send_message", to, body };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to send message.');
    }
};


// Función para enviar un archivo
export const sendFile = async (to, file) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        try {
            // Convertir el archivo a Base64
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                const base64Data = fileReader.result.split(',')[1]; 
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

// Función para aceptar una solicitud de suscripción
export const acceptSubscription = (from) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { action: "accept_subscription", from };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to accept subscription.');
    }
}


// Función para actualizar la presencia
export const updatePresence = (presence, status) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { action: "set_presence", presence, status };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to set presence.');
    }
};

// Función para registrar un usuario
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
                resolve(message.message); 
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
