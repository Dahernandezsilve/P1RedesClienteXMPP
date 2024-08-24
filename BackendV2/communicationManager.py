from client import XMPPClient
from utils import clean_xml
import xml.etree.ElementTree as ET
import re
import json
import asyncio
import requests


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
                    name = item.get("name", "")
                    subscription = item.get("subscription", "")
                    
                    if subscription != "none":
                        users.append({"jid": jid, "name": name})
            except ET.ParseError:
                print("Error parsing XML element")
                continue
        return users

    def search_all_users(self, filter: str = '*') -> list:
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

        self.client.send(search_query)
        search_response = self.client.receive()

        user_pattern = re.compile(r'<item>.*?<field var="jid"><value>(.*?)</value></field>.*?<field var="Username"><value>(.*?)</value></field>.*?<field var="Name"><value>(.*?)</value></field>.*?<field var="Email"><value>(.*?)</value></field>.*?</item>', re.DOTALL)
        
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
        
    def add_contact(self, username: str, custom_message: str = "") -> None:
        user_jid = f"{username}@{self.client.server}"

        add_roster_query = f"""
        <iq type='set' id='add_contact_1'>
            <query xmlns='jabber:iq:roster'>
                <item jid='{user_jid}' name='{username}'>
                    <group>Contacts</group>
                </item>
            </query>
        </iq>"""

        self.client.send(add_roster_query)

        subscribe_presence = f"""
        <presence to='{user_jid}' type='subscribe'>
            <status>{custom_message}</status>
        </presence>
        """

        self.client.send(subscribe_presence)

        print(f"Contact {user_jid} added successfully with message: {custom_message}")


    def show_contact_details(self, username: str) -> None:
        # Lógica para mostrar detalles de contacto
        pass

    def send_message(self, to: str, body: str) -> None:
        self.client.send_message(to, body)

    async def join_group_chat(self, jid: str) -> None:
        group_jid = f"{jid}/{self.client.username}"
        
        join_query = f"""
        <presence to='{group_jid}'>
            <x xmlns='http://jabber.org/protocol/muc'/>
        </presence>
        """
        
        try:
            self.client.send(join_query)
            response = {"status": "success", "message": f"Group {group_jid} joined successfully"}
            await self.websocket.send_text(json.dumps(response))
        except Exception as e:
            error_message = {"status": "error", "message": f"Error joining group chat: {e}"}
            await self.websocket.send_text(json.dumps(error_message))                   


    def discover_group_chats(self) -> list:
        muc_service_jid = f"conference.{self.client.server}"
        
        discover_query = f"""
        <iq type='get' to='{muc_service_jid}' id='disco1'>
            <query xmlns='http://jabber.org/protocol/disco#items'/>
        </iq>
        """
        
        self.client.send(discover_query)
       

    def set_presence(self, presence: str, status: str = 'unknown') -> None:
        valid_presence_types = ['available', 'away', 'dnd', 'xa', 'unknown', 'chat']
        
        if presence not in valid_presence_types:
            raise ValueError(f"Invalid presence type: {presence}")
        
        xmlPresence = (
            f'<presence>\n'
            f'    <show>{presence}</show>\n'
            f'    <status>{status}</status>\n'
            f'</presence>'
        )

        self.client.send(xmlPresence)
        

    def send_notification(self, to: str, message: str) -> None:
        # Lógica para enviar notificaciones
        pass

    async def send_file(self, to: str, file_name: str, file_size: int, file_type: str, file_data: bytes) -> None:
        request_slot = f"""
        <iq type='get' to='httpfileupload.alumchat.lol' id='upload-request'>
            <request xmlns='urn:xmpp:http:upload:0' filename='{file_name}' size='{file_size}' content-type='{file_type}' />
        </iq>
        """
        
        try:
            self.client.send(request_slot)
            self.client.file_data = file_data
            self.client.file_meta = {
                'to': to,
                'filename': file_name,
                'size': file_size,
                'type': file_type,
            }
            
        except Exception as e:
            print(f"Error sending file: {e}")


    async def handle_received_message(self, message: str, from_attr: str, id_message: str) -> str:
        print(f"Handling received message: {message}")
        json_message = {
            "message": message,
            "from": from_attr,
            "id_message": id_message 
        }

        if json_message:
            print(f"Sending message to WebSocket: {json_message}")
            await self.websocket.send_text(json.dumps(json_message))
        await asyncio.sleep(1) 