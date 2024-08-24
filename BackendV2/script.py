from accountManager import AccountManager
from communicationManager import CommunicationManager
from MessageHandler import MessageHandler
import asyncio

async def main():
    server = 'alumchat.lol'
    port = 5222

    # Crear instancia de AccountManager
    account_manager = AccountManager(server, port)
    
    try:
        # Iniciar sesión con la cuenta
        username = 'her21270-test2'
        password = '1234'
        account_manager.login(username, password)
        
        # Crear instancia de CommunicationManager
        comm_manager = CommunicationManager(account_manager.client)
        
        # Crear instancia de MessageHandler
        message_handler = MessageHandler(account_manager.client, comm_manager)
    
    
        # Enviar un mensaje (descomentado si se necesita)
        # comm_manager.send_message('jim21169-test@alumchat.lol', 'Hola, ¿cómo estás?')
        await comm_manager.join_group_chat('val21240')
        

        # Iniciar la recepción de mensajes
        #asyncio.create_task(message_handler.receive_messages())
        
        # Simulación de espera para recepción de mensajes
        
        account_manager.logout()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Cerrar sesión
        account_manager.logout()

if __name__ == "__main__":
    asyncio.run(main())
