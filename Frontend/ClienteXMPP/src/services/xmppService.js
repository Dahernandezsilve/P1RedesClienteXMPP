// src/services/xmppService.js

const WS_URL = 'ws://localhost:8000'; // URL de tu servidor FastAPI WebSocket


export const connectXmpp = (username, password) => {
    return new Promise((resolve, reject) => {
        const loginSocket = new WebSocket(`${WS_URL}/ws/${username}/${password}`);

        loginSocket.onopen = () => {
            console.log('WebSocket login connection opened');
        };

        loginSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.status === 'error') {
                reject(message.message);  // Rechazar con el mensaje de error específico
            } else {
                resolve(message.message); // Resolviendo con el mensaje de éxito
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