"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
async function run() {
    try {
        await (0, db_1.runMigrations)();
        console.log('✅ Migrations executed successfully.');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
}
run();
