// Generate bcrypt hash for Admin123!
const bcrypt = require('bcrypt');

const password = 'Admin123!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('\nGenerated hash for "Admin123!":');
    console.log(hash);
    console.log('\nUpdate your Supabase users table:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
});
