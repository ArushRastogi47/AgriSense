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
    socket.on('user_message', async ({ roomId, text, userId, language = 'en' }) => {
      try {
        console.log(`💬 Received message in room ${roomId} (${language}): ${text.substring(0, 50)}...`);
        
        // Show typing indicator to all users in room
        io.to(roomId).emit('assistant_typing', { roomId });

        // Generate AI response using dedicated chat function
        const { generateChatResponse } = require('../services/aiService');
        
        try {
          const aiResponse = await generateChatResponse(text, language);
          
          // Send AI response to all users in room
          io.to(roomId).emit('assistant_message', { 
            text: aiResponse
          });
          
          console.log(`✅ Sent AI response to room ${roomId} in ${language}`);
          
        } catch (aiError) {
          console.error('❌ Error generating AI response:', aiError);
          const errorMessage = language === 'ml' 
            ? 'ക്ഷമിക്കണം, നിങ്ങളുടെ സന്ദേശം പ്രോസസ്സ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
            : 'Sorry, I encountered an error processing your message. Please try again.';
          io.to(roomId).emit('assistant_message', { 
            text: errorMessage
          });
        }

      } catch (error) {
        console.error('❌ Chat error:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle plant disease identification from image uploads
    socket.on('plant_image_upload', async ({ roomId, imageData, fileName, language = 'en' }) => {
      try {
        console.log(`📸 Received plant image upload in room ${roomId} (${language}): ${fileName}`);
        
        // Show processing indicator
        io.to(roomId).emit('assistant_typing', { roomId });
        
        // Convert base64 image data to buffer
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Send initial message about processing (language-specific)
        const processingMessage = language === 'ml' 
          ? '📸 **ചിത്രം ലഭിച്ചു!**\n\n🔍 വിപുലമായ സസ്യ രോഗ വിശകലനം നടത്തുന്നു...\n🤖 കൃത്യമായ ഫലങ്ങൾക്കായി ഇത് കുറച്ച് സമയമെടുത്തേക്കാം.'
          : '📸 **Image Received!**\n\n🔍 Running advanced plant disease analysis...\n🤖 This may take a few moments for accurate results.';
        
        io.to(roomId).emit('assistant_message', { 
          text: processingMessage
        });
        
        // Identify plant disease
        const diseaseResult = await plantDiseaseService.identifyDisease(imageBuffer);
        
        // Format and send disease identification results (with language support)
        const diseaseReport = await plantDiseaseService.formatDiseaseReport(diseaseResult, language);
        io.to(roomId).emit('assistant_message', { 
          text: diseaseReport
        });
        
        // If disease was successfully identified, generate AI treatment recommendations
        if (diseaseResult.success) {
          io.to(roomId).emit('assistant_typing', { roomId });
          
          try {
            const treatmentRecommendation = await generateDiseaseRecommendation(diseaseResult, language);
            
            const treatmentTitle = language === 'ml' 
              ? '🩺 **AI ചികിത്സ ശുപാർശകൾ**'
              : '🩺 **AI Treatment Recommendations**';
            
            io.to(roomId).emit('assistant_message', { 
              text: `${treatmentTitle}\n\n${treatmentRecommendation}`
            });
            
            console.log(`✅ Sent complete disease analysis and treatment for room ${roomId} in ${language}`);
            
          } catch (treatmentError) {
            console.error('❌ Error generating treatment recommendation:', treatmentError);
            const treatmentErrorMessage = language === 'ml' 
              ? '⚠️ രോഗം തിരിച്ചറിഞ്ഞെങ്കിലും ചികിത്സ ശുപാർശകൾ സൃഷ്ടിക്കാൻ കഴിഞ്ഞില്ല. ചികിത്സയ്ക്കുള്ള ഉപദേശത്തിനായി പ്രാദേശിക കൃഷി വിദഗ്ധനെ സമീപിക്കുക.'
              : '⚠️ Disease identified but unable to generate treatment recommendations. Please consult with a local agricultural expert for treatment advice.';
            io.to(roomId).emit('assistant_message', { 
              text: treatmentErrorMessage
            });
          }
        }

      } catch (error) {
        console.error('❌ Plant disease identification error:', error);
        const errorMessage = language === 'ml' 
          ? '❌ ക്ഷമിക്കണം, നിങ്ങളുടെ സസ്യ ചിത്രം വിശകലനം ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ പ്രാദേശിക കൃഷി വിദഗ്ധനെ സമീപിക്കുക.'
          : '❌ Sorry, I encountered an error analyzing your plant image. Please try again or consult with a local agricultural expert.';
        io.to(roomId).emit('assistant_message', { 
          text: errorMessage
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
    });
  });
}

module.exports = { initChatSockets };


