# ABC Browser Circus

Hi, I am Beatrice 

Find my project below:

- final project

Your Name: Beatrice Zhang

Project Title: Cartographies of light

Project Subtitle: A Multiplayer Map of Encounters, Messages, and Shared Illumination

Short Description:
Cartographies of light is an online multiplayer map where each participant appears as a moving light in a darkened world. By wandering and encountering others, players leave behind messages that gradually illuminate parts of the map with shared memories.

Abstract:
Cartographies of light explores how fleeting human encounters can leave lasting traces in shared spaces. Set within a darkened digital map, each participant exists as a small source of light, navigating blindly until they encounter another. These moments of meeting generate shared points on the map—sites that glow softly and preserve messages left behind by those who crossed paths there. Over time, the world becomes gradually illuminated by accumulated interactions, forming an emotional cartography shaped not by efficiency or destination, but by chance, proximity, and presence. The project reflects on loneliness, connection, and collective memory in online environments, where strangers briefly intersect and then drift apart. Rather than emphasizing constant visibility or communication, Run Into the Same Light values slowness, uncertainty, and the quiet impact of being seen—if only for a moment.

//

Part 2 
1) Process: Design and Composition

The project began with a very different conceptual direction. My initial idea explored collective drawing and spatial convergence: users would draw directly onto a shared world map, and over time the map itself would slowly shift toward the calculated “center” of all active participants. I built an early prototype that continuously computed the geographic midpoint of all connected users and recentered the map toward that point. Technically this worked, however, through testing and reflection, I realized that this idea lacked conceptual tension. Although the prototype was functional, it did not meaningfully address why people were together, nor what it meant to encounter others in a shared space.

This realization led to a major conceptual shift. I set out to create a multiplayer map experience that felt more emotionally driven. I designed the world to be almost entirely dark, where players appear only as small, softly glowing points of light. This framing turned movement into an act of searching, and made encounters feel rare and deliberate. Starting from each user’s real GPS location reinforced the feeling of distance and scale. Users could choose to wander locally or intentionally move toward distant friends on the other side of the world, turning navigation into a slow expedition. Compared to the original idea, the final design places more emphasis on presence and the interaction and feels more emotionally grounded and purposeful.

Visually, the project evolved through multiple iterations. Early versions represented encounters as simple static markers on top of the normal map. I later transitioned to a “revealing light” metaphor: when players meet, a circular area of darkness is erased, allowing a portion of the underlying map to emerge. I also reframed meeting points as traces of shared presence—memories embedded in geographic space. In parallel, I refined the player avatar from a flat dot into a layered, softly animated light source, emphasizing human presence within an otherwise unreadable world.



2) Process: Technical


1. Client Initialization and Identity Persistence

On the client side, each user is assigned a persistent userId stored in localStorage. This allows the system to recognize returning users even after refreshing the page or reconnecting to the server.

let storedId = localStorage.getItem("userId");
if (!storedId) {
  storedId = '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", storedId);
}


The player’s chosen name is also stored locally. If no name exists, the sketch pauses at an entry screen before initializing the socket connection. This separation ensures that identity is established before any server-side state is created.

Once identified, the client emits an identify event to the server, sending { userId, name }. The server responds with: 1. The player’s last known latitude and longitude (if returning) 2. A list of all current players

All existing meeting points and messages

This handshake synchronizes the client with the shared world state.


3. Artificial Movement and Input

Rather than relying on real GPS movement, player navigation is controlled via a touch-based D-pad. Pressing directional buttons modifies artificialLatitude and artificialLongitude, allowing users to “travel” across the globe regardless of their physical location.

artificialLatitude += moveStep;
artificialLongitude -= moveStep;

Every movement triggers updateMapContent(), which converts the new coordinates into screen space, Updates the local player’s visual target, emits an update_position event to the server.

This design intentionally blurs real and artificial movement, reinforcing the idea of speculative exploration.

4. Real-Time Multiplayer Synchronization

The server maintains several parallel data structures,

sockets: socket.id → user info

users: userId → socket.id

players: userId → { lat, lng, name }

Whenever a client emits update_position, the server updates the corresponding entry in players and broadcasts the movement to all other clients via playerMoved. On the client, other users are stored in the otherPlayers object and rendered dynamically each frame. Their positions are recalculated in pixel space to remain consistent during zooming and panning.

5. Proximity Detection and Interaction Logic

Interactions are distance-based rather than click-based. Each frame, the client calculates the pixel distance between itself and every other player:

let distance = dist(myPos.x, myPos.y, pos.x, pos.y);


If two players come within a small threshold and neither has recently triggered an interaction, the system prompts the user to leave a message. Cooldown timers (lastTriggerTime, triggeredWith) were necessary to prevent repeated triggering due to network latency or minor positional jitter.

This approach deliberately avoids explicit “interaction buttons,” making encounters feel accidental and fragile.

6. Meeting Points and Collective Memory

When two users meet, a meeting point is created at that geographic location. Each meeting point stores:

{ lat, lng, messages: [{ from, text }] }


On the client, meeting points visually erase circular regions from the black overlay, revealing the map beneath. This is implemented using p5’s erase() mode, layered on top of a full-screen black rectangle. Conceptually, this makes visibility a shared achievement rather than an individual one.

7. Darkness and Light Rendering

Each frame, the sketch redraws a fully black screen (drawDarkMap()), then selectively erases areas around meeting points. Player lights themselves do not permanently reveal the map—only collective encounters do. This technical constraint became a conceptual rule: movement alone is not enough; meaning requires others.

8. Challenges, Compromises, and Discoveries

The most significant challenge was managing identity, persistence, and synchronization simultaneously across multiple users. Using localStorage for identity while relying on the server for world state required careful separation of responsibility. Handling shared meeting points and message history was also hard. Messages needed to persist, merge correctly at nearby locations, and appear consistently for all users. I solved this by spatially grouping interactions and storing them server-side. 

Through this project, I realized that multiplayer systems are less about visuals and more about data relationships. Small mistakes in how user identity, position, or message ownership are tracked can completely change how an experience feels socially. I also discovered that constraints can strengthen conceptual clarity. Abandoning my initial “map-centering” idea allowed the project to focus on presence, encounter, and memory rather than abstraction. Technically, I learned that real-time maps introduce hidden complexity—screen space, geographic coordinates, and zoom levels must constantly be reconciled. Finally, designing darkness as an active system (rather than absence) revealed how visual metaphors can directly shape user behavior and emotional engagement.

3) Reflection and Future Development

This project evolved significantly from its initial proposal, and I wish I could have more time to develop it fully. I began with an idea centered on collective drawing and a constantly shifting global center point, but through prototyping I realized that this mechanic felt conceptually forced and difficult for users to perceive meaningfully. Pivoting toward encounters, darkness, and gradual revelation allowed the project to better reflect themes of presence, distance, and shared discovery.

What works best in the current version is the metaphor of light—seeing other users as moving lights and revealing the map only through meeting creates a slow, intentional form of interaction. The persistence of meeting points and messages also adds a sense of memory and emotional residue. I am less satisfied with the current message interface, which is functional but still visually limited, and with how fragile real-time encounters can be when users are sparse.

Feedback from peers and the instructor emphasized the strength of the concept but encouraged clearer affordances and stronger visual polish. In response, I refined the darkness system, improved identity persistence, and added the mailbox to surface past encounters. In future iterations, I would explore richer message formats, time-based decay of light, and more nuanced social mechanics that encourage longer-term collaboration across distance.

4) credits and references

Mappa.js — map integration with Leaflet
https://mappa.js.org

Leaflet.js — interactive maps
https://leafletjs.com


