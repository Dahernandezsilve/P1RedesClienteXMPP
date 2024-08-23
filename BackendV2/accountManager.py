from client import XMPPClient
from utils import log_message

class AccountManager:
    def __init__(self, server: str, port: int) -> None:
        self.server = server
        self.port = port
        self.client = XMPPClient(server, port, '', '', '')

    def register_account(self, username: str, password: str, name: str = '', email: str = '') -> None:
        self.client.connect_without_auth()
        # Crea la solicitud de registro con campos adicionales para nombre y email
        register_request = (
            f"<iq type='set' id='reg1'>"
            f"<query xmlns='jabber:iq:register'>"
            f"<username>{username}</username>"
            f"<password>{password}</password>"
            f"<name>{name}</name>"  # Campo adicional para el nombre
            f"<email>{email}</email>"  # Campo adicional para el email
            f"</query>"
            f"</iq>"
        )
        self.client.send(register_request)
        response = self.client.receive()
        if 'type="result"' in response:
            log_message("Info", "Account registered successfully.")
        else:
            log_message("Error", "Account registration failed.")
        self.client.disconnect()


    def login(self, username: str, password: str) -> None:
        self.client.username = username
        self.client.password = password
        self.client.connect()

        # Send presence to server
        self.client.send("<presence><status>Online</status></presence>")
        

    def logout(self) -> None:
        self.client.disconnect()

    def delete_account(self) -> None:
        self.client.send("<iq type='set' id='delete1'><query xmlns='jabber:iq:register'><remove/></query></iq>")
        self.client.receive()
        self.client.disconnect()
