const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = {
    admin: 'admin123',
    doctor: 'doctor123',
    secretary: 'secretary123'
  };

  console.log('Password hashes for seed data:\n');
  
  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${role}: ${hash}`);
  }
}

generateHashes();
