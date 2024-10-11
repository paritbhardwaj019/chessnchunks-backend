const io = require('socket.io-client');

// Replace with the JWT token for User 2
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJjZjQwZmM4LTFkNTMtNDA2My1hOThiLTA3NzQ4YWU0MTY3MCIsInJvbGUiOiJTVFVERU5UIiwic3ViUm9sZSI6bnVsbCwiaWF0IjoxNzI4NTgyOTIwLCJleHAiOjE3MjkxODc3MjB9.Ln3Nxx5zdY2MFpWX0t627n2xXETOLzYgS_YvEtjWFLQ';

// Connect to the Socket.IO server
const socket = io('http://localhost:5000', {
  auth: {
    token: token,
  },
});

// Handle connection events
socket.on('connect', () => {
  console.log('User 2 connected to the server!');

  // Join a channel or perform other actions
  socket.emit('join_channel_request', { channelId: '123' });

  // Send a message to User 1
  socket.emit('send_message', { receiverId: 'f7b61cb7-ebd3-4a4b-9639-06d18f2c56b7', content: 'Hello from User 2!' });
});

// Listen for private messages
socket.on('new_message', (data) => {
  console.log('User 2 received a new message:', data);
});

// Handle connection errors
socket.on('connect_error', (err) => {
  console.error('User 2 connection error:', err.message);
});

// Handle disconnection events
socket.on('disconnect', () => {
  console.log('User 2 disconnected from the server');
});
