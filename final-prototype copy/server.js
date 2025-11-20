const express = require('express');
const https = require("https");
const fs = require("fs");
const multer = require('multer'); // 1. Include Multer for file uploads
const { v4: uuidv4 } = require('uuid'); // To generate unique filenames

const app = express();
const portHTTPS = 4300;

// --- Setup File Storage using Multer ---
const UPLOAD_DIR = 'uploads/';
// Create the uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR); // Store files in the 'uploads/' directory
    },
    filename: function (req, file, cb) {
        // Create a unique filename using UUID and the original extension
        const extension = file.originalname.split('.').pop();
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}.${extension}`);
    }
});

const upload = multer({ storage: storage });

// --- Express Middleware and Routing ---

// Returning to the client anything that is inside the public folder
app.use(express.static('public'));

// 2. New Route to Handle Image Upload
app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(`File uploaded successfully: ${req.file.filename}`);
    
    // In a real application, you would save this filename/path to a database
    // For this prototype, we just return the success.
    res.json({
        message: 'Image uploaded and saved!',
        filename: req.file.filename,
        path: `/${UPLOAD_DIR}${req.file.filename}`
    });
});

// Serve the uploaded files so the client can display them
app.use('/uploads', express.static(UPLOAD_DIR));


// --- HTTPS Server Setup ---

// Creating object of key and certificate for SSL
const options = {
    key: fs.readFileSync("keys-for-local-https/localhost-key.pem"),
    cert: fs.readFileSync("keys-for-local-https/localhost.pem"),
};

let HTTPSserver = https.createServer(options, app);

// --- Socket.IO Setup (Kept for future features) ---
const { Server } = require('socket.io');
const io = new Server(HTTPSserver);

let sockets = {};      // socket.id -> { userId, username }
let users = {};        // userId -> socket.id

// This is your chat/message handling logic, preserved here:
let messages = [];
let DATA_PATH = "chat-data.json";
try {
    let existingData = fs.readFileSync(DATA_PATH);
    messages = JSON.parse(existingData);
    console.log("loaded existing chat data");
} catch (err) { 
    console.log("no existing chat data");   
}

io.on('connection', (socket) => {
    // ... (Your existing Socket.IO connection logic) ...
    console.log('a user connected', socket.id);

    socket.on("identify", function(data){
        // ...
        sockets[socket.id] = {
            userId: data.userId,
            username: data.username
        };
        users[data.userId] = socket.id;
        socket.emit("chat-history", messages);
    })

    socket.on("message-from-client", function(data){
        // ...
        let message = {
            message: data.message,
            sender: sockets[socket.id]
        }
        messages.push(message);
        let stringifiedMessages = JSON.stringify(messages, null, 2);  
        fs.writeFileSync(DATA_PATH, stringifiedMessages, 'utf-8');
        io.emit("message-from-server", message);
    })

    socket.on("disconnect", function(){
        // ...
        let me =sockets[socket.id];
        if(me != undefined){        
            delete sockets[socket.id];
            delete users[me.userId];
        }
    });
});

// --- Start the Server ---
HTTPSserver.listen(portHTTPS, function () {
    console.log("HTTPS Server started at port", portHTTPS);
    console.log(`Access the prototype at https://localhost:${portHTTPS}`);
});