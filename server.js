const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({ server });

const clients = new Map();

function broadcast(data) {
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

wss.on('connection', (ws) => {
  const clientId = generateClientId();
  let username = '';
  
  clients.set(clientId, ws);
  
  console.log(`New client connected. Total clients: ${clients.size}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          username = data.username;
          console.log(`User joined: ${username}`);
          
          broadcast({
            type: 'join',
            username: username
          });
          break;
          
        case 'message':
          console.log(`Message from ${data.username}: ${data.message}`);
          
          // Broadcast the message to all clients
          broadcast({
            type: 'message',
            username: data.username,
            message: data.message
          });
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected. Remaining clients: ${clients.size}`);
    
    if (username) {
      broadcast({
        type: 'leave',
        username: username
      });
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

function generateClientId() {
  return Math.random().toString(36).substring(2, 15);
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is listening on port ${PORT}`);
});