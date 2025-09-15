const { generateAIResponse } = require('../services/aiService');
const { Query } = require('../models/Query');

function initChatSockets(io) {
  io.on('connection', (socket) => {
    console.log('👋 User connected:', socket.id);

    // Join room per user/session  
    socket.on('join', ({ roomId }) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`🏠 User ${socket.id} joined room ${roomId}`);
        socket.emit('joined_room', { roomId });
      }
    });

    // Handle user messages (matches frontend expectation)
    socket.on('user_message', async ({ roomId, text, userId }) => {
      try {
        console.log(`💬 Received message in room ${roomId}: ${text.substring(0, 50)}...`);
        
        // Show typing indicator to all users in room
        io.to(roomId).emit('assistant_typing', { roomId });

        // Generate AI response using dedicated chat function
        const { generateChatResponse } = require('../services/aiService');
        
        try {
          const aiResponse = await generateChatResponse(text);
          
          // Send AI response to all users in room
          io.to(roomId).emit('assistant_message', { 
            text: aiResponse
          });
          
          console.log(`✅ Sent AI response to room ${roomId}`);
          
        } catch (aiError) {
          console.error('❌ Error generating AI response:', aiError);
          io.to(roomId).emit('assistant_message', { 
            text: 'Sorry, I encountered an error processing your message. Please try again.' 
          });
        }

      } catch (error) {
        console.error('❌ Chat error:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });
}

module.exports = { initChatSockets };


