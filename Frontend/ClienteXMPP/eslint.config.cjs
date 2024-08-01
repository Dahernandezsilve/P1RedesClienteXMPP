import { defineConfig } from 'eslint-define-config';

export default defineConfig([
  // Configuración para el proyecto
  {
    // Define los archivos que se analizarán
    files: ['*.js', '*.jsx'],
    languageOptions: {
      globals: {
        // Aquí puedes agregar las variables globales que necesites
        window: true,
        document: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Puedes agregar aquí más reglas personalizadas
    },
  },
  // Configuración de Airbnb
  {
    files: ['*.js', '*.jsx'],
    languageOptions: {
      globals: {
        // Variables globales para la configuración de Airbnb
        // ...
      },
    },
    rules: {
      // Las reglas de Airbnb que quieres aplicar
      // ...
    },
    plugins: {
      // Configuración de plugins
      'react': require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      // Agrega otros plugins aquí
    },
  },
  // Otras configuraciones de plugins que necesites
]);
