const express = require('express');

const https = require("https");
// to read certificates from the filesystem (fs)
const fs = require("fs");
const app = express(); // the server "app", the server behaviour
const portHTTPS = 3010; // YOUR port

const users = {};

// returning to the client anything that is
// inside the public folder
app.use(express.static('public'));


// Creating object of key and certificate
// for SSL
const options = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
};

let HTTPSserver = https.createServer(options, app)


const { Server } = require('socket.io'); // include library
const io = new Server(HTTPSserver); // start socket io 

let currentlyConntected = []; //list of socket IDs of copnnected clients

function computeCentroid(flagList) {
    if (flagList.length === 0) return null;
    if (flagList.length === 1) return flagList[0];

    let X=0, Y=0, Z=0;

    flagList.forEach(f => {
        let latRad = f.lat * Math.PI/180;
        let lngRad = f.lng * Math.PI/180;

        X += Math.cos(latRad) * Math.cos(lngRad);
        Y += Math.cos(latRad) * Math.sin(lngRad);
        Z += Math.sin(latRad);
    });

    X /= flagList.length;
    Y /= flagList.length;
    Z /= flagList.length;

    let lng = Math.atan2(Y, X);
    let hyp = Math.sqrt(X*X + Y*Y);
    let lat = Math.atan2(Z, hyp);

    return { lat: lat * 180/Math.PI, lng: lng * 180/Math.PI };
}


io.on('connection', (socket) => {

    console.log('a user connected', socket.id);
    users[socket.id] = { lat: null, lon: null, flag: null };

    socket.emit("allFlagsUpdate", users);

    currentlyConntected.push(socket.id);
    
    socket.on("locationFromClient", function(data) {
        console.log("got new location", socket.id, data);

        // store it on server
        users[socket.id].lat = data.lat;
        users[socket.id].lon = data.lon;

        // broadcast to others
        socket.broadcast.emit("locationFromServer", {
            socketID: socket.id,
            lat: data.lat,
            lon: data.lon
        });
    });


    socket.on("myFlagUpdate", (flagData) => {
        console.log("got new flag from", socket.id, flagData);

        // store it on server
        users[socket.id].flag = {
            lat: flagData.lat,
            lng: flagData.lng,
        };
        // extract all flags
        const flagList = Object.values(users)
            .filter(u => u.flag != null)
            .map(u => u.flag);

        const midpoint = computeCentroid(flagList);

        // send everything to all clients
        io.emit("allFlagsUpdate", users);
        io.emit("midpointUpdate", midpoint);
    });


    // DISCONNECT
    socket.on("disconnect", function(){
        console.log("someone disconnected", socket.id)
        delete users[socket.id];
        io.emit("allFlagsUpdate", users);

        // delete socket ID from the global array
        // that keeps track of all connected clients 
        let idx = currentlyConntected.findIndex(id => id === socket.id);
        if(idx > -1){
            currentlyConntected.splice(idx, 1);
            console.log(currentlyConntected);

        }
    })

})



// additional express server endpoints could be made here:



// Creating https server by passing
// options and app object
HTTPSserver.listen(portHTTPS, function (req, res) {
    console.log("HTTPS Server started at port", portHTTPS);
});





