function initChatSockets(io) {
  io.on('connection', (socket) => {
    // Join room per user/session
    socket.on('join', ({ roomId }) => {
      if (roomId) socket.join(roomId);
    });

    socket.on('user_message', async ({ roomId, text }) => {
      // Echo/placeholder: broadcast to room; controller will actually generate response
      io.to(roomId).emit('assistant_typing', { roomId });
      io.to(roomId).emit('user_message', { roomId, text });
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { initChatSockets };


