import socket
import ssl
from typing import Optional
from utils import encode_base64, log_message
import config

class XMPPClient:
    def __init__(self, server: str = config.SERVER, port: int = config.PORT, 
                 username: str = config.USERNAME, password: str = config.PASSWORD, 
                 resource: str = config.RESOURCE) -> None:
        self.server = server
        self.port = port
        self.username = username
        self.password = password
        self.resource = resource
        self.sock: Optional[socket.socket] = None

    def connect_without_auth(self) -> None:
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.server, self.port))
        self.send(f"<stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>")
        self.receive()
        self.send("<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>")
        self.receive()
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        self.sock = context.wrap_socket(self.sock, server_hostname=self.server)
        self.send(f"<stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>")
        self.receive()

    def connect(self) -> None:
        self.connect_without_auth()
        
        auth_str = f"\0{self.username}\0{self.password}"
        auth_b64 = encode_base64(auth_str)
        
        self.send(f"<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>{auth_b64}</auth>")
        
        # Recibir la respuesta de autenticación
        response = self.receive()
        print("Server Response:", response)

        if "<failure" in response:  # Si la respuesta contiene <failure>, hubo un error
            raise Exception("Authentication failed: Invalid username or password.")
        
        # Proceder a la siguiente parte del proceso de conexión
        self.send(f"<iq type='set' id='bind_1'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'><resource>{self.resource}</resource></bind></iq>")
        self.receive()
        self.send("<iq type='set' id='sess_1'><session xmlns='urn:ietf:params:xml:ns=xmpp-session'/></iq>")
        self.receive()

    def send(self, data: str) -> None:
        log_message("Sending", data)
        self.sock.sendall(data.encode('utf-8'))

    def receive(self) -> str:
        data = ""
        buffer_size = 4096  # Tamaño inicial del búfer
        self.sock.settimeout(1)  # Establecer un tiempo de espera de 1 segundo

        while True:
            try:
                print("Receiving data...")
                chunk = self.sock.recv(buffer_size).decode('utf-8')
                if not chunk:
                    break  # Salir si no hay más datos
                data += chunk  # Acumular datos

                # Aumentar el tamaño del búfer si es necesario
                if len(chunk) == buffer_size:
                    buffer_size *= 2  # Duplicar el tamaño del búfer
                    print(f"Increasing buffer size to: {buffer_size}")

            except socket.timeout:
                print("Timeout: No se recibieron datos.")
                break
            except Exception as e:
                print(f"Error al recibir datos: {e}")
                break

        log_message("Received", data)
        return data

    def get_roster(self) -> str:
            """
            Envía una solicitud para obtener el roster (lista de contactos) del usuario.
            """
            self.send("<iq type='get' id='roster_1'><query xmlns='jabber:iq:roster'/></iq>")
            response = self.receive()
            return response
    
    def send_message(self, to: str, body: str) -> None:
        self.send(f"<message to='{to}' type='chat'><body>{body}</body></message>")
#        self.receive()

    def disconnect(self) -> None:
        if self.sock:
            self.sock.close()
            self.sock = None
