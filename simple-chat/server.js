const fs = require("fs");
const https = require("https");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
app.use(express.static("public"));

const options = {
  key: fs.readFileSync("keys/localhost-key.pem"),
  cert: fs.readFileSync("keys/localhost.pem"),
};

const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  // default: chill
  socket.join("chill");

  // join room
  socket.on("joinRoom", (room) => {
    socket.leaveAll();
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  // receive message from client
  socket.on("message", (data) => {
    console.log("msg from", data.name, ":", data.msg, "in", data.room);
    io.to(data.room).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

const songButtons = document.querySelectorAll(".song-btn");

// song button
songButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const song = btn.dataset.song;
    const data = {
      name: "🎵 System",
      msg: `Now playing: ${song}`,
      room: currentRoom
    };

    socket.emit("message", data);
  });
});


const PORT = 4300;
httpsServer.listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});


// const express = require('express');
// const http = require("http");
// const https = require("https");
// // to read certificates from the filesystem (fs)
// const fs = require("fs");

// const app = express(); // the server "app", the server behaviour
// // const portHTTP = 3000; // port for http
// const portHTTPS = 3001; // port for https

// // returning to the client anything that is
// // inside the public folder
// app.use(express.static('public'));


// // Creating object of key and certificate
// // for SSL
// const options = {
//     key: fs.readFileSync("keys-for-local-https/localhost-key.pem"),
//     cert: fs.readFileSync("keys-for-local-https/localhost.pem"),
// };

// const HTTPSserver = https.createServer(options, app);

// const { Server } = require("socket.io");
// const io = new Server(HTTPSserver);

// io.on('connection', (socket) => {
//     console.log('a user connected', socket.id);

//       socket.join("chill");


//     socket.on("joinRoom", (room) => {
//     socket.leaveAll();
//     socket.join(room);
//     console.log(`${socket.id} joined ${room}`);
//   });

//   socket.on("message", (data) => {
//     console.log("msg from", data.name, ":", data.msg, "in", data.room);
//     io.to(data.room).emit("message", data); 
//   });

//   socket.on('disconnect', () => {
//     console.log('user disconnected', socket.id);
//   });
// });

// // Creating servers and make them listen at their ports:
// // http.createServer(app).listen(portHTTP, function (req, res) {
// //     console.log("HTTP Server started at port", portHTTP);
// // });
// HTTPSserver.listen(portHTTPS, function (req, res) {
//     console.log("HTTPS Server started at port", portHTTPS);

   
// });





