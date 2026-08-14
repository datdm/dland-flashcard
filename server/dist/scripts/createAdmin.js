"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db"));
async function createAdmin() {
    const username = 'admin@dland.com';
    const password = 'admin123';
    try {
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Check if user already exists
        const checkUser = await db_1.default.query('SELECT id FROM users WHERE username = $1', [username]);
        if (checkUser.rows.length > 0) {
            // User exists, update to admin
            await db_1.default.query('UPDATE users SET is_admin = TRUE, password_hash = $1 WHERE username = $2', [passwordHash, username]);
            console.log(`✅ Updated existing user "${username}" to Admin.`);
        }
        else {
            // Create new admin user
            await db_1.default.query('INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, TRUE)', [username, passwordHash]);
            console.log(`✅ Created new Admin user "${username}" successfully.`);
        }
        console.log(`🔑 Username: ${username}`);
        console.log(`🔑 Password: ${password}`);
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
    finally {
        await db_1.default.end();
    }
}
createAdmin();
