// src/services/xmppService.js

const WS_URL = 'ws://localhost:8000/ws'; // URL de tu servidor FastAPI WebSocket

let socket;

export const connectXmpp = (username, password) => {
    return new Promise((resolve, reject) => {
        // Crear una conexión WebSocket con el nombre de usuario y la contraseña
        socket = new WebSocket(`${WS_URL}/${username}/${password}`);

        // Manejar eventos WebSocket
        socket.onopen = () => {
            console.log('WebSocket connection opened');
            resolve();
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // Manejar el mensaje recibido aquí
            console.log('Message from server:', message);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        socket.onerror = (error) => {
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