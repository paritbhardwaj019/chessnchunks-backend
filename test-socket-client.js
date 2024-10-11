// test-socket-client.js

const io = require('socket.io-client');

// Replace this with the actual token you get from your backend authentication system
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3YjYxY2I3LWViZDMtNGE0Yi05NjM5LTA2ZDE4ZjJjNTZiNyIsInJvbGUiOiJTVFVERU5UIiwic3ViUm9sZSI6bnVsbCwiaWF0IjoxNzI4NTc4MjM4LCJleHAiOjE3MjkxODMwMzh9.gBjBS7RI4r69Ft1SWbDr7bXgTnpUfVLFmuCoXE36HeA';

// Connect to the Socket.IO server
const socket = io('http://localhost:5000', {
  auth: {
    token: token, // Pass the token to the server for authentication
  },
});

// Handle connection events
socket.on('connect', () => {
  console.log('Successfully connected to the server!');

  // Join a channel, for example
  socket.emit('join_channel_request', { channelId: '123' });
});

// Listen for broadcast messages
socket.on('broadcast_message', (data) => {
  console.log('Received a broadcast message:', data);
});

// Listen for private messages
socket.on('new_message', (data) => {
  console.log('Received a new message:', data);
});

// Handle connection errors
socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

// Handle disconnection events
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Optionally, send a message after connecting
socket.on('connect', () => {
  socket.emit('send_message', { receiverId: 'bcf40fc8-1d53-4063-a98b-07748ae41670', content: 'Hello, world!' });
});
