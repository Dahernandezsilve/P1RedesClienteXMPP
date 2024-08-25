import asyncio
import xml.etree.ElementTree as ET
from typing import Optional
from communicationManager import CommunicationManager
from utils import split_xml_messages, split_presence_messages, split_all_messages, parse_bookmarks_response, split_iq_messages
import json
import requests
import base64
import uuid
import re

class MessageHandler:
    def __init__(self, client, comm_manager: CommunicationManager) -> None:
        self.client = client
        self.comm_manager = comm_manager
        self.message_queue = asyncio.Queue()
        self.processed_message_ids = set()

    async def receive_messages(self):
        while True:
            try:
                if self.client.bufferMessagesToClean:
                    # Procesar mensajes almacenados en bufferMessagesToClean
                    for buffered_message in self.client.bufferMessagesToClean:
                        await self.message_queue.put(buffered_message)
                    self.client.bufferMessagesToClean.clear()
                    message = await asyncio.to_thread(self.client.receive)
                if message:
                    await self.message_queue.put(message)
                    await self.process_messages()
                else:
                    await asyncio.sleep(1)  # Esperar antes de volver a intentar si no hay datos
            except Exception as e:
                print(f"Error receiving messages: {e}")
                break

    async def process_messages(self):
        while not self.message_queue.empty():
            message = await self.message_queue.get()
            messages = split_all_messages(message)
            for msg in messages:
                await self.handle_message(msg)

    async def handle_message(self, message: str):
        
        if "<message" in message:
            await self.handle_chat_message(message)
        elif "<iq" in message:
            iq_messages = split_iq_messages(message)
            for message in iq_messages:
                await self.handle_iq_message(message)
        elif "<presence" in message:
            await self.handle_presence_message(message)
        else:
            print(f"Unknown message type: {message}")

    async def handle_chat_message(self, message: str):
        print(f"Processing chat message: {message}")
        try:
            messages = split_xml_messages(message)
            for messag in messages:
                root = ET.fromstring(messag)
                
                # Buscar el atributo `id` del mensaje
                message_id = root.attrib.get('id')
                if not message_id:
                    stanza_id_elem = root.find(".//{urn:xmpp:sid:0}stanza-id")
                    if stanza_id_elem is not None:
                        message_id = stanza_id_elem.attrib.get('id')

                # Verificar si el mensaje ya ha sido procesado
                if message_id in self.processed_message_ids:
                    print(f"Message with ID {message_id} has already been processed, skipping.")
                    continue
                
                # Almacenar el ID del mensaje en el conjunto
                self.processed_message_ids.add(message_id)
                
                # Buscar el elemento <body> sin importar el espacio de nombres
                body = root.find(".//body")
                from_attr = root.attrib.get('from', 'unknown')
                if body is not None:
                    print(f"Chat message body: {body.text}")
                    print(f"Message received from: {from_attr}")
                    print(f"Message ID: {message_id}")
                    await self.comm_manager.handle_received_message(body.text, from_attr, message_id)
                else:
                    print("Chat message body not found")
        except ET.ParseError:
            print("Error parsing chat message")


    async def handle_iq_message(self, message: str):
        print(f"Processing IQ message: {message}")
        try:
            root = ET.fromstring(message)
            iq_type = root.attrib.get('type')
            iq_id = root.attrib.get('id')
            iq_from = root.attrib.get('from')
            iq_to = root.attrib.get('to')

            # Espacios de nombres
            namespace_ping = 'urn:xmpp:ping'
            namespace_version = 'jabber:iq:version'
            namespace_bind = 'urn:ietf:params:xml:ns:xmpp-bind'
            namespace_session = 'urn:ietf:params:xml:ns=xmpp-session'

            if iq_type == 'get':
                if root.find(f".//{{{namespace_ping}}}ping") is not None:
                    # Responder al ping
                    response = (
                        f'<iq type="result" id="{iq_id}" from="{iq_to}" to="{iq_from}"/>'
                    )
                    self.client.send(response)
                elif root.find(f".//{{{namespace_version}}}query") is not None:
                    # Responder a la consulta de versión
                    version_response = (
                        f'<iq type="result" id="{iq_id}" from="{iq_to}" to="{iq_from}">'
                        '<query xmlns="jabber:iq:version">'
                        '<name>DiegosClient</name>'
                        '<version>1.0</version>'
                        '<os>Windows 11</os>'
                        '</query>'
                        '</iq>'
                    )
                    self.client.send(version_response)
                elif root.find(f".//{{{namespace_bind}}}bind") is not None:
                    # Responder a la solicitud de enlace
                    bind_response = (
                        f'<iq type="result" id="{iq_id}" from="{iq_to}" to="{iq_from}">'
                        '<bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">'
                        f'<jid>{iq_to}</jid>'
                        '</bind>'
                        '</iq>'
                    )
                    self.client.send(bind_response)
                else:
                    # Manejar otros tipos de IQ si es necesario
                    print(f"Unhandled IQ message query: {ET.tostring(root, encoding='unicode')}")
            elif iq_type == 'result':
                print(f"Handled IQ message type result: {ET.tostring(root, encoding='unicode')}")

                xml_text = ET.tostring(root, encoding='unicode')
                id_pattern = re.compile(r'id="disco1"')
                bookmark_pattern = re.compile(r'<storage xmlns="storage:bookmarks">')
                
                if id_pattern.search(xml_text):
                    rooms = []
                    try:
                        root = ET.fromstring(xml_text)
                        item_count = 0
                        for item_elem in root.findall(".//{http://jabber.org/protocol/disco#items}item"):
                            jid = item_elem.get("jid", "N/A")
                            name = item_elem.get("name", "N/A")

                            print(f"Item {item_count}: JID={jid}, Name={name}")
                            
                            rooms.append({
                                "jid": jid,
                                "name": name,
                            })
                            item_count += 1
                        groups_list = {"status": "success", "action": "show_all_groups", "groups": rooms}
                        await self.comm_manager.websocket.send_text(json.dumps(groups_list))
                    except ET.ParseError:
                        print("Error parsing discovery response")
                elif root.find(".//{storage:bookmarks}storage") is not None:
                    bookmarks = parse_bookmarks_response(xml_text)
                    if len(bookmarks)>0:
                        for book in bookmarks:
                            await self.comm_manager.join_group_chat(book['jid'])
                        response = {
                            "status": "success",
                            "action": "bookmarks",
                            "message": bookmarks,
                         }
                        await self.websocket.send_text(json.dumps(response))
                elif root.find(".//{jabber:iq:roster}query") is not None:
                    users = []
                    try:
                        # Extraer información de los elementos <item>
                        for item in root.findall(".//{jabber:iq:roster}item"):
                            jid = item.get("jid")
                            name = item.get("name", "")
                            subscription = item.get("subscription", "")
                            
                            if subscription != "none":
                                users.append({"jid": jid, "name": name})
                        
                        # Preparar la lista de usuarios para enviar por WebSocket
                        user_list = {"status": "success", "action": "contacts", "users": users}
                        await self.comm_manager.websocket.send_text(json.dumps(user_list))
                    
                    except ET.ParseError:
                        print("Error parsing XML element")
                else:
                    namespace = '{urn:xmpp:http:upload:0}'
                    slot = root.find(f'.//{namespace}slot')
                    if slot is not None:

                        put_element = slot.find(f'{namespace}put')
                        get_element = slot.find(f'{namespace}get')
                        
                        put_url = put_element.attrib.get('url') if put_element is not None else None
                        get_url = get_element.attrib.get('url') if get_element is not None else None

                        if put_url and get_url:
                            print(f"Received upload URLs:\nPUT: {put_url}\nGET: {get_url}")

                            # Llamar a upload_file con las URLs obtenidas
                            await self.upload_file(put_url, get_url)
                        else:
                            print("Error: Upload URLs not found in the IQ result")
                    else:
                        print("Error: 'slot' element not found in the IQ result")

            elif iq_type == 'error':
                # Manejar mensajes IQ de tipo error
                error_code = root.find('.//error').attrib.get('code', 'unknown')
                error_text = root.find('.//error').text
                print(f"Error received: code={error_code}, text={error_text}")
            else:
                # Manejar otros tipos de IQ si es necesario
                print(f"Unhandled IQ message type: {iq_type}")

        except ET.ParseError:
            print("Error parsing IQ message")
        except Exception as e:
            print(f"Unexpected error processing IQ message: {e}")

    async def set_upload_callback(self, callback) -> None:
        self.client.uploadCallback = callback

    async def upload_file(self, put_url: str, get_url: str) -> None:
        if self.client.file_data is not None:
            try:
                # Subir el archivo usando requests
                print("Uploading file...")
                print(f"PUT URL: {put_url}")
                print(f"File size: {self.client.file_data} bytes")
                headers = {'Content-Type': 'application/octet-stream'}
                file_data = base64.b64decode(self.client.file_data)
                response = requests.put(put_url, data=file_data, headers=headers, verify=False)
                print(f"Upload response: {response}")
                if response.status_code == 201:
                    print("File uploaded successfully")
                    await self.send_file_message(get_url, self.client.file_meta.get('to'))
                else:
                    print(f"Failed to upload file: {response.status_code}")
            except Exception as e:
                print(f"Error during file upload: {e}")
        else:
            print("Error: No file data available for upload.")

    async def send_file_message(self, get_url: str, to: str) -> None:
        # Generar un identificador único para el mensaje
        id_message = str(uuid.uuid4())
        
        # Construir el mensaje de chat con la URL del archivo y el id_message
        message = f"""
        <message type='chat' to='{to}' from='{self.client.username}' id='{id_message}'>
            <body>{get_url}</body>
        </message>
        """
        try:
            # Enviar el mensaje al destinatario
            self.client.send(message)
            print(f"File message sent to {to} with URL: {get_url} and ID: {id_message}")
            
            # Limpiar datos del archivo después de enviar
            self.client.file_data = None
            self.client.file_meta = {}
            
            # Enviar una respuesta al cliente con el estado y el id_message
            response = {
                "status": "success",
                "action": "fileUrl",
                "url": get_url,
                "id_message": id_message,
                'to': to
            }
            await self.websocket.send_text(json.dumps(response))
        except Exception as e:
            print(f"Error sending file message: {e}")
            # Enviar una respuesta de error al cliente
            response = {
                "status": "error",
                "action": "fileUrl",
                "error": str(e),
                "id_message": id_message
            }
        await self.websocket.send_text(json.dumps(response))


    async def handle_presence_message(self, message: str):
        print(f"Processing presence message: {message}")
        try:
            # Dividir el mensaje en fragmentos de presencia
            presence_messages = split_presence_messages(message)
            for presence in presence_messages:
                try:
                    # Intentar analizar cada fragmento de presencia como XML
                    print(f"Individual presence message: {presence}")
                    root = ET.fromstring(presence)

                    # Obtener el tipo de presencia y el JID del remitente
                    presence_type = root.attrib.get('type', 'available')
                    from_jid = root.attrib.get('from', 'unknown')

                    # Obtener el estado y el show, sin tener en cuenta el espacio de nombres
                    show = root.find(".//show")
                    status = root.find(".//status")
                    show_text = show.text if show is not None else 'unknown'
                    status_text = status.text if status is not None else 'unknown'

                    print(f"Presence type: {presence_type}, from: {from_jid}, show: {show_text}, status: {status_text}")

                    # Crear el mensaje para el frontend
                    presence_info = {
                        "from": from_jid,
                        "type": presence_type,
                        "show": show_text,
                        "status": status_text
                    }

                    # Enviar la información al frontend
                    user_list = {"status": "success", "action": "presence_update", "presence": presence_info}
                    await self.websocket.send_text(json.dumps(user_list))

                    # Manejar diferentes tipos de presencia
                    if presence_type == 'unavailable':
                        # El usuario ha cerrado sesión o está desconectado
                        print(f"User {from_jid} is now unavailable.")

                    elif presence_type == 'subscribed':
                        # El otro usuario aceptó tu solicitud de amistad
                        print(f"User {from_jid} accepted your contact request.")
                        # Actualizar el roster
                        roster_response = await asyncio.to_thread(self.comm_manager.show_users)
                        user_list = {"status": "success", "action": "contacts", "users": roster_response}
                        await self.websocket.send_text(json.dumps(user_list))

                except ET.ParseError as e:
                    print(f"Error parsing individual presence message: {presence}")
                    print(f"ParseError details: {e}")
                except Exception as e:
                    print(f"Unexpected error processing presence message: {presence}")
                    print(f"Error details: {e}")
        except Exception as e:
            print(f"Error processing presence messages: {message}")
            print(f"Error details: {e}")