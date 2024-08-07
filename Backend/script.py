from accountManager import AccountManager

def main():
    server = 'alumchat.lol'
    port = 5222

    account_manager = AccountManager(server, port)

    # Registro de cuenta
    # new_username = 'her21270-test2'
    # new_password = '1234'
    # account_manager.register_account(new_username, new_password)
    
    # Iniciar sesión con la nueva cuenta
    account_manager.login('her21270-test2', '1234wewqeq')
    
    # Aquí podrías agregar funcionalidades de comunicación si fuera necesario
    
    # Cerrar sesión
    account_manager.logout()

if __name__ == "__main__":
    main()