import base64
import xmltodict
import json
import re
import xml.etree.ElementTree as ET

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

def handle_xml_data(xml_data: str):
    messages = split_xml_messages(xml_data)
    for message in messages:
        process_message(message)