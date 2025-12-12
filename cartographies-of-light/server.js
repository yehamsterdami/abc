

const express = require('express');
const https = require("https");
const fs = require("fs");
const app = express();
const portHTTPS = 3000;

app.use(express.static('public'));

const options = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
};

const HTTPSserver = https.createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(HTTPSserver);

// --- Data Structures ---
let sockets = {};        // socket.id -> { userId, name }
let users = {};          // userId -> socket.id
let players = {};        // userId -> { lat, lng, name }
let meetingPoints = [];  // { lat, lng, messages: [ { from, text } ] }

// Optional: persist meeting points
const DATA_PATH = "meeting-points.json";
try {
    const existingData = fs.readFileSync(DATA_PATH);
    meetingPoints = JSON.parse(existingData);
    console.log("Loaded meeting points:", meetingPoints);
} catch (err) {
    console.log("No existing meeting points found.");
}


io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    // --- Identify user ---
    socket.on("identify", ({ userId, name }) => {
        // Save socket info
        sockets[socket.id] = { userId, name };
        users[userId] = socket.id;

        // If returning user, preserve previous data; otherwise initialize
        if (!players[userId]) {
            players[userId] = { lat: 0, lng: 0, name };
        } else {
            // Update name if changed
            players[userId].name = name || players[userId].name;
        }

        // Send existing players to this client
        socket.emit("currentPlayers", players);

        // Send user's previous position and meeting points
        socket.emit("loadPlayerData", players[userId]);
        socket.emit("updateMeetingPoints", meetingPoints);

        console.log("Current online sockets:", sockets);
        console.log("Players:", players);
    });

    // --- Update player position ---
    socket.on("update_position", ({ userId, lat, lng }) => {
        if (!players[userId]) {
            players[userId] = { lat, lng, name: sockets[socket.id]?.name || "Unknown" };
        } else {
            players[userId].lat = lat;
            players[userId].lng = lng;
        }

        // Broadcast to other clients
        socket.broadcast.emit("playerMoved", {
            id: userId,
            lat,
            lng,
            name: players[userId].name
        });
    });

    // --- Add a meeting point ---
    socket.on("addMeetingPoint", ({ userId, lat, lng, message }) => {
        // Check if a meeting point exists nearby
        let mp = meetingPoints.find(
            p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001
        );
         
        io.emit("meetingTriggered", data);


        // Create new meeting point if needed
        if (!mp) {
            mp = { lat, lng, messages: [] };
            meetingPoints.push(mp);
        }

        // Add the message with the correct username
        mp.messages.push({
            from: players[userId]?.name || "Unknown",
            text: message || ""

        });

        // Persist meeting points
        fs.writeFileSync(DATA_PATH, JSON.stringify(meetingPoints, null, 2), "utf-8");

        // Broadcast updated meeting points to all clients
        io.emit("updateMeetingPoints", meetingPoints);
    });

    // --- Handle disconnect ---
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
        const me = sockets[socket.id];
        if (me) {
            delete sockets[socket.id];
            delete users[me.userId];
            // Keep player data so history is preserved
        }
    });
});

const PLAYERS_PATH = "players.json";

// After updating position:
fs.writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2), "utf-8");

// On server start:
try {
  const data = fs.readFileSync(PLAYERS_PATH);
  players = JSON.parse(data);
} catch (err) {
  console.log("No existing player data found.");
}



// --- Start HTTPS server ---
HTTPSserver.listen(portHTTPS, () => {
    console.log("HTTPS Server started at port", portHTTPS);
});
