const express = require('express');
const https = require("https");
const fs = require("fs");
const app = express();
const portHTTPS = 4260;
app.use(express.static('public'));

const options = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};
let HTTPSserver = https.createServer(options, app);
const { Server } = require('socket.io');
const io = new Server(HTTPSserver);

let players = {};
let territories = {};

// territory is moved entirely to the server script
const territoriesData = [
  {
    name: "campus",
    corners: [
      { lat: 31.149304, lon: 121.480687 },
      { lat: 31.148068, lon: 121.480928 },
      { lat: 31.148615, lon: 121.482405 },
      { lat: 31.149570, lon: 121.482198 }
    ],
    trigger: { lat: 31.148769, lon: 121.481580 },
    triggerRadius: 0.00018
  },
  {
    name: "apt_north",
    corners: [
      { lat: 31.150568, lon: 121.480325 },
      { lat: 31.149600, lon: 121.480743 },
      { lat: 31.149880, lon: 121.482138 },
      { lat: 31.150798, lon: 121.48194 }
    ],
    trigger: { lat: 31.150045, lon: 121.481865 },
    triggerRadius: 0.00018
  },
 
     {
    name: "lawn",
    corners: [
      { lat: 31.147814, lon: 121.481033 }, // top left
      { lat: 31.147437, lon: 121.481205 }, // bottom left
      { lat: 31.147492, lon: 121.482514 }, // bottom right
      { lat: 31.148273, lon: 121.482288 }  // top right
    ],
    trigger: { lat: 31.147768, lon: 121.481848},
    triggerRadius: 0.00018,
  },

       {
    name: "cstore_apts",
    corners: [
      { lat: 31.150697, lon: 121.482095 }, // top left
      { lat: 31.149935, lon: 121.482278 }, // bottom left
      { lat: 31.150210, lon: 121.483565 }, // bottom right
      { lat: 31.150913, lon: 121.483286 }  // top right
    ],
    trigger: { lat: 31.150224, lon: 121.483034},
    triggerRadius: 0.00018,
  },

{
  name:"metro",
  corners:[
    {lat: 31.151473, lon:121.481548},
    {lat:31.150995, lon:121.481612},
    {lat:31.151096, lon:121.482186},
    {lat:31.151542, lon:121.482101}
  ],
  trigger: {lat:31.151257, lon:121.481865},
  triggerRadius: 0.00018,
 
},

{
  name:"metro_west",
  corners:[
    {lat: 31.151285, lon:121.480373},
    {lat: 31.150848, lon:121.480470},
    {lat:31.151009, lon:121.481500},
    {lat:31.151436, lon:121.481387}
  ],
  trigger: {lat:31.150917, lon:121.480985},
  triggerRadius: 0.00018,

},

{
  name: "campus_east",
  corners:[
    {lat:31.149441, lon:121.482487},
    {lat:31.149150, lon:121.482492},
    {lat:31.149200, lon:121.483168},
    {lat:31.149503, lon:121.483120}
  ],
  trigger:{lat:31.149421, lon:121.482675},
  triggerRadius: 0.00018,
 
},

{
  name: "west_apt",
  corners:[
    {lat:31.148897, lon:121.479290}, //top left
    {lat:31.147759, lon:121.479526}, // bottom left
    {lat:31.147924, lon:121.480566}, //bottom right
    {lat:31.149076, lon:121.480246} //top right
  ],
  trigger:{lat:31.148957, lon:121.479987},
  triggerRadius: 0.00018,


},

{
  name: "west_apt2",
  corners:[
    {lat:31.150210, lon:121.479134}, //top left
    {lat:31.149393, lon:121.479359}, // bottom left
    {lat:31.149678, lon:121.480304}, //bottom right
    {lat:31.150458, lon:121.480035} //top right
  ],
  trigger:{lat:31.149632, lon:121.480116},
  triggerRadius: 0.00018,
 
},
{
  name: "east2",
  corners:[
    {lat:31.148994, lon:121.482621}, //top left
    {lat:31.148732, lon:121.482605}, // bottom left
    {lat:31.148833, lon:121.483302}, //bottom right
    {lat:31.149099, lon:121.483297} //top right
  ],
  trigger:{lat:31.148865, lon:121.482573},
  triggerRadius: 0.00018,

},
{
  name: "idk",
  corners:[
    {lat:31.153176, lon:121.480658}, //top left
    {lat:31.151753, lon:121.480443}, // bottom left
    {lat:31.152056, lon:121.482760}, //bottom right
    {lat:31.152616, lon:121.482717} //top right
  ],
  trigger:{lat:31.152763, lon:121.481194},
  triggerRadius: 0.00018,
 
},
{
  name: "idk_second",
  corners:[
    {lat:31.154526, lon:121.481634}, //top left
    {lat:31.153305, lon:121.480840}, // bottom left
    {lat:31.152781, lon:121.482632}, //bottom right
    {lat:31.153901, lon:121.482245} //top right
  ],
  trigger:{lat:31.153764, lon:121.481612},
  triggerRadius: 0.00018,

},
{
  name: "idk_third",
  corners:[
    {lat:31.156243, lon:121.477010}, //top left
    {lat:31.153929, lon:121.476259}, // bottom left
    {lat:31.152974, lon:121.479971}, //bottom right
    {lat:31.155306, lon:121.481022} //top right
  ],
  trigger:{lat:31.153396, lon:121.479756},
  triggerRadius: 0.00018,

},
{
  name: "idk_fourth",
  corners:[
    {lat:31.151826, lon:121.478662}, //top left
    {lat:31.150899, lon:121.478426}, // bottom left
    {lat:31.150826, lon:121.479917}, //bottom right
    {lat:31.151487, lon:121.479917} //top right
  ],
  trigger:{lat:31.151009, lon:121.479774},
  triggerRadius: 0.00018,

}


];

territoriesData.forEach(b => {
  territories[b.name] = { owner: null, trigger: b.trigger, cooldownEnd: 0 };
});

function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on("playerJoin", (data) => {
    const { name, team } = data;
    players[socket.id] = { name, team, lat: null, lon: null };
    socket.emit("territoriesInit", territoriesData);
    socket.emit("territoriesUpdate", territories);
    io.emit("playersUpdate", players);
  });

  socket.on("playerPosition", (data) => {
    if (!players[socket.id]) return;
    const player = players[socket.id];
    player.lat = data.lat;
    player.lon = data.lon;

    let changed = false;
    for (const [id, block] of Object.entries(territories)) {
      const trigger = block.trigger;
      if (!trigger) continue;
      const dist = distanceInMeters(trigger.lat, trigger.lon, data.lat, data.lon);
      if (block.cooldownEnd && block.cooldownEnd > Date.now()) continue;
      if (dist < 20 && block.owner !== player.team) {
        block.owner = player.team;
        block.cooldownEnd = Date.now() + 30000;
        console.log(`Territory "${id}" captured by ${player.team}`);
        changed = true;
      }
    }
    if (changed) io.emit("territoriesUpdate", territories);
    io.emit("playersUpdate", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

HTTPSserver.listen(portHTTPS, () => {
  console.log(`HTTPS Server started at port ${portHTTPS}`);
});
