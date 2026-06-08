#!/usr/bin/env node

/**
 * MCP Server para Reportes Box Rental
 * Permite a Claude controlar Docker y acceder al proyecto
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const PROJECT_PATH = 'C:\\proyectos\\reportes-box-rental';

// Herramientas disponibles para Claude
const tools = [
  {
    name: 'docker_status',
    description: 'Ver estado de los contenedores (ps, logs, recursos)',
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          enum: ['backend', 'frontend', 'all'],
          description: 'Servicio a consultar'
        },
        logs: {
          type: 'boolean',
          description: 'Mostrar últimas líneas de logs'
        }
      }
    }
  },
  {
    name: 'docker_control',
    description: 'Controlar contenedores (start, stop, restart, rebuild)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['up', 'down', 'restart', 'rebuild'],
          description: 'Acción a ejecutar'
        },
        service: {
          type: 'string',
          enum: ['backend', 'frontend', 'all'],
          description: 'Servicio afectado'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'read_file',
    description: 'Leer archivos del proyecto',
    inputSchema: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'Ruta del archivo relativa al proyecto (ej: backend/src/index.js)'
        }
      },
      required: ['filepath']
    }
  },
  {
    name: 'write_file',
    description: 'Escribir o actualizar archivos del proyecto',
    inputSchema: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'Ruta del archivo relativa al proyecto'
        },
        content: {
          type: 'string',
          description: 'Contenido del archivo'
        }
      },
      required: ['filepath', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'Listar archivos y directorios',
    inputSchema: {
      type: 'object',
      properties: {
        dirpath: {
          type: 'string',
          description: 'Ruta del directorio (ej: backend/src) - vacío para raíz'
        }
      }
    }
  },
  {
    name: 'exec_command',
    description: 'Ejecutar comando en el contenedor backend',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Comando a ejecutar dentro del contenedor'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'api_call',
    description: 'Llamar endpoints de la API (localhost:3000)',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Método HTTP'
        },
        endpoint: {
          type: 'string',
          description: 'Ruta del endpoint (ej: /health, /api/usuarios)'
        },
        body: {
          type: 'object',
          description: 'Body para POST/PUT'
        }
      },
      required: ['method', 'endpoint']
    }
  }
];

// Ejecutar herramientas
function executeTool(toolName, input) {
  try {
    switch (toolName) {
      case 'docker_status':
        return dockerStatus(input);
      case 'docker_control':
        return dockerControl(input);
      case 'read_file':
        return readFile(input);
      case 'write_file':
        return writeFile(input);
      case 'list_directory':
        return listDirectory(input);
      case 'exec_command':
        return execCommand(input);
      case 'api_call':
        return apiCall(input);
      default:
        return { error: `Herramienta desconocida: ${toolName}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

function dockerStatus(input) {
  const { service = 'all', logs = false } = input;
  
  try {
    let output = '';
    
    // Estado de contenedores
    output += execSync('docker compose ps', { 
      cwd: PROJECT_PATH,
      encoding: 'utf-8'
    });
    
    if (logs) {
      output += '\n=== LOGS ===\n';
      if (service === 'all' || service === 'backend') {
        output += '--- BACKEND ---\n';
        output += execSync('docker compose logs backend --tail 10', {
          cwd: PROJECT_PATH,
          encoding: 'utf-8'
        });
      }
      if (service === 'all' || service === 'frontend') {
        output += '\n--- FRONTEND ---\n';
        output += execSync('docker compose logs frontend --tail 10', {
          cwd: PROJECT_PATH,
          encoding: 'utf-8'
        });
      }
    }
    
    return { status: 'success', output };
  } catch (error) {
    return { error: error.message };
  }
}

function dockerControl(input) {
  const { action, service = 'all' } = input;
  
  try {
    let cmd = `docker compose ${action}`;
    if (service !== 'all') {
      cmd += ` ${service}`;
    }
    
    const output = execSync(cmd, {
      cwd: PROJECT_PATH,
      encoding: 'utf-8'
    });
    
    return { status: 'success', action, output };
  } catch (error) {
    return { error: error.message };
  }
}

function readFile(input) {
  const { filepath } = input;
  const fullPath = path.join(PROJECT_PATH, filepath);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { status: 'success', filepath, content };
  } catch (error) {
    return { error: error.message };
  }
}

function writeFile(input) {
  const { filepath, content } = input;
  const fullPath = path.join(PROJECT_PATH, filepath);
  
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    return { status: 'success', filepath, message: 'Archivo escrito' };
  } catch (error) {
    return { error: error.message };
  }
}

function listDirectory(input) {
  const { dirpath = '' } = input;
  const fullPath = path.join(PROJECT_PATH, dirpath);
  
  try {
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const list = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file'
    }));
    
    return { status: 'success', path: dirpath || 'raíz', items: list };
  } catch (error) {
    return { error: error.message };
  }
}

function execCommand(input) {
  const { command } = input;
  
  try {
    const output = execSync(`docker exec reportes-box-rental-backend-1 sh -c "${command}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return { status: 'success', command, output };
  } catch (error) {
    return { error: error.message };
  }
}

function apiCall(input) {
  const { method, endpoint, body } = input;
  
  return new Promise((resolve) => {
    const url = new URL(`http://localhost:3000${endpoint}`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: 'success',
            method,
            endpoint,
            statusCode: res.statusCode,
            response: JSON.parse(data)
          });
        } catch {
          resolve({
            status: 'success',
            method,
            endpoint,
            statusCode: res.statusCode,
            response: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Servidor MCP
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/tools' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ tools }));
    return;
  }
  
  if (req.url === '/call' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { tool, input } = JSON.parse(body);
        const result = await executeTool(tool, input);
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.MCP_PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCP Server escuchando en puerto ${PORT}`);
  console.log('Herramientas disponibles:');
  tools.forEach(t => console.log(`  - ${t.name}`));
});
