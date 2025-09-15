const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../utils/db');
const { User } = require('../models/User');

async function testOfficerLogin() {
  await connectToDatabase();
  
  const email = 'officer@example.com';
  const password = 'password123';
  
  console.log('Looking for officer with email:', email);
  
  const user = await User.findOne({ email, role: 'officer' });
  if (!user) {
    console.log('❌ Officer not found');
    process.exit(1);
  }
  
  console.log('✅ Officer found:', {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  });
  
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    console.log('❌ Password does not match');
    process.exit(1);
  }
  
  console.log('✅ Password matches');
  console.log('✅ Officer login test successful');
  process.exit(0);
}

testOfficerLogin().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});