const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../utils/db');
const { User } = require('../models/User');

async function main() {
  await connectToDatabase();
  const email = process.env.SEED_OFFICER_EMAIL || 'officer@example.com';
  const password = process.env.SEED_OFFICER_PASSWORD || 'password123';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Officer already exists:', email);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name: 'Officer', email, passwordHash, role: 'officer' });
  console.log('Created officer user:', email);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });


