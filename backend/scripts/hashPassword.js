/**
 * Small CLI helper: prints a bcrypt hash for a given plain-text password.
 * Useful for manually crafting seed data.
 * Usage: node scripts/hashPassword.js "MyPassword123"
 */
const bcrypt = require('bcrypt');

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node scripts/hashPassword.js <password>');
  process.exit(1);
}

bcrypt.hash(plain, 10).then((hash) => {
  console.log(hash);
});
