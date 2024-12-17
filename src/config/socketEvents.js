const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  ONLINE_STATUS: 'online_status',
  ERROR: 'socket_error',
};

module.exports = SOCKET_EVENTS;
