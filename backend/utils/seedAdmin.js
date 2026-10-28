const User = require('../models/User');

const seedInitialAdmin = async () => {
  try {
    const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@sunbirdsolar.com').trim().toLowerCase();
    const passwordHash =
      process.env.INITIAL_ADMIN_PASSWORD_HASH ||
      process.env.ADMIN_PASSWORD_HASH ||
      process.env.INITIAL_ADMIN_PASSWORD;

    if (!passwordHash) {
      console.warn('[Seed] Warning: No INITIAL_ADMIN_PASSWORD_HASH configured in .env.');
    }

    const adminExists = await User.findOne({ role: 'admin' }).select('+password');

    if (!adminExists) {
      const name = process.env.INITIAL_ADMIN_NAME || 'Sunbird Administrator';

      console.log(`[Seed] No administrator found. Creating initial admin: ${email}...`);

      const admin = await User.create({
        name,
        email,
        password: passwordHash || 'Admin@123',
        role: 'admin',
        phone: '+91 98765 43210',
        permissions: {
          leads: true,
          clients: true,
          projects: true,
          quotations: true,
          payments: true,
          materials: true,
          documents: true,
          warranty: true,
          commissions: true,
          reports: true,
          users: true,
        },
        isActive: true,
      });

      console.log(`[Seed] Initial Admin created securely. ID: ${admin._id} | Email: ${email}`);
    } else {
      // If admin exists and a specific password hash is provided in env, ensure DB stays in sync
      if (passwordHash && adminExists.password !== passwordHash) {
        adminExists.password = passwordHash;
        await adminExists.save();
        console.log(`[Seed] Admin password hash verified and synced for: ${adminExists.email}`);
      } else {
        console.log(`[Seed] Administrator account active and secured (${adminExists.email}).`);
      }
    }
  } catch (error) {
    console.error(`[Seed Error] Failed to seed initial admin: ${error.message}`);
  }
};

module.exports = seedInitialAdmin;
