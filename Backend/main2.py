from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from client import XMPPClient
from accountManager import AccountManager
from utils import xml_to_json
from communicationManager import CommunicationManager  # Asegúrate de importar esto
import threading
import asyncio
import json

app = FastAPI()

# Almacena las conexiones WebSocket y los clientes XMPP
clients = {}

async def listen_for_messages(websocket: WebSocket, xmpp_client: XMPPClient):
    while True:
        print("hola")
        message = xmpp_client.receive()  # Método que debe recibir el mensaje desde XMPP
        print("hola2", message)
        if message:
            print(f"Received XMPP Message: {message}")  # Log para ver qué mensajes se reciben
            json_message = xml_to_json(message)
            if json_message:  # Verifica si la conversión fue exitosa
                print(f"Sending JSON: {json_message}") 
                await websocket.send_text(json_message)
        await asyncio.sleep(1)  # Evitar un ciclo de CPU intenso


async def send_messages(websocket: WebSocket, comm_manager: CommunicationManager):
    while True:
        data = await websocket.receive_text()
        message = json.loads(data)
        to = message["to"]
        body = message["body"]
        comm_manager.send_message(to, body)
        response = {"status": "success", "message": f"Message sent to {to}"}
        await websocket.send_text(json.dumps(response))

@app.websocket("/ws/{username}/{password}")
async def websocket_endpoint(websocket: WebSocket, username: str, password: str):
    await websocket.accept()
    
    account_manager = AccountManager('alumchat.lol', 5222)
    try:
        account_manager.login(username, password)
    except Exception as e:
        error_message = {"status": "error", "message": "Login failed. Please check your credentials"}
        await websocket.send_text(json.dumps(error_message))
        await websocket.close()
        return

    clients[username] = account_manager.client
    comm_manager = CommunicationManager(account_manager.client)

    asyncio.create_task(listen_for_messages(websocket, account_manager.client))

    try:
        await send_messages(websocket, comm_manager)
    except WebSocketDisconnect:
        pass
    finally:
        account_manager.logout()
        del clients[username]

@app.websocket("/register")
async def register_user(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        message = json.loads(data)
        username = message["username"]
        password = message["password"]

        account_manager = AccountManager('alumchat.lol', 5222)

        # Registro de cuenta
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
