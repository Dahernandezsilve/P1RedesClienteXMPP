from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from client import XMPPClient
from accountManager import AccountManager
from communicationManager import CommunicationManager
from MessageHandler import MessageHandler
from utils import xml_to_json
import json
import asyncio

app = FastAPI()

clients = {}

class WebSocketMessageHandler(MessageHandler):
    def __init__(self, client, comm_manager: CommunicationManager, websocket: WebSocket) -> None:
        super().__init__(client, comm_manager)
        self.websocket = websocket



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
    comm_manager = CommunicationManager(account_manager.client, websocket)
    message_handler = WebSocketMessageHandler(account_manager.client, comm_manager, websocket)
    
    try:
        roster_response = comm_manager.show_users()
        user_list = {"status": "success", "action": "contacts", "users": roster_response}
        await websocket.send_text(json.dumps(user_list))
    except Exception as e:
        error_message = {"status": "error", "message": f"Failed to retrieve user list: {str(e)}"}
        await websocket.send_text(json.dumps(error_message))

    # Inicia la recepción de mensajes
    asyncio.create_task(message_handler.receive_messages())

    while True:
        try:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["action"] == "show_all_users":
                # Manejar la solicitud de mostrar todos los usuarios
                try:
                    users = comm_manager.search_all_users()
                    user_list = {"status": "success", "action": "show_all_users", "users": users}
                    await websocket.send_text(json.dumps(user_list))
                except Exception as e:
                    error_message = {"status": "error", "message": f"Failed to retrieve user list: {str(e)}"}
                    await websocket.send_text(json.dumps(error_message))
            
            elif message["action"] == "send_message":
                to = message["to"]
                body = message["body"]
                comm_manager.send_message(to, body)
                response = {"status": "success", "message": f"Message sent to {to}"}
                await websocket.send_text(json.dumps(response))

            elif message["action"] == "add_contact":
                try:
                    contact_username = message["contact_username"]
                    custom_message = message.get("custom_message", "")
                    comm_manager.add_contact(contact_username, custom_message)
                    response = {"status": "success", "message": f"Contact {contact_username} added successfully with message: {custom_message}"}
                    await websocket.send_text(json.dumps(response))
                except Exception as e:
                    error_message = {"status": "error", "message": f"Failed to add contact: {str(e)}"}
                    await websocket.send_text(json.dumps(error_message))

            elif message["action"] == "delete_account":
                try:
                    account_manager.delete_account()
                    response = {"status": "success", "message": f"Account {account_manager.client.username} deleted successfully"}
                    await websocket.send_text(json.dumps(response))
                except Exception as e:
                    error_message = {"status": "error", "message": f"Failed to delete account: {str(e)}"}
                    await websocket.send_text(json.dumps(error_message))

            elif message["action"] == "set_presence":
                try:
                    presence = message["presence"]
                    status = message["status"]
                    comm_manager.set_presence(presence, status)
                    response = {"status": "success", "message": f"Presence changed successfully"}
                    await websocket.send_text(json.dumps(response))
                except Exception as e:
                    error_message = {"status": "error", "message": f"Failed to change presence: {str(e)}"}
                    await websocket.send_text(json.dumps(error_message))

        except WebSocketDisconnect:
            break
        except Exception as e:
            print(f"Error in websocket communication: {e}")
            response = {"status": "error", "message": "Failed to send message"}
            await websocket.send_text(json.dumps(response))
            break

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
        name = message["name"]
        email = message["email"]

        account_manager = AccountManager('alumchat.lol', 5222)

        # Registro de cuenta
        account_manager.register_account(username, password, name, email)
        
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
