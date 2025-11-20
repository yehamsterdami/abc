const express = require('express');
const https = require("https");
const fs = require("fs");

const app = express();
const portHTTPS = 4200;

// Serve static files from /public
app.use(express.static('public'));

// For reading JSON posts (if needed later)
app.use(express.json({ limit: "50mb" }));

// SSL certificates
const options = {
    key: fs.readFileSync("keys-for-local-https/localhost-key.pem"),
    cert: fs.readFileSync("keys-for-local-https/localhost.pem"),
};

let HTTPSserver = https.createServer(options, app);

// ----------------------------------------
// Socket.io setup
// ----------------------------------------
const { Server } = require('socket.io');
const io = new Server(HTTPSserver);

// socket.id -> { userId, username }
let sockets = {};
// userId -> socket.id
let users = {};

// ----------------------------------------
// MEMORY DATA (persistent, like chat example)
// ----------------------------------------
let DATA_PATH = "memories.json";
let memories = [];

// Load existing memories from file, like chat history
try {
    let file = fs.readFileSync(DATA_PATH, "utf-8");
    memories = JSON.parse(file);
    console.log("Loaded existing memory data:", memories.length, "items");
} catch (err) {
    console.log("No existing memories.json found");
}

// ----------------------------------------
// WebSocket Handlers
// ----------------------------------------
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // IDENTIFY USER (same pattern as class)
    socket.on("identify", function(data) {
        console.log("identify:", data);

        sockets[socket.id] = {
            userId: data.userId,
            username: data.username
        };

        users[data.userId] = socket.id;

        console.log("online sockets", sockets);
        console.log("online users", users);

        // Send existing persisted memories to this user
        socket.emit("memory-history", memories);
    });

    // Handle username change
    socket.on("name-change", function(data) {
        if (sockets[socket.id]) {
            sockets[socket.id].username = data.newUsername;
        }
    });

    // ----------------------------------------------------
    // RECEIVE MEMORY FROM CLIENT
    // (like message-from-client in chat)
    // data = { image: base64string, timestamp: number }
    // ----------------------------------------------------
    socket.on("memory-from-client", function(data) {
        console.log("Received memory", data.timestamp);

        let memory = {
            image: data.image,
            timestamp: data.timestamp,
            sender: sockets[socket.id] || null
        };

        memories.push(memory);

        // Save to persistent file
        let written = JSON.stringify(memories, null, 2);
        fs.writeFileSync(DATA_PATH, written, "utf-8");

        // Broadcast to all clients
        io.emit("memory-from-server", memory);
    });

    // Cleanup when user disconnects
    socket.on("disconnect", function() {
        console.log("Disconnected:", socket.id);

        let me = sockets[socket.id];
        if (me !== undefined) {
            delete sockets[socket.id];
            delete users[me.userId];
        }

        console.log("online socket", sockets);
        console.log("online users", users);
    });
});

// ----------------------------------------
// Start HTTPS server
// ----------------------------------------
HTTPSserver.listen(portHTTPS, function() {
    console.log("HTTPS Server started at port", portHTTPS);
});
