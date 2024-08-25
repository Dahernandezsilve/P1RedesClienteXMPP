import base64
import xmltodict
import json
import re
import xml.etree.ElementTree as ET
from typing import List

def xml_to_json(xml_string: str) -> str:
    """
    Convierte una cadena XML en un objeto JSON.

    Args:
        xml_string (str): Cadena XML a convertir.

    Returns:
        str: Cadena JSON resultante.
    """
    try:
        # Añadir un elemento raíz si no existe
        wrapped_xml = f"<root>{xml_string}</root>"
        dict_data = xmltodict.parse(wrapped_xml, force_list=True)
        json_data = json.dumps(dict_data)

        print(f"Converted XML to JSON: {json_data}")
        return json_data
    except Exception as e:
        print(f"Error converting XML to JSON: {e}")
        return {}

def clean_xml(xml_str):
    # Elimina etiquetas incompletas o mal formadas
    xml_str = re.sub(r'<item[^>]*<item[^>]*>', '<item', xml_str)  # Corrige etiquetas <item> mal cerradas
    xml_str = re.sub(r'<item\s+[^>]+?[^>]*<item[^>]*>', '<item', xml_str)  # Corrige etiquetas <item> mal anidadas
    xml_str = re.sub(r'(<item[^>]+?)(?!jid=|name=).*?>', r'\1>', xml_str)  # Elimina atributos innecesarios
    xml_str = re.sub(r'<item\s+[^>]+?/>', '<item/>', xml_str)  # Corrige etiquetas <item> auto-cerradas
    return xml_str

def encode_base64(data: str) -> str:
    """Encode a string to base64."""
    return base64.b64encode(data.encode('utf-8')).decode('utf-8')

def decode_base64(data: str) -> str:
    """Decode a base64 encoded string."""
    return base64.b64decode(data).decode('utf-8')

def log_message(direction: str, message: str) -> None:
    """Log a sent or received XMPP message."""
    print(f"{direction}: {message}")

def split_xml_messages(xml_data: str):
    # Expresión regular para encontrar los mensajes
    message_pattern = re.compile(r'<message[^>]*>.*?</message>', re.DOTALL)
    messages = message_pattern.findall(xml_data)
    return messages



def split_presence_messages(xml_data: str) -> List[str]:
    """
    Divide un bloque de datos XML en mensajes de presencia individuales.

    :param xml_data: Datos XML que contienen múltiples mensajes de presencia.
    :return: Lista de mensajes de presencia individuales.
    """
    presence_messages = []
    try:
        # Usa ElementTree para analizar el XML completo
        root = ET.fromstring(f'<root>{xml_data}</root>')  # Envuelve en un contenedor raíz ficticio

        # Encuentra todos los elementos de presencia dentro del contenedor raíz
        for presence in root.findall(".//presence"):
            # Serializa el elemento de presencia a una cadena XML
            presence_xml = ET.tostring(presence, encoding='unicode')
            presence_messages.append(presence_xml)
    
    except ET.ParseError as e:
        print(f"Error parsing XML data: {e}")
    
    return presence_messages

def split_all_messages(xml_data: str) -> list:
    """
    Divide un bloque de datos XML en mensajes individuales de diferentes tipos (presencia, IQ, mensaje).
    
    :param xml_data: Datos XML que contienen múltiples mensajes.
    :return: Lista de mensajes individuales.
    """
    # Expresión regular para encontrar los diferentes tipos de mensajes
    message_patterns = [
        r'<message[^>]*>.*?</message>',  # Mensajes de chat
        r'<iq[^>]*>.*?</iq>',            # Mensajes IQ
        r'<presence[^>]*>.*?</presence>' # Mensajes de presencia
    ]
    
    # Concatenate all patterns into one single regex pattern
    combined_pattern = '|'.join(message_patterns)
    
    # Encuentra todos los mensajes usando la expresión regular combinada
    all_messages = re.findall(combined_pattern, xml_data, re.DOTALL)
    return all_messages


def parse_bookmarks_response(xml_string):
    root = ET.fromstring(xml_string)
    bookmarks = []
    
    for conference in root.findall(".//storage:conference", namespaces={"storage": "storage:bookmarks"}):
        group_jid = conference.attrib.get('jid')
        autojoin = conference.attrib.get('autojoin', 'false') == 'true'
        name = conference.attrib.get('name')
        
        nick_element = conference.find("storage:nick", namespaces={"storage": "storage:bookmarks"})
        nick = nick_element.text if nick_element is not None else None
        
        bookmarks.append({
            "name": name,
            "jid": group_jid,
            "autojoin": autojoin,
            "nick": nick
        })
    
    return bookmarks