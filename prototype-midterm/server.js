const express = require('express');
const path = require('path');

const http = require("http");
const https = require("https");
// to read certificates from the filesystem (fs)
const fs = require("fs");
const { Server } = require("socket.io");

const app = express(); // the server "app", the server behaviour

// returning to the client anything that is
// inside the public folder
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));


// to unpack json
// const bodyParser = require('body-parser')//add this
// app.use(bodyParser.json())


// Creating object of key and certificate
// for SSL
const options = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
};

const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer);

// Creating servers and make them listen at their ports:
// http.createServer(app).listen(portHTTP, function (req, res) {
//     console.log("HTTP Server started at port", portHTTP);
// });


// http.createServer(app).listen(portHTTP, function (req, res) {
//     console.log("HTTP Server started at port", portHTTP);
// });

const PORT = 3000;
httpsServer.listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});



let bgPlaying = false;

io.on("connection", (socket) => {
  console.log("📱 A device connected:", socket.id);


  socket.on("orientation90", (data) => {
    console.log("Orientation Trigger from", socket.id);
    console.log("→ α:", data.alpha.toFixed(1), "β:", data.beta.toFixed(1), "γ:", data.gamma.toFixed(1));
  });
  
  socket.on("playerJoin", () => {
    console.log("Player joined:", socket.id);
    if (!bgPlaying) {
      bgPlaying = true;
      io.emit("playBackground"); 
      console.log("Background audio triggered");
    }
  });

 socket.on("acceleration", (data) => {
  if (!data) return;
  const acc = data.magnitude || data.totalAcc || 0;
  console.log(`acceleration from ${socket.id}: ${acc.toFixed(2)}`);
});

  socket.on("motionSound", (data) => {
    console.log("Motion Trigger from", socket.id);
    console.log("→ File:", data.file, "| Acceleration:", data.acc.toFixed(2));
      io.emit("viewerFlash", data);

  });

  socket.on("viewerFlash", (data) => {
  console.log("✨ Received flash signal:", data);
  triggerFlash(data.acc);
});
  
// socket.on("touchMove", (data) => {
//     console.log("📩 touchMove from player:", data);
//     io.emit("viewerEffect", data); // 广播给 viewer
//   });

//   socket.on("touchEnd", (data) => {
//     console.log("📩 touchEnd:", data);
//     io.emit("viewerClear", data);
//   });

  socket.on("disconnect", () => {
    console.log("Device disconnected:", socket.id);
  });
});


// io.on("connection", (socket) => {
//   console.log("a user connected", socket.id);

//   socket.on("orientation90", (data) => {
//     console.log("orientation 90 from", socket.id, ":", data);
//     // io.emit("orientation90", data); // broadcast to all clients including sender
//   });

//   socket.on("motionSound", (data) => {
//     console.log("motion sound from", socket.id, ":", data);
//   });

//   socket.on("playSound", (data) => {
//     console.log("play sound from", socket.id, ":", data);
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected", socket.id);
//   });

// });

