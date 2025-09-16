const { generateAIResponse } = require('../services/aiService');
const { Query } = require('../models/Query');
const plantDiseaseService = require('../services/plantDiseaseService');
const { generateDiseaseRecommendation } = require('../services/aiService');

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

    // Handle plant disease identification from image uploads
    socket.on('plant_image_upload', async ({ roomId, imageData, fileName }) => {
      try {
        console.log(`📸 Received plant image upload in room ${roomId}: ${fileName}`);
        
        // Show processing indicator
        io.to(roomId).emit('assistant_typing', { roomId });
        
        // Convert base64 image data to buffer
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Send initial message about processing
        io.to(roomId).emit('assistant_message', { 
          text: '📸 **Image Received!**\n\n🔍 Running advanced plant disease analysis...\n🤖 This may take a few moments for accurate results.'
        });
        
        // Identify plant disease
        const diseaseResult = await plantDiseaseService.identifyDisease(imageBuffer);
        
        // Format and send disease identification results
        const diseaseReport = plantDiseaseService.formatDiseaseReport(diseaseResult);
        io.to(roomId).emit('assistant_message', { 
          text: diseaseReport
        });
        
        // If disease was successfully identified, generate AI treatment recommendations
        if (diseaseResult.success) {
          io.to(roomId).emit('assistant_typing', { roomId });
          
          try {
            const treatmentRecommendation = await generateDiseaseRecommendation(diseaseResult);
            
            io.to(roomId).emit('assistant_message', { 
              text: `🩺 **AI Treatment Recommendations**\n\n${treatmentRecommendation}`
            });
            
            console.log(`✅ Sent complete disease analysis and treatment for room ${roomId}`);
            
          } catch (treatmentError) {
            console.error('❌ Error generating treatment recommendation:', treatmentError);
            io.to(roomId).emit('assistant_message', { 
              text: '⚠️ Disease identified but unable to generate treatment recommendations. Please consult with a local agricultural expert for treatment advice.'
            });
          }
        }

      } catch (error) {
        console.error('❌ Plant disease identification error:', error);
        io.to(roomId).emit('assistant_message', { 
          text: '❌ Sorry, I encountered an error analyzing your plant image. Please try again or consult with a local agricultural expert.'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });
}

module.exports = { initChatSockets };


