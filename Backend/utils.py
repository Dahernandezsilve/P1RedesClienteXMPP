import base64
import xmltodict
import json

def xml_to_json(xml_string: str) -> str:
    """
    Convierte una cadena XML en un objeto JSON.

    Args:
        xml_string (str): Cadena XML a convertir.

    Returns:
        str: Cadena JSON resultante.
    """
    try:
        # Convertir XML a diccionario
        dict_data = xmltodict.parse(xml_string)
        
        # Convertir diccionario a JSON
        json_data = json.dumps(dict_data)
        
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