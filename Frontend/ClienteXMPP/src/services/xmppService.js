// src/services/xmppService.js

const WS_URL = 'ws://localhost:8000'; // URL de tu servidor FastAPI WebSocket

let loginSocket;

export const connectXmpp = (username, password, setMessages) => {
    return new Promise((resolve, reject) => {
        loginSocket = new WebSocket(`${WS_URL}/ws/${username}/${password}`);

        loginSocket.onopen = () => {
            console.log('WebSocket login connection opened');
            resolve('WebSocket connection established');
        };

        loginSocket.onmessage = (event) => {
            console.log('WebSocket message received:', event);
            const message = JSON.parse(event.data);
            console.log('Message:', message);

            if (message.status === 'failure') {
                console.error('Login failed:', message.reason);
                loginSocket.close(); // Cierra la conexión si el login falla
                reject('Login failed: ' + message.reason);
            } else if (Array.isArray(message.root) && message.root.length > 0) {
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
            } else {
                console.warn('No valid messages received');
            }
        };

        loginSocket.onclose = () => {
            console.log('WebSocket login connection closed');
        };

        loginSocket.onerror = (error) => {
            reject('WebSocket error: ' + error.message);
        };
    });
};


export const sendMessage = (to, body) => {
    if (loginSocket && loginSocket.readyState === WebSocket.OPEN) {
        const message = { to, body };
        loginSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open. Unable to send message.');
    }
};

const WS_URL2 = 'ws://localhost:8000'; // URL de tu servidor FastAPI WebSocket

export const registerUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const registerSocket = new WebSocket(`${WS_URL2}/register`);

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
