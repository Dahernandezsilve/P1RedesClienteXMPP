from client import XMPPClient
from utils import log_message

class AccountManager:
    def __init__(self, server: str, port: int) -> None:
        self.server = server
        self.port = port
        self.client = XMPPClient(server, port, '', '', '')

    def register_account(self, username: str, password: str) -> None:
        self.client.connect_without_auth()
        self.client.send(f"<iq type='set' id='reg1'><query xmlns='jabber:iq:register'><username>{username}</username><password>{password}</password></query></iq>")
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

    def delete_account(self, username: str, password: str) -> None:
        self.client.username = username
        self.client.password = password
        self.client.connect()
        self.client.send("<iq type='set' id='delete1'><query xmlns='jabber:iq:register'><remove/></query></iq>")
        self.client.receive()
        self.client.disconnect()
