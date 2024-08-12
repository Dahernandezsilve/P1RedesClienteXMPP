from client import XMPPClient
import xml.etree.ElementTree as ET
import re
import json
import asyncio

class CommunicationManager:
    def __init__(self, client: XMPPClient, websocket = None) -> None:
        self.client = client
        self.websocket = websocket

    def show_users(self) -> list:
        roster_response = self.client.get_roster()
        xml_elements = re.findall(r'(<iq.*?</iq>)', roster_response, re.DOTALL)
        users = []
        for element in xml_elements:
            try:
                root = ET.fromstring(element)
                for item in root.findall(".//{jabber:iq:roster}item"):
                    jid = item.get("jid")
                    name = item.get("name")
                    users.append({"jid": jid, "name": name})
            except ET.ParseError:
                print("Error parsing XML element")
                continue
        return users
    
    def search_all_users(self, filter: str = '*') -> list:
        # Construir la solicitud de búsqueda para el servicio específico
        search_query = f"""<iq type='set' from='{self.client.username}@{self.client.server}/testWeb' to='search.alumchat.lol' id='search1' xml:lang='en'>
            <query xmlns='jabber:iq:search'>
                <x xmlns='jabber:x:data' type='submit'>
                    <field var='FORM_TYPE' type='hidden'>
                        <value>jabber:iq:search</value>
                    </field>
                    <field var='search'>
                        <value>{filter}</value> <!-- Valor de búsqueda -->
                    </field>
                    <field var='Username' type='boolean'>
                        <value>1</value>
                    </field>
                    <field var='Name' type='boolean'>
                        <value>1</value>
                    </field>
                    <field var='Email' type='boolean'>
                        <value>1</value>
                    </field>
                </x>
            </query>
        </iq>"""

        # Enviar la solicitud al servidor
        self.client.send(search_query)
        search_response = self.client.receive()

        user_pattern = re.compile(r'<item>.*?<field var="jid"><value>(.*?)</value></field>.*?<field var="Username"><value>(.*?)</value></field>.*?<field var="Name"><value>(.*?)</value></field>.*?<field var="Email"><value>(.*?)</value></field>.*?</item>', re.DOTALL)
        
        # Buscar todos los usuarios en el XML
        matches = user_pattern.findall(search_response)
        
        users = []
        for match in matches:
            jid, username, name, email = match
            users.append({
                'jid': jid,
                'username': username,
                'name': name,
                'email': email,
            })
            
        
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

    async def handle_received_message(self, message: str, from_attr: str) -> str:
        print(f"Handling received message: {message}")
        json_message = {
            "message": message,
            "from": from_attr
        }
        # Convierte el objeto JSON a una cadena de texto
        print("pasosoooooo")
        if json_message:
            print(f"Sending message to WebSocket: {json_message}")
            await self.websocket.send_text(json.dumps(json_message))
        await asyncio.sleep(1)  # Evitar un ciclo de CPU intensome