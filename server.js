import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(bodyParser.json());

const usersFilePath = path.join(__dirname, 'data', 'users.json');
const drawingsFilePath = path.join(__dirname, 'data', 'drawings.json');

const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
};

//for Get all users
app.get('/api/users', (req, res) => {
  const users = readJSON(usersFilePath);
  res.json(users);
});

// Add a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const users = readJSON(usersFilePath);
  const newUser = { id: Date.now(), username };
  users.push(newUser);
  writeJSON(usersFilePath, users);
  res.status(201).json(newUser);
});

//for Get all drawings
app.get('/api/drawings/:roomId', (req, res) => {
  const { roomId } = req.params;
  const drawings = readJSON(drawingsFilePath).filter(d => d.roomId === roomId);
  res.json(drawings);
});

// for Save a new drawing
app.post('/api/drawings', (req, res) => {
  const { roomId, drawingData } = req.body;
  if (!roomId || !drawingData) {
    return res.status(400).json({ error: 'roomId and drawingData are required' });
  }

  const drawings = readJSON(drawingsFilePath);
  const newDrawing = { id: Date.now(), roomId, drawingData };
  drawings.push(newDrawing);
  writeJSON(drawingsFilePath, drawings);
  res.status(201).json(newDrawing);
});

app.use(express.static(path.join(__dirname, 'public')));

let users = [];

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', ({ username, roomId }) => {
    const user = { id: socket.id, username, roomId };
    users.push(user);
    socket.join(roomId);

    io.to(roomId).emit('user-list', users.filter(u => u.roomId === roomId));
    io.to(roomId).emit('message', `${username} joined the room`);

    //drawing data
    socket.on('draw', (data) => {
      socket.to(data.roomId).emit('draw', data);
    });

    //chat message
    socket.on('chat-message', (message) => {
        io.to(roomId).emit('chat-message', message);
      });

    //user disconnect
    socket.on('disconnect', () => {
      users = users.filter((u) => u.id !== socket.id);
      io.to(roomId).emit('user-list', users.filter((u) => u.roomId === roomId));
      io.to(roomId).emit('message', `${user.username} left the room`);
      console.log('User disconnected');
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
