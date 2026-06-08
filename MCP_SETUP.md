# Configurar MCP en Claude Desktop

## Pasos para conectar tu proyecto con Claude Desktop:

### 1. Abre el archivo de configuración
Presiona: **Ctrl + ,** en Claude Desktop
O ve a: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. Reemplaza el contenido con esto:
```json
{
  "mcpServers": {
    "reportes-box-rental": {
      "command": "node",
      "args": ["C:\\proyectos\\reportes-box-rental\\mcp-server.js"],
      "env": {
        "MCP_PORT": "3001"
      }
    }
  }
}
```

### 3. Guarda y reinicia Claude Desktop

### 4. Verifica que está conectado
- En Claude Desktop, debería aparecer un icono de "MCP" en la parte inferior
- Escribe: "¿Qué herramientas tienes disponibles?"
- Claude debería listar las 7 herramientas del servidor

## Herramientas disponibles en Claude:

✅ **docker_status** - Ver estado de contenedores y logs
✅ **docker_control** - Iniciar/detener/reiniciar contenedores
✅ **read_file** - Leer archivos del proyecto
✅ **write_file** - Crear/editar archivos
✅ **list_directory** - Explorar directorios
✅ **exec_command** - Ejecutar comandos en el backend
✅ **api_call** - Llamar endpoints de la API

## Ejemplos de comandos que puedes darle a Claude:

- "¿Qué contenedores tengo corriendo?"
- "Reinicia el backend"
- "Muestra los logs del frontend"
- "Lee el archivo backend/src/index.js"
- "Crea una nueva ruta GET en el backend"
- "Llama el endpoint /health"
- "¿Qué archivos hay en backend/src?"

## Notas importantes:

- El MCP server debe estar corriendo (ejecuta: `node C:\proyectos\reportes-box-rental\mcp-server.js`)
- Alternativamente, agrega el MCP a docker-compose.yml para que corra junto con los otros servicios
