from client import XMPPClient
import xml.etree.ElementTree as ET
import re

class CommunicationManager:
    def __init__(self, client: XMPPClient) -> None:
        self.client = client

    def show_users(self) -> list:
        """
        Devuelve la lista de usuarios/contactos del usuario conectado.
        """
        roster_response = self.client.get_roster()

        # Dividir la respuesta en elementos XML individuales
        xml_elements = re.findall(r'(<iq.*?</iq>)', roster_response, re.DOTALL)

        users = []

        for element in xml_elements:
            try:
                root = ET.fromstring(element)
                for item in root.findall(".//{jabber:iq:roster}item"):
                    jid = item.get("jid")
                    name = item.get("name")
                    users.append({"jid": jid, "name": name})  # Devuelve como un diccionario
            except ET.ParseError:
                print("Error al parsear un elemento XML, se omitirá.")
                continue

        return users

    def add_contact(self, username: str) -> None:
        # Lógica para agregar contacto
        pass

    def show_contact_details(self, username: str) -> None:
        # Lógica para mostrar detalles de contacto
        pass

    def send_message(self, to: str, body: str) -> None:
        self.client.send_message(to, body)

    def join_group_chat(self, group_name: str) -> None:
        # Lógica para unirse a un grupo
        pass

    def set_presence(self, presence: str) -> None:
        # Lógica para definir presencia
        pass

    def send_notification(self, to: str, message: str) -> None:
        # Lógica para enviar notificaciones
        pass

    def send_file(self, to: str, file_path: str) -> None:
        # Lógica para enviar archivos
        pass
