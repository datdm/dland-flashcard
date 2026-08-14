"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const ws_1 = require("ws");
const db_1 = __importStar(require("./db"));
const auth_1 = __importDefault(require("./routes/auth"));
const sync_1 = __importDefault(require("./routes/sync"));
const backup_1 = __importDefault(require("./routes/backup"));
const vocab_1 = __importDefault(require("./routes/vocab"));
const data_1 = __importDefault(require("./routes/data"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/sync', sync_1.default);
app.use('/api/backup', backup_1.default);
app.use('/api/vocab', vocab_1.default);
app.use('/api/data', data_1.default);
app.use('/api/admin', admin_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
async function ensureDefaultAdmin() {
    const username = 'admin@dland.com';
    const password = 'admin123';
    try {
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Check if user already exists
        const checkUser = await db_1.default.query('SELECT id FROM users WHERE username = $1', [username]);
        if (checkUser.rows.length > 0) {
            // User exists, update to admin
            await db_1.default.query('UPDATE users SET is_admin = TRUE WHERE username = $1', [username]);
            console.log(`👤 Verified admin status for "${username}"`);
        }
        else {
            // Create new admin user
            await db_1.default.query('INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, TRUE)', [username, passwordHash]);
            console.log(`👤 Created default Admin user "${username}" successfully.`);
        }
    }
    catch (error) {
        console.error('❌ Failed to ensure default admin user:', error);
    }
}
// Start server
async function start() {
    try {
        // Run database migrations
        console.log('🔄 Running database migrations...');
        await (0, db_1.runMigrations)();
        // Ensure default admin user exists
        console.log('👤 Ensuring default admin user...');
        await ensureDefaultAdmin();
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
        // Initialize WebSocket server for Gemini Multimodal Live API proxy
        const wss = new ws_1.WebSocketServer({ noServer: true });
        wss.on('connection', (ws, request) => {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error('❌ GEMINI_API_KEY is not defined in environment variables');
                ws.close(1011, 'GEMINI_API_KEY is not configured on the server');
                return;
            }
            console.log('🔌 Client WebSocket connected. Establishing connection to Gemini Live...');
            // Connect to Gemini Multimodal Live API (v1alpha version)
            const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
            const geminiWs = new ws_1.WebSocket(geminiUrl);
            geminiWs.on('open', () => {
                console.log('✅ Connected to Gemini Live API');
            });
            // Forward client message to Gemini
            ws.on('message', (message, isBinary) => {
                if (geminiWs.readyState === ws_1.WebSocket.OPEN) {
                    geminiWs.send(message, { binary: isBinary });
                }
            });
            // Forward Gemini message back to client
            geminiWs.on('message', (message, isBinary) => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(message, { binary: isBinary });
                }
            });
            ws.on('close', () => {
                console.log('🔌 Client WebSocket disconnected');
                geminiWs.close();
            });
            geminiWs.on('close', (code, reason) => {
                console.log(`🔌 Gemini Live API disconnected. Code: ${code}, Reason: ${reason}`);
                ws.close(1000, 'Gemini connection closed');
            });
            ws.on('error', (error) => {
                console.error('❌ Client WS error:', error);
                geminiWs.close();
            });
            geminiWs.on('error', (error) => {
                console.error('❌ Gemini WS error:', error);
                ws.close();
            });
        });
        // Hook server upgrade event to capture /api/live WebSocket requests
        server.on('upgrade', (request, socket, head) => {
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            if (url.pathname === '/api/live') {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
