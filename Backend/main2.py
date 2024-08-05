from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from client import XMPPClient
from accountManager import AccountManager
from utils import xml_to_json
import threading
import asyncio
import json

app = FastAPI()

# Almacena las conexiones WebSocket y los clientes XMPP
clients = {}

async def listen_for_messages(websocket: WebSocket, xmpp_client: XMPPClient):
    while True:
        message = xmpp_client.receive()
        if message:
            json_message = xml_to_json(message)
            print(f"Sending JSON: {json_message}") 
            await websocket.send_text(json_message)

async def send_messages(websocket: WebSocket):
    while True:
        data = await websocket.receive_text()
        # Aquí puedes agregar la lógica para enviar mensajes a través de XMPP
        await websocket.send_text(f"Message sent: {data}")

@app.websocket("/ws/{username}/{password}")
async def websocket_endpoint(websocket: WebSocket, username: str, password: str):
    await websocket.accept()
    
    xmpp_client = XMPPClient('alumchat.lol', 5222, username, password, 'test')
    xmpp_client.connect()
    
    clients[username] = xmpp_client

    # Crear hilos para escuchar y enviar mensajes
    listener_thread = threading.Thread(target=lambda: asyncio.run(listen_for_messages(websocket, xmpp_client)))
    listener_thread.start()

    try:
        await send_messages(websocket)
    except WebSocketDisconnect:
        pass
    finally:
        xmpp_client.disconnect()
        del clients[username]

@app.websocket("/register")
async def register_user(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        message = json.loads(data)  # Suponiendo que el mensaje se envía como JSON
        username = message["username"]
        password = message["password"]

        account_manager = AccountManager('alumchat.lol', 5222)

        # Registro de cuenta
        # new_username = 'her21270-test2'
        # new_password = '1234'
        account_manager.register_account(username, password)
        
        # Iniciar sesión con la nueva cuenta
        account_manager.login(username, password)
        
        # Aquí podrías agregar funcionalidades de comunicación si fuera necesario
        
        # Cerrar sesión
        account_manager.logout()

        response = {"status": "success", "message": f"User {username} registered successfully."}
        await websocket.send_text(json.dumps(response))
    except Exception as e:
        response = {"status": "error", "message": str(e)}
        await websocket.send_text(json.dumps(response))
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
