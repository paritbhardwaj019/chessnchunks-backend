const { httpServer, io } = require('../index'); // Use httpServer and io from the server
const ioClient = require('socket.io-client');

let clientSocket;

beforeEach((done) => {
  // Connect client to the Socket.IO server
  clientSocket = ioClient(`http://localhost:${process.env.PORT || 5000}`, {
    reconnectionDelay: 0,
    forceNew: true,
    transports: ['websocket'],
  });

  // Listen for a successful connection
  clientSocket.on('connect', () => {
    done();
  });

  // Handle connection errors
  clientSocket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
});

afterEach((done) => {
  if (clientSocket.connected) {
    clientSocket.disconnect();
  }
  // Close the server to prevent open handles after each test
  httpServer.close(done);
});

describe('Socket.IO Communication', () => {
  it('should receive a broadcast message from the coach', (done) => {
    const messageData = {
      senderId: 'coach-1',
      batchId: 'batch-1',
      content: 'Practice this puzzle!',
    };

    // Listen for the 'new_message' event on the client side
    clientSocket.on('new_message', (msg) => {
      // Ensure the content of the message is as expected
      expect(msg.content).toBe(messageData.content);
      done(); // Call done to finish the test
    });

    // Simulate coach sending a broadcast message on the server side
    io.emit('new_message', messageData); // Emit the message using the actual Socket.IO server instance
  }, 10000); // Increase timeout to 10 seconds
});
