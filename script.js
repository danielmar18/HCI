const personalGradient = "linear-gradient(135deg, #f600c1 0%, #fdeb25 100%)";

let wt = new WarpTalk("wss", "warp.cs.au.dk/talk/");
let clientList = undefined;
let nickname = undefined;
let gradientTracker = [];

const setNickname = () => {
  let inputNickname = document.getElementById("prompt-input").value;
  nickname = inputNickname;
  wt.connect(connected, inputNickname);
  let div = document.getElementById("nickname-prompt");
  div.classList.remove("visible");
  div.classList.add("hidden");
}

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

const generateGradient = (inputNickname) => {
  let angleObj = gradientTracker.reduce((acc, curr) => {
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

  if(angleObj){
    let availableColors = Object.keys(colors).filter(color => !angleObj.colorIxs.includes(parseInt(color)));
    let randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    let grad = `linear-gradient(${angles[angleObj.angleIx]}, #762aa8 0%, ${colors[parseInt(randomColor)]} 100%)`;
  
    const newGrad = {
      nickname: inputNickname,
      colorIx: parseInt(randomColor),
      angleIx: angleObj.angleIx,
    }
  
    gradientTracker.push(newGrad);
  
    return grad
  }
  else{
    let newAngleIx = Math.floor(gradientTracker.length / 8);
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

const addNewClient = (clientName) => {
  let list = document.getElementById("client-list");
  let newDiv = document.createElement("div");
  let iconDiv = document.createElement("div");
  let contentDiv = document.createElement("div");

  if(clientName !== "") {
    newDiv.classList.add("client");
    clientName === nickname && newDiv.classList.add("client-self");
    newDiv.classList.add("flex");
    iconDiv.classList.add("client-icon");
    iconDiv.classList.add("shadow-sm");

    let gradient = clientName == nickname ? personalGradient : generateGradient(clientName);
    iconDiv.style.background = gradient;
    iconDiv.style.background = `-webkit-${gradient}`

    contentDiv.classList.add("client-content");
    contentDiv.appendChild(document.createTextNode(clientName));
  
    newDiv.appendChild(iconDiv);
    newDiv.appendChild(contentDiv);
    list.appendChild(newDiv);
  }
}

const removeClient = (clientName) => {
  let parentElement = document.getElementById("client-list");
  let list = parentElement.querySelectorAll(".client");
  list.forEach(div => {
    if(div.querySelector('.client-content').innerHTML === clientName) {
      parentElement.removeChild(div);
      gradientTracker = gradientTracker.filter(el => el.nickname !== clientName);
    }
  })
}

const addNewMessage = (message, sender, self = false) => {
  let list = document.getElementById("msg-list");
  let newDiv = document.createElement("div");
  let newUsernameDiv = document.createElement("div");
  let iconDiv = document.createElement("div");
  let contentDiv = document.createElement("div");

  newDiv.classList.add("msg");
  if(self) newDiv.classList.add("msg-self");
  newDiv.classList.add("flex");
  newUsernameDiv.classList.add("msg-content-username");
  newUsernameDiv.appendChild(document.createTextNode(`${new Date().getHours()}:${new Date().getMinutes()} | ${sender}`));

  iconDiv.classList.add("msg-client-icon");
  iconDiv.classList.add("shadow-sm");
  let userGradientObj = gradientTracker.find(el => el.nickname === sender);
  if(userGradientObj){
    let gradient =  `linear-gradient(${angles[userGradientObj.angleIx]}, #762aa8 0%, ${colors[userGradientObj.colorIx]} 100%)`;
    iconDiv.style.background = gradient;
    iconDiv.style.background = `-webkit-${gradient}`
  }

  contentDiv.classList.add("msg-content");
  contentDiv.appendChild(newUsernameDiv);
  contentDiv.appendChild(document.createTextNode(message));


  newDiv.appendChild(iconDiv);
  newDiv.appendChild(contentDiv);
  list.appendChild(newDiv);

  list.scrollTop = list.scrollHeight;
}

const addActivity = (nickname, leaving = false) => {
  let list = document.getElementById("msg-list");

  let usernameSpan = document.createElement("span");
  usernameSpan.id = "activity-indicator-username";
  usernameSpan.appendChild(document.createTextNode(nickname));

  let newDiv = document.createElement("div");
  newDiv.id = "activity-indicator";
  newDiv.classList.add("flex");
  newDiv.appendChild(usernameSpan);
  newDiv.appendChild(document.createTextNode(` ${leaving ? "left" : "joined"} the chatroom`));

  list.appendChild(newDiv);

  list.scrollTop = list.scrollHeight;
}


const promptInputContainer = document.getElementById("prompt-input-container");
promptInputContainer.querySelector('#prompt-confirm-button').addEventListener("click", setNickname);
promptInputContainer.querySelector('#prompt-input').addEventListener("keypress", (e) => {
  if(e.key === "Enter") {
    setNickname();
  }
})

const inputContainer = document.getElementById("input");

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


function connected() {
    wt.availableRooms.forEach(r => {
        // let roomList = document.getElementById("roomList");
        // let li = document.createElement("li");
        // li.appendChild(document.createTextNode(`${r.name}: ${r.description}`));
        // roomList.appendChild(li);
        console.log(`${r.name}: ${r.description}`);
        console.log(r)
    });

    let room = wt.join(wt.availableRooms[0].name);
    
    inputContainer.querySelector('#icon-container').addEventListener("click", () => {
      let inputValue = inputContainer.querySelector('#msg-input').value;
      if(inputValue !== "") {
        room.send(inputValue);
        document.getElementById("msg-input").value = "";
      }
    });

    inputContainer.querySelector('#msg-input').addEventListener("keypress", (e) => {
      if(e.key === "Enter") {
        let inputValue = inputContainer.querySelector('#msg-input').value;
        if(inputValue !== "") {
          room.send(inputValue);
          document.getElementById("msg-input").value = "";
        }
      }
    })

    room.onMessage((room, msg) => {
      addNewMessage(msg.message, msg.sender, msg.sender == nickname);
    });

    room.onJoin((room, nickname) => {       
       if(clientList === undefined) {
          addActivity(nickname);
          clientList = room.clients.map(client => client.nickname);
          clientList.forEach(client => {
            addNewClient(client);
          })
       }else{
          clientList.push(nickname);
          addActivity(nickname);
          addNewClient(nickname);
       }
    });

    room.onLeave((room, nickname) => {
        clientList = clientList.filter(client => client !== nickname);
        removeClient(nickname);
        addActivity(nickname, true);
    });

    room.onDisconnect((room) => {
       // ! To be implemented
    });

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
