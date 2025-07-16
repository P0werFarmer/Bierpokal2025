// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_PATH = path.join(__dirname, 'data');
const TEAMS_FILE = path.join(DATA_PATH, 'teams.json');

let recentBeers=[]
let MaxRecentBeerLength = 5

app.use(express.static('public'));
app.use(express.json());

// Load or initialize data
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);
if (!fs.existsSync(TEAMS_FILE)) fs.writeFileSync(TEAMS_FILE, JSON.stringify({ teams: [] }, null, 2));

const loadData = () => JSON.parse(fs.readFileSync(TEAMS_FILE));
const saveData = (data) => fs.writeFileSync(TEAMS_FILE, JSON.stringify(data, null, 2));

// API Routes
app.get('/data', (req, res) => {
  res.json(loadData());
});

app.post('/add-team', (req, res) => {
  const { name } = req.body;
  const data = loadData();
  if (!data.teams.find(t => t.name === name)) {
    data.teams.push({ name, players: [],beerpongpoints: [] });
    saveData(data);
    io.emit('data-update', data);
  }
  res.sendStatus(200);
});

app.post('/add-player', (req, res) => {
  const { team, player } = req.body;
  const data = loadData();
  const teamObj = data.teams.find(t => t.name === team);
  if (teamObj && !teamObj.players.find(p => p.name === player)) {
    teamObj.players.push({ name: player, points: [] });
    saveData(data);
    io.emit('data-update', data);
  }
  res.sendStatus(200);
});

app.post('/add-point', (req, res) => {
  const { team, player, timestamp } = req.body;
  const data = loadData();
  let teamObj;
  console.log("425Playername: "+ player);
  if(player == "BeerpongPointsAssignmentToTeam"){
    teamObj = data.teams.find(t => t.name === team);
    let time = getCurrentTime()
    teamObj.beerpongpoints.push(time + " - " + timestamp)
    saveData(data);
    io.emit('data-update', data);
    res.sendStatus(200);
    return
  }

  if (!team || team.trim() === "") {
    // Kein Team angegeben – Spielername in allen Teams suchen
    for (const t of data.teams) {
      const foundPlayer = t.players.find(p => p.name === player);
      if (foundPlayer) {
        teamObj = t;
        break;
      }
    }
  } else {
    // Teamname ist angegeben
    
    teamObj = data.teams.find(t => t.name === team);

  }

  const playerObj = teamObj?.players.find(p => p.name === player);

  if (playerObj) {
    let time = getCurrentTime()
    playerObj.points.push(time + " - " + timestamp);
    recentBeers.unshift(time + " - " + playerObj.name + " von "+ teamObj.name)
    if(recentBeers.length>MaxRecentBeerLength){
      recentBeers.pop()
    }

    saveData(data);
    io.emit('data-update', data);
    io.emit('recentBeers',recentBeers);
    res.sendStatus(200);
  } else {
    res.status(404).send("Spieler nicht gefunden");
  }
});


app.post('/remove-team', (req, res) => {
  const { name } = req.body;
  const data = loadData();
  const team = data.teams.find(t => t.name === name);
  if (team && team.players.length === 0) {
    data.teams = data.teams.filter(t => t.name !== name);
    saveData(data);
    io.emit('data-update', data);
  }
  res.sendStatus(200);
});

app.post('/remove-player', (req, res) => {
  const { team, player } = req.body;
  const data = loadData();
  const teamObj = data.teams.find(t => t.name === team);
  if (teamObj) {
    const playerObj = teamObj.players.find(p => p.name === player);
    if (playerObj && playerObj.points.length === 0) {
      teamObj.players = teamObj.players.filter(p => p.name !== player);
      saveData(data);
      io.emit('data-update', data);
    }
  }
  res.sendStatus(200);
});

app.post('/remove-point', (req, res) => {
  const { team, player, timestamp } = req.body;
  const data = loadData();


  let teamObj;
  console.log("477Playername: "+ player);
  if(player == "BeerpongPointsAssignmentToTeam"){
    teamObj = data.teams.find(t => t.name === team);
    console.dir(teamObj);
    console.dir(timestamp);
    
    teamObj.beerpongpoints = teamObj.beerpongpoints.filter(f => f !== timestamp);
    console.dir(teamObj);
    saveData(data);
    io.emit('data-update', data);
    res.sendStatus(200);
    return
  }

  teamObj = data.teams.find(t => t.name === team);
  const playerObj = teamObj?.players.find(p => p.name === player);
  if (playerObj) {
    playerObj.points = playerObj.points.filter(ts => ts !== timestamp);
    saveData(data);
    io.emit('data-update', data);
  }
  res.sendStatus(200);
});

// Web pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/beerpong', (req, res) => res.sendFile(path.join(__dirname, 'public', 'beerpong.html')));
app.get('/links.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'links.html')));

// Socket.io
io.on('connection', (socket) => {
  socket.emit('data-update', loadData());
});

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

console.log("Der Server hat mehrere Webseiten:")
console.log("Dashboard/Ranking: http://localhost:3000")
console.log("Teamverwaltung: http://localhost:3000/admin")
console.log("Beerpong: http://localhost:3000/beerpong")

server.listen(3000, () => console.log('Server running'));
