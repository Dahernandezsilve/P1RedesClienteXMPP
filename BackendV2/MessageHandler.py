import asyncio
import xml.etree.ElementTree as ET
from typing import Optional
from communicationManager import CommunicationManager
from utils import split_xml_messages, split_presence_messages, split_all_messages

class MessageHandler:
    def __init__(self, client, comm_manager: CommunicationManager) -> None:
        self.client = client
        self.comm_manager = comm_manager
        self.message_queue = asyncio.Queue()

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
                # Buscar el elemento <body> sin importar el espacio de nombres
                body = root.find(".//body")
                from_attr = root.attrib.get('from', 'unknown')
                if body is not None:
                    print(f"Chat message body: {body.text}")
                    print(f"Message received from: {from_attr}")
                    await self.comm_manager.handle_received_message(body.text, from_attr)
                else:
                    print("Chat message body not found")
        except ET.ParseError:
            print("Error parsing chat message")


    async def handle_iq_message(self, message: str):
        print(f"Processing IQ message: {message}")
        try:
            root = ET.fromstring(message)
            # Implementar lógica específica para procesar IQs
        except ET.ParseError:
            print("Error parsing IQ message")

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
                    show = root.find(".//{jabber:client}show")
                    status = root.find(".//{jabber:client}status")
                    show_text = show.text if show is not None else 'unknown'
                    status_text = status.text if status is not None else 'unknown'
                    print(f"Presence show: {show_text}, status: {status_text}")
                    # Aquí puedes agregar lógica para actualizar el estado de presencia en la interfaz de usuario
                except ET.ParseError as e:
                    print(f"Error parsing individual presence message: {presence}")
                    print(f"ParseError details: {e}")
                except Exception as e:
                    print(f"Unexpected error processing presence message: {presence}")
                    print(f"Error details: {e}")
        except Exception as e:
            print(f"Error processing presence messages: {message}")
            print(f"Error details: {e}")