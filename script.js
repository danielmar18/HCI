// ! This is the functionality (and some styling) of the WarpTalk assignment Chatroom Application
// ! It should implement every single 'DOs' from the assignment description, as well as avoid every single 'DONTs'
// ! Additionally, it should implement the 'MAYBE' of allowing the user to choose between different chatrooms
// ! The code is ordered into sections for easier reading (Better Comments extension is recommended for this)

// ? The code is not as 'clean' or elegant in some places as I would have hoped to write it
// ? Being used to React/Next.js and Tailwind, even just the basic features were a challenge, let alone the more advanced ones
// ? I do, however, believe that the code is still readable and understandable, and that it fulfills the requirements of the assignment
// ? Github Copilot was turned off during the writing of this code for HTML and CSS code, and only used in small doses for JS code (mainly for comments and cleanliness)

// * The code is structured as follows:
// * 1. Global constants and variables
// * 2. Miscellaneous functions used in the chat
// * 3. HTML DOM Manipulation functions which are triggered by room events
// * 4. Toggle/Helper Functions Functions
// * 5. Event Listeners Bindings

// Global constants
const personalGradient = "linear-gradient(135deg, #f600c1 0%, #fdeb25 100%)";

// Global variables
let wt = new WarpTalk("wss", "warp.cs.au.dk/talk/");
let nickname = undefined;
let clientList = {};
let channelList = [];
let activeRoom = undefined;
let gradientTracker = [];

// Constants for the user-icon gradients
const colors = {
  0: "#01f7f7",
  1: "#00eca5",
  2: "#f7b801",
  3: "#d90855",
  4: "#55d911",
  5: "#1333c0",
  6: "#ff00e6",
  7: "#fffc4c",
}

const angles = {
  0: "135deg",
  1: "225deg",
  3: "45deg",
  2: "315deg",
  4: "60deg",
}

// Gradient Generator
// Generates and keeps track of the gradients for each 'registered' user
const generateGradient = (inputNickname) => {

  // If the user already has a gradient stored, we return it
  if(gradientTracker.find(el => el.nickname === inputNickname)){
    let userGradientObj = gradientTracker.find(el => el.nickname === inputNickname);
    return `linear-gradient(${angles[userGradientObj.angleIx]}, #762aa8 0%, ${colors[userGradientObj.colorIx]} 100%)`;
  }

  // If the user does not have a gradient stored, we start the process of generating a new one
  let angleObj = gradientTracker.reduce((acc, curr) => { // First we need to find the next color angle and available colors to use based on activity in the chatrooms
    let angleIxObj = acc.find(el => el.angleIx == curr.angleIx);
    if(angleIxObj){
        angleIxObj.colorIxs.push(curr.colorIx);
    }else{
        acc.push({
            angleIx: curr.angleIx,
            colorIxs: [curr.colorIx]
        })
    }
    return acc;
  }, []).sort((a, b) => a.angleIx - b.angleIx).find(el => el.colorIxs.length < 8);

  // Once we find the 'lowest' angle index with available colors, we generate a new gradient from said colors
  if(angleObj){
    let availableColors = Object.keys(colors).filter(color => !angleObj.colorIxs.includes(parseInt(color)));
    let randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    let grad = `linear-gradient(${angles[angleObj.angleIx]}, #762aa8 0%, ${colors[parseInt(randomColor)]} 100%)`;
  
    // Create a new object for the nickname, color and angle index
    const newGrad = {
      nickname: inputNickname,
      colorIx: parseInt(randomColor),
      angleIx: angleObj.angleIx,
    }
    gradientTracker.push(newGrad);
    return grad
  }
  // If all angles and colors all full, or none present at all, we generate a new angle and color
  else{
    let newAngleIx = Math.floor(gradientTracker.length / 8);

    if (newAngleIx > 4) { // Edge case where we have a lot of users in the room
      newAngleIx = newAngleIx % 4;
    }

    let colorIx = Math.floor(Math.random() * 8);
    const newGrad = {
      nickname: inputNickname,
      colorIx: colorIx,
      angleIx: newAngleIx,
    }
    gradientTracker.push(newGrad);
    return `linear-gradient(${angles[newAngleIx]}, #762aa8 0%, ${colors[colorIx]} 100%)`;
  }
}


// Miscellaneous functions used in the chat

// Function called when user clicks 'confirm' in the nickname prompt
const setNickname = () => {
  let inputNickname = document.getElementById("prompt-input").value;
  nickname = inputNickname;
  wt.connect(connected, inputNickname);
  let div = document.getElementById("nickname-prompt");
  div.classList.remove("visible");
  div.classList.add("hidden");
}

// Function used to trigger the nickname prompt if the user is not logged in
wt.isLoggedIn(function(isLoggedIn) {
    if (isLoggedIn) {
        wt.connect(connected);
    } 
    else { 
      let div = document.getElementById("nickname-prompt");
      div.classList.remove("hidden");
      div.classList.add("visible");
    }
});
// --------------------------------------------------------------------------------------------


// ! HTML DOM Manipulation functions which are triggered by room events
// ! Some of these are admittedly a bit 'dirty' but I don't know if there is a way to construct HTML elements in JS code in a 'cleaner' way

// Adds a new client to the client list in the corresponding room
const addNewClient = (room = "General-msgs", clientName) => {
  let list = document.getElementById(`${room}-clients`);
  let newDiv = document.createElement("div");
  let iconDiv = document.createElement("div");
  let contentDiv = document.createElement("div");

  if(clientName !== "") {
    clientName === nickname && newDiv.classList.add("client-self"); // Check if the client is my own user
    newDiv.classList.add("client");
    newDiv.classList.add("flex");

    // Check if the client is me, if so, use the personal gradient
    let gradient = clientName == nickname ? personalGradient : generateGradient(clientName);
    iconDiv.style.background = gradient;
    iconDiv.style.background = `-webkit-${gradient}`
    iconDiv.classList.add("client-icon");
    iconDiv.classList.add("shadow-sm");

    contentDiv.classList.add("client-content");
    contentDiv.appendChild(document.createTextNode(clientName));
  
    newDiv.appendChild(iconDiv);
    newDiv.appendChild(contentDiv);
    list.appendChild(newDiv);
  }
}

// Remove a client from the client list in the corresponding room
const removeClient = (room = "General-msgs", clientName) => {
  let parentElement = document.getElementById(`${room}-clients`);
  let list = parentElement.querySelectorAll(".client");
  list.forEach(div => {
    if(div.querySelector('.client-content').innerHTML === clientName) {
      parentElement.removeChild(div);
      gradientTracker = gradientTracker.filter(el => el.nickname !== clientName); // Make sure to remove the gradient from the tracker list as well
    }
  })
}

// Add a new message to the message list in the corresponding room
const addNewMessage = (room = "General-msgs", message, sender, self = false) => {
  let list = document.getElementById(`${room}-msgs`);
  let newDiv = document.createElement("div");
  let newUsernameDiv = document.createElement("div");
  let iconDiv = document.createElement("div");
  let contentDiv = document.createElement("div");

  if(self) newDiv.classList.add("msg-self");
  newDiv.classList.add("msg");
  newDiv.classList.add("flex");

  newUsernameDiv.classList.add("msg-content-username");
  newUsernameDiv.appendChild(document.createTextNode(`${new Date().getHours()}:${new Date().getMinutes()} | ${sender}`));

  iconDiv.classList.add("msg-client-icon");
  iconDiv.classList.add("shadow-sm");
  
  // Not as elegant as the one in addNewClient(), but it breaks if I try any other way and I don't have the time luxury of figuring out why
  let userGradientObj = gradientTracker.find(el => el.nickname === sender);
  if(userGradientObj){
    let gradient =  `linear-gradient(${angles[userGradientObj.angleIx]}, #762aa8 0%, ${colors[userGradientObj.colorIx]} 100%)`;
    iconDiv.style.background = gradient;
    iconDiv.style.background = `-webkit-${gradient}`
  }else {
    iconDiv.style.background = personalGradient;
    iconDiv.style.background = `-webkit-${personalGradient}`
  }

  contentDiv.classList.add("msg-content");
  contentDiv.appendChild(newUsernameDiv);
  contentDiv.appendChild(document.createTextNode(message));


  newDiv.appendChild(iconDiv);
  newDiv.appendChild(contentDiv);
  list.appendChild(newDiv);

  list.scrollTop = list.scrollHeight;
}

// Add an activity message (joining, leaving or disconnecting from a room) to the message list in the corresponding room
const addActivity = (room = "General-msgs", nickname, message, alert = false) => {
  let list = document.getElementById(`${room}-msgs`);

  let usernameSpan = document.createElement("span");
  usernameSpan.id = "activity-indicator-username";
  usernameSpan.appendChild(document.createTextNode(nickname));

  let newDiv = document.createElement("div");
  newDiv.id = "activity-indicator";
  newDiv.classList.add("flex");
  newDiv.appendChild(usernameSpan);
  newDiv.appendChild(document.createTextNode(message));
  alert && newDiv.classList.add("activity-alert"); // Disconnect messages are marked red

  list.appendChild(newDiv);

  list.scrollTop = list.scrollHeight;
}
// ! --------------------------------------------------------------------------------------------

// * Toggle/Helper Functions Functions

// Function used to 'open' and 'close' the menu for choosing channels
const toggleChannelChoice = () => {
  let div = document.getElementById("channel-choice-prompt");
  if(nickname !== undefined) { // CTRL should not be able to open the channel choice menu if there is no nickname
    div.classList.toggle("hidden");
    div.classList.toggle("visible-channels");
  }
}

// Function which is passed to event listener
const toggleChannelChoiceHandler = (e) => {
  if(e.key === "Control") {
    toggleChannelChoice();
  }
}

// Load bearing function in the 'shifting' between channels - It rolls through all 'open' channels and closes the ones that are not the active one and opens the active one
// This might very well be one of the ugliest functions I have ever written, but it does not work any other way
// Using .toggle() resulted in some very strange behavior, so manual manipulation was the only way I got it to work
const toggleChannels = (channelName, inputRoom) => {
  activeRoom = inputRoom;
  channelList.forEach(channel => {
    let msgChannelDiv = document.getElementById(`${channel}-msgs`);
    let clientChannelDiv = document.getElementById(`${channel}-clients`);
    let arr = [...document.getElementById("channel-names").querySelectorAll("*")];
    
    channelButton = arr.find(el => el.innerText == channel);

    if(channel !== channelName) {
      msgChannelDiv.classList.remove("flex-col");
      msgChannelDiv.classList.remove("shadow-sm");
      msgChannelDiv.classList.remove("msg-list");
      msgChannelDiv.classList.add("msg-list-hidden");
      clientChannelDiv.classList.remove("flex-col");
      clientChannelDiv.classList.remove("shadow-sm");
      clientChannelDiv.classList.remove("client-list");
      clientChannelDiv.classList.add("client-list-hidden");
      channelButton.classList.remove("channel-name-selected");
      channelButton.classList.add("channel-name");
    } else {
      msgChannelDiv.classList.add("flex-col");
      msgChannelDiv.classList.add("shadow-sm");
      msgChannelDiv.classList.add("msg-list");
      msgChannelDiv.classList.remove("msg-list-hidden");
      clientChannelDiv.classList.add("flex-col");
      clientChannelDiv.classList.add("shadow-sm");
      clientChannelDiv.classList.add("client-list");
      clientChannelDiv.classList.remove("client-list-hidden");
      channelButton.classList.add("channel-name-selected");
      channelButton.classList.remove("channel-name");
    }

  })
}
// * --------------------------------------------------------------------------------------------

// ? Event Listeners Bindings

// Used to bind the clicks, 'Enter' key and 'Control' key to the corresponding functionality of the chat
const bodyDiv = document.querySelector("body");
const inputContainer = document.getElementById("input");
const promptInputContainer = document.getElementById("prompt-input-container");

// Event listener for the channel menu toggling
bodyDiv.addEventListener("keydown", (e) => toggleChannelChoiceHandler(e));

// Event listeners for the input field used to write and send messages
inputContainer.querySelector('#icon-container').addEventListener("click", () => {
  let inputValue = inputContainer.querySelector('#msg-input').value;
  if(inputValue !== "") {
    activeRoom.send(inputValue);
    document.getElementById("msg-input").value = "";
  }
});

inputContainer.querySelector('#msg-input').addEventListener("keypress", (e) => {
  if(e.key === "Enter") {
    let inputValue = inputContainer.querySelector('#msg-input').value;
    if(inputValue !== "") {
      activeRoom.send(inputValue);
      document.getElementById("msg-input").value = "";
    }
  }
})

// Event listener for the 'confirm' button in the nickname prompt in the beginning
promptInputContainer.querySelector('#prompt-confirm-button').addEventListener("click", setNickname);

promptInputContainer.querySelector('#prompt-input').addEventListener("keypress", (e) => {
  if(e.key === "Enter" && nickname === undefined) {
    setNickname();
  }
})

// ? --------------------------------------------------------------------------------------------

// 'Borrowed' & repurposed function from the provided example code
function connected() {

  // Connect to 'General' by default (Admittedly, this is vulnerable to changes in the order of rooms, but again, time is not unlimited)
  let room = wt.join(wt.availableRooms[0].name);

  // Set the active room to the joined room
  activeRoom = room;

  // Add the room to the channel list
  channelList.push(wt.availableRooms[0].name);

  // Add event listeners for the 'General' channel so it is possible to click it as well
  let generalChannelButton = document.getElementById("channel-names").children[2];
  console.log(generalChannelButton);
  generalChannelButton.addEventListener("click", () => toggleChannels("General", room));
  
  let channelChoices = document.getElementById("channel-choices");

  // For each room we want to create an entry in the channel menu, as well as adding the functionality of joining a new room, adding it to the channel list up top, and being able to click it
  // Once again, not the most elegant solution, but you can't have it all
  wt.availableRooms.forEach(r => {

      // Create the div for the channel choice
      let div = document.createElement("div");
      div.classList.add("channel-choice");

      if(channelList.includes(r.name)) {
        div.classList.add("channel-choice-selected");
      }

      // Create the div for the channel name
      let nameDiv = document.createElement("div");
      nameDiv.classList.add("channel-choice-name");
      nameDiv.appendChild(document.createTextNode(r.name));

      // Create the div for the channel description
      let descDiv = document.createElement("div");
      descDiv.classList.add("channel-description");
      descDiv.appendChild(document.createTextNode(r.description));

      div.appendChild(nameDiv);
      div.appendChild(descDiv);

      // Add the event listener for joining the channel and creating the corresponding 'artefacts' as a result
      div.addEventListener("click", () => {
        if(!channelList.includes(r.name)) { // Check if the channel is already joined

          // Join the room and add it to the channel list
          let newRoom = wt.join(r.name);
          channelList.push(r.name);

          // Mark the channel as one of the selected
          div.classList.add("channel-choice-selected");
          toggleChannelChoice();

          // Create and add the channel to the channel list above the chat itself
          let channelContainer = document.getElementById("channel-names");
          let channelDiv = document.createElement("div");
          channelDiv.classList.add("channel-name");
          channelDiv.appendChild(document.createTextNode(r.name));
          channelDiv.addEventListener("click", () => toggleChannels(r.name, newRoom)); // Connect it to the horrible toggling function of mine
          channelContainer.appendChild(channelDiv);

          // Create the empty chat room and client list itself and set the corresponding event listeners and attributes
          let generalRoom = document.getElementById("General-msgs");
          let generalClients = document.getElementById("General-clients");
          let newChatRoom = document.createElement("div");
          let newClientList = document.createElement("div");
          newChatRoom.id = `${r.name}-msgs`;
          newClientList.id = `${r.name}-clients`;
          newChatRoom.classList.add("msg-list-hidden");
          newClientList.classList.add("client-list-hidden");

          // Quite an elegant way of stacking the chats and client lists in the parent div with little effort
          // Credit: https://stackoverflow.com/a/21422401
          generalRoom.parentNode.insertBefore(newChatRoom, generalRoom.nextSibling);
          generalClients.parentNode.insertBefore(newClientList, generalClients.nextSibling);

          // Add the event listeners for the new room
          // Admittedly, this is redundant and could be refactored into a function or more elegant solution but you can't win them all
          newRoom.onMessage((room, msg) => {
            addNewMessage(room.name, msg.message, msg.sender, msg.sender == nickname);
          });
      
                  
          newRoom.onJoin((room, nickname) => {       
            if(clientList[room.name] === undefined) {
                clientList[room.name] = room.clients.map(client => client.nickname);
                clientList[room.name].forEach(client => {
                  addNewClient(room.name, client);
                })
            }else{
                clientList[room.name].push(nickname);
                addNewClient(room.name, nickname);
            }
            addActivity(room.name, nickname, ` joined the chatroom`);
          });
      
          newRoom.onLeave((room, nickname) => {
              clientList[room.name] = clientList[room.name].filter(client => client !== nickname);
              removeClient(room.name, nickname);
              addActivity(room.name, nickname, ` left the chatroom`);
          });

          newRoom.onDisconnect((room) => {
            addActivity(room.name, "", "You have been disconnected from the chatroom", true);
          });
        }
    
      });
      channelChoices.appendChild(div);
  });

  // Add the event listener for the initial 'General' channel
  room.onMessage((room, msg) => {
    addNewMessage(room.name, msg.message, msg.sender, msg.sender == nickname);
  });

  room.onJoin((room, nickname) => {       
      if(clientList[room.name] === undefined) {
        clientList[room.name] = room.clients.map(client => client.nickname);
        clientList[room.name].forEach(client => {
          addNewClient(room.name, client);
        })
      }else{
        clientList[room.name].push(nickname);
        addNewClient(room.name, nickname);
      }
      addActivity(room.name, nickname, ` joined the chatroom`);
  });

  room.onLeave((room, nickname) => {
      clientList[room.name] = clientList[room.name].filter(client => client !== nickname);
      removeClient(room.name, nickname);
      addActivity(room.name, nickname, ` left the chatroom`);
  });

  room.onDisconnect((room) => {
    addActivity(room.name, "", "You have been disconnected from the chatroom", true);
  });

  // I didn't touch these so ther are stragiht from the example code
  // These two lines puts the functions on the global window object so
  // so they can be called from the JavaScript console
  window.send = function(msg) {
      room.send(msg);
  };
  window.login = function(username, password) {
      wt.login(username, password);
  }
  window.logout = function() {
      wt.logout();
  }
};
