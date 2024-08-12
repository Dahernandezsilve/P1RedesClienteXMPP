import socket
import ssl
import base64
from typing import Optional

class XMPPClient:
    def __init__(self, server: str, port: int, username: str, password: str, resource: str) -> None:
        self.server = server
        self.port = port
        self.username = username
        self.password = password
        self.resource = resource
        self.sock: Optional[socket.socket] = None

    def connect(self) -> None:
        # Crear un socket y conectarse al servidor
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.server, self.port))

        # Iniciar la sesión XMPP
        self.send(f"<stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>")
        self.receive()

        # Iniciar TLS (si está disponible y es soportado)
        self.send("<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>")
        self.receive()

        # Envolver el socket en SSL después de recibir el permiso para hacerlo
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        self.sock = context.wrap_socket(self.sock, server_hostname=self.server)

        # Iniciar una nueva sesión XMPP después de TLS
        self.send(f"<stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>")
        self.receive()

        # Realizar la autenticación SASL PLAIN
        auth_str = f"\0{self.username}\0{self.password}"
        auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        self.send(f"<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>{auth_b64}</auth>")
        self.receive()

        # Realizar el binding de recursos
        self.send(f"<iq type='set' id='bind_1'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'><resource>{self.resource}</resource></bind></iq>")
        self.receive()

        # Iniciar la sesión
        self.send("<iq type='set' id='sess_1'><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/></iq>")
        self.receive()

    def send(self, data: str) -> None:
        print(f"Sending: {data}")
        self.sock.sendall(data.encode('utf-8'))

    def receive(self) -> str:
        data = self.sock.recv(4096).decode('utf-8')
        print(f"Received: {data}")
        return data

    def send_message(self, to: str, body: str) -> None:
        self.send(f"<message to='{to}' type='chat'><body>{body}</body></message>")
        self.receive()

    def disconnect(self) -> None:
        if self.sock:
            self.sock.close()
            self.sock = None


# Uso de la clase
if __name__ == "__main__":
    xmpp_client = XMPPClient('alumchat.lol', 5222, 'her21270-test1', '1234', 'test')
    xmpp_client.connect()
    xmpp_client.send_message('val21240@alumchat.lol', 'Hola desde el cliente XMPP!')
    xmpp_client.disconnect()
