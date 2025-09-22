const chatContainer = document.querySelector(".chat-container");
const chatList = document.getElementById("chatList");
const nameInput = document.getElementById("name");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("sendBtn");
const roomButtons = document.querySelectorAll(".room-btn");

let currentRoom = "chill"; // 默认房间
let symbolMap = {
  chill: "🎵",
  party: "🎉",
  study: "📖"
};

let symbolMap1 = {
  chill: "🎶",
  party: "🎶💃🎤",
  study: "🎧"
}

// 切换房间
roomButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // 移除旧 class
    chatContainer.classList.remove("chill", "party", "study");
    // 添加新 class
    currentRoom = btn.dataset.room;
    chatContainer.classList.add(currentRoom);

    // 清空聊天记录（可选）
    chatList.innerHTML = "";

    // 可选：提示用户进入哪个房间
    appendMessage(`You joined ${currentRoom} room ${symbolMap[currentRoom]}`, true);
  });
});

// 发送消息
sendBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Anonymous";
  const msg = msgInput.value.trim();
  if (!msg) return;

  appendMessage(`${name}: ${msg} ${symbolMap1[currentRoom]}`, true);
  msgInput.value = "";
});

// 回车发送
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

// 添加消息到列表
function appendMessage(text, self=false) {
  const li = document.createElement("li");
  li.textContent = text;
  if (self) li.classList.add("self");
  chatList.appendChild(li);
  chatList.scrollTop = chatList.scrollHeight;
}

// 初始化默认房间
chatContainer.classList.add(currentRoom);



// // 连接 Socket.io
// const socket = io();

// // 获取 DOM 元素
// const nameInput = document.getElementById("name");
// const msgInput = document.getElementById("msg");
// const sendBtn = document.getElementById("sendBtn");
// const chatList = document.getElementById("chatList");

// // 发送消息
// sendBtn.addEventListener("click", sendMessage);
// msgInput.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") sendMessage();
// });

// function sendMessage() {
//   const name = nameInput.value.trim() || "Anonymous 🎵";
//   const msg = msgInput.value.trim();
//   if (!msg) return;

//   // 发给自己显示
//   appendMessage({ name, msg, self: true });

//   // 发给服务器广播
//   socket.emit("message", { name, msg });

//   msgInput.value = "";
//   msgInput.focus();
// }

// // 接收来自服务器的消息
// socket.on("message", (data) => {
//   if (!data.self) appendMessage(data);
// });

// // 把消息显示在聊天列表
// function appendMessage(data) {
//   const li = document.createElement("li");
//   li.innerHTML = `<strong>${data.name}:</strong> ${data.msg}`;
//   if (data.self) li.classList.add("self");
//   chatList.appendChild(li);

//   // 滚动到最底部
//   chatList.scrollTop = chatList.scrollHeight;
// }



// const socket = io();
// const nameInput = document.getElementById("name");
// const msgInput = document.getElementById("msg");
// const sendBtn = document.getElementById("sendBtn");
// const chatList = document.getElementById("chatList");

// // 默认房间
// const room = "chill";

// sendBtn.addEventListener("click", () => {
//   const name = nameInput.value || "Anonymous 🎵";
//   const msg = msgInput.value.trim();
//   if (!msg) return;

//   const data = { name, msg, room };
//   socket.emit("message", data);
//   msgInput.value = "";
// });

// // 接收消息
// socket.on("message", (data) => {
//   const li = document.createElement("li");
//   li.textContent = `${data.name}: ${data.msg}`;
//   chatList.appendChild(li);
//   chatList.scrollTop = chatList.scrollHeight;
// });


// const socket = io();

// let usernameInput = document.querySelector("#username");
// let formElm = document.querySelector("#chatForm");
// let msgInput = document.querySelector("#newMessage");
// let chatThread = document.querySelector("#chatThread");
// let currentRoom = "chill"; // default room

// // join room when clicking a button
// document.querySelectorAll(".roomBtn").forEach(btn => {
//   btn.addEventListener("click", () => {
//     currentRoom = btn.dataset.room;
//     chatThread.innerHTML = ""; // clear old messages
//     socket.emit("joinRoom", currentRoom);
//     appendMessage(`You joined ${currentRoom} room 🎶`);
//   });
// });

// formElm.addEventListener("submit", function(event) {
//   event.preventDefault();
//   let msg = msgInput.value;
//   if (!msg) return;

//   let name = usernameInput.value || "Anonymous";
//   let messageObj = { name, msg, room: currentRoom };

//   socket.emit("message", messageObj);
//   msgInput.value = "";
// });

// // receive message
// socket.on("message", function(data) {
//   appendMessage(`${data.name}: ${formatMsg(data.msg)}`);
// });

// // append message to UI
// function appendMessage(txt) {
//   let li = document.createElement("li");
//   li.innerHTML = txt;
//   chatThread.appendChild(li);
//   chatThread.scrollTop = chatThread.scrollHeight;
// }

// // detect if message is a song link
// function formatMsg(msg) {
//   if (msg.includes("http")) {
//     return `<a href="${msg}" target="_blank" class="song-link">🎵 ${msg}</a>`;
//   }
//   return msg;
// }



