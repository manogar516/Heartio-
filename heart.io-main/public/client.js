// Connect to the Socket.IO server
const socket = io();
let username = "";
let currentGroup = null;
let isInGroup = false;

// Get DOM elements
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const typingIndicator = document.getElementById("typingIndicator");

// Set username and show group options
function setUsername() {
  const nameInput = document.getElementById("usernameInput");
  const name = nameInput.value.trim();

  if (name) {
    username = name;
    showGroupOptions();
  }
}

// Show group creation/join options
function showGroupOptions() {
  const overlayBox = document.getElementById("usernamePrompt").querySelector(".overlay-box");
  overlayBox.innerHTML = `
    <h2>Your Heart's Connection ❤️🔥</h2>
    <div class="group-options">
      <button onclick="showCreateGroupForm()" class="group-option-btn">Create Group</button>
      <button onclick="showJoinGroupForm()" class="group-option-btn">Join Group</button>
    </div>
    <div id="createGroupForm" class="group-form">
      <input type="text" id="newGroupName" placeholder="Group name" />
      <input type="password" id="newGroupPasscode" placeholder="Passcode" />
      <button onclick="createGroup()">Create</button>
    </div>
    <div id="joinGroupForm" class="group-form">
      <input type="text" id="joinGroupName" placeholder="Group name" />
      <input type="password" id="joinGroupPasscode" placeholder="Passcode" />
      <button onclick="joinGroup()">Join</button>
    </div>
  `;
}

function showCreateGroupForm() {
  document.getElementById("joinGroupForm").style.display = "none";
  document.getElementById("createGroupForm").style.display = "block";
}

function showJoinGroupForm() {
  document.getElementById("createGroupForm").style.display = "none";
  document.getElementById("joinGroupForm").style.display = "block";
}

function createGroup() {
  const groupName = document.getElementById("newGroupName").value.trim();
  const passcode = document.getElementById("newGroupPasscode").value.trim();
  
  if (groupName && passcode) {
    socket.emit("create group", { groupName, passcode });
  }
}

function joinGroup() {
  const groupName = document.getElementById("joinGroupName").value.trim();
  const passcode = document.getElementById("joinGroupPasscode").value.trim();
  
  if (groupName && passcode) {
    socket.emit("join group", { groupName, passcode, username });
  }
}

// Handle message submission
form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (input.value && isInGroup) {
    socket.emit("chat message", {
      user: username,
      text: input.value,
      group: currentGroup
    });
    input.value = "";
  }
});

// Emit typing event when user types
input.addEventListener("input", () => {
  if (isInGroup) {
    socket.emit("typing", { user: username, group: currentGroup });
  }
});

// Socket event listeners
socket.on("chat message", (data) => {
  const item = document.createElement("li");
  const timeObj = new Date(data.time);
  const formattedTime = timeObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  item.innerHTML = `<strong>${data.user}</strong> [${formattedTime}]: ${data.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("typing", (user) => {
  typingIndicator.innerText = `${user} is typing...`;
  setTimeout(() => {
    typingIndicator.innerText = "";
  }, 1500);
});

socket.on("system message", (msg) => {
  const item = document.createElement("li");
  item.className = "system";
  item.textContent = msg;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("group created", (groupName) => {
  currentGroup = groupName;
  isInGroup = true;
  document.getElementById("usernamePrompt").style.display = "none";
  document.querySelector(".chat-header h1").textContent = `❤️ ${groupName} ❤️`;
});

socket.on("group joined", (groupName) => {
  currentGroup = groupName;
  isInGroup = true;
  document.getElementById("usernamePrompt").style.display = "none";
  document.querySelector(".chat-header h1").textContent = `❤️ ${groupName} ❤️`;
});

socket.on("group error", (message) => {
  alert(`Group Error: ${message}`);
});

// Floating hearts animation
function createHearts() {
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerHTML = ['❤️', '💘', '💖', '💗', '💓', '💞', '💕'][Math.floor(Math.random() * 7)];
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.animationDuration = (Math.random() * 3 + 5) + 's';
  document.getElementById("heartsContainer").appendChild(heart);
  
  setTimeout(() => heart.remove(), 8000);
}

setInterval(createHearts, 300);

document.addEventListener("mousemove", function(e) {
  if(Math.random() > 0.7) {
    const burstHeart = document.createElement('div');
    burstHeart.className = 'floating-heart';
    burstHeart.innerHTML = '💖';
    burstHeart.style.left = e.pageX + 'px';
    burstHeart.style.top = e.pageY + 'px';
    burstHeart.style.animationDuration = '4s';
    burstHeart.style.fontSize = '32px';
    document.getElementById("heartsContainer").appendChild(burstHeart);
    setTimeout(() => burstHeart.remove(), 4000);
  }
});