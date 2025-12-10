const express = require('express');
const https = require("https");
const fs = require("fs");
const app = express();
const portHTTPS = 3010;

// Utility function to calculate distance between two lat/lon points (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

app.use(express.static('public'));

// IMPORTANT: Ensure 'localhost-key.pem' and 'localhost.pem' exist in your server directory
const options = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
};

let HTTPSserver = https.createServer(options, app)

const { Server } = require('socket.io');
const io = new Server(HTTPSserver);

let players = {}; // Stores all connected players: {socketID: {lat, lon}}
// Game State: Global state of large cleared areas
let clearedAreas = []; // [{lat, lon, radiusMeters}] 
const MEETING_DISTANCE_METERS = 30; // Threshold for a meeting (must match client's MEETING_THRESHOLD)
const MEETING_CLEAR_RADIUS_METERS = 500; // 500 meters of area cleared upon meeting

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    players[socket.id] = { lat: 0, lon: 0 }; // Initialize player location

    // 1. Send the current global cleared areas to the new client upon connection
    socket.emit("clearedAreasFromServer", clearedAreas);
    
    // --- LOCATION HANDLING ---
    socket.on("locationFromClient", function(data) { 
        console.log(`got new location [${socket.id}]: Lat=${data.lat.toFixed(4)}, Lon=${data.lon.toFixed(4)}`);
        
        // 2. Update own player data on the server
        players[socket.id].lat = data.lat;
        players[socket.id].lon = data.lon;

        // 3. Broadcast own location to all other connected clients
        let locationInfo = {    
            socketID: socket.id,
            lat: data.lat,
            lon: data.lon
        };
        socket.broadcast.emit("locationFromServer", locationInfo);

    });
    
    // --- MEETING MECHANISM ---
    socket.on("meetingOccurred", function(data) {
        // Triggered by client, but validated and executed by server
        
        const playerA_ID = socket.id;
        const playerB_ID = data.otherID;
        const latA = players[playerA_ID]?.lat;
        const lonA = players[playerA_ID]?.lon;
        const latB = players[playerB_ID]?.lat;
        const lonB = players[playerB_ID]?.lon;
        
        // Server-side validation 
        if (latA && lonA && latB && lonB) {
            const distance = getDistance(latA, lonA, latB, lonB);
            
            if (distance <= MEETING_DISTANCE_METERS) {
                // Meeting confirmed! Clear a large area.
                console.log(`SERVER CONFIRMED MEETING between ${playerA_ID} and ${playerB_ID} (Distance: ${distance.toFixed(2)}m)`);
                
                // Calculate meeting center (midpoint)
                const centerLat = (latA + latB) / 2;
                const centerLon = (lonA + lonB) / 2;
                
                const newClearedArea = {
                    lat: centerLat,
                    lon: centerLon,
                    radiusMeters: MEETING_CLEAR_RADIUS_METERS
                };
                
                // Add to global state
                clearedAreas.push(newClearedArea);
                
                // Broadcast the new cleared area to ALL clients
                io.emit("newMeetingArea", newClearedArea); 
            }
        }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", function(){
        console.log("someone disconnected", socket.id)
        delete players[socket.id]; // Remove player from tracking list
    })

})


HTTPSserver.listen(portHTTPS, function () {
    console.log("✅ HTTPS Server started at port", portHTTPS);
});