const socket = io();
let currentTeam = null;
let currentPlayer = null;
let lastData= null

let currentPage = 0;
const teamsPerPage = 7; // <- anpassbar: Anzahl Teams pro Seite
const pageIntervalMs = 5000; // <- 10 Sekunden
const beerpongpointValue= 6 // Wieviel Bier ist ein Beerpongpunkt wert.

socket.on('data-update', data => {
  updateTeams(data.teams);
  updateDashboard(data.teams);
  console.log("Data-Update")
  console.log("Current Team: " + currentTeam);
  console.log("Current Player: " + currentPlayer);
  console.dir(data);
  lastData = data;

  if (currentTeam) {
    const team = data.teams.find(t => t.name === currentTeam);
    if (team) {
      updatePlayers(team);
      updatePointsBeerpong(team)
      if (currentPlayer) {
        const player = team.players.find(p => p.name === currentPlayer);
        if (player) {
          updatePoints(player);
        } else {
          if(document.getElementById('pointList')){
            document.getElementById('pointList').innerHTML = '';
          }
        }
      }
    }
  }


});
socket.on('recentBeers', data => {
  updaterecentBeers(data)
});


function updateTeams(teams) {
  const teamList = document.getElementById('teamList');
  if (teamList) {
    teamList.innerHTML = '';
    teams.forEach(team => {
      const li = document.createElement('li');
      li.textContent = team.name;
      if (team.name === currentTeam) li.classList.add('active');
      li.onclick = () => {
        currentTeam = team.name;
        currentPlayer = null;
        updatePlayers(team);
        updatePointsBeerpong(team)
        if(document.getElementById('pointList')){
          document.getElementById('pointList').innerHTML = '';
        }
        updateTeams(teams); // zur visuellen Aktualisierung
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = '✖';
      delBtn.onclick = e => {
        e.stopPropagation();
        fetch('/remove-team', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: team.name })
        });
      };
      if (team.players.length > 0) delBtn.disabled = true;
      li.appendChild(delBtn);
      teamList.appendChild(li);
    });
  }
}

function updatePlayers(team) {
  const playerList = document.getElementById('playerList');
  if (playerList) {
    playerList.innerHTML = '';
    team.players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player.name;
      if (player.name === currentPlayer) li.classList.add('active');
      li.onclick = () => {
        currentPlayer = player.name;
        updatePoints(player);
        updatePlayers(team); // visuelles Update
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = '✖';
      delBtn.onclick = e => {
        e.stopPropagation();
        fetch('/remove-player', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team: currentTeam, player: player.name })
        });
      };
      if (player.points.length > 0) delBtn.disabled = true;
      li.appendChild(delBtn);
      playerList.appendChild(li);
    });
  }
}

function updatePoints(player) {
  const pointList = document.getElementById('pointList');
  if (pointList) {
    pointList.innerHTML = '';
    player.points.forEach(ts => {
      const li = document.createElement('li');
      li.textContent = ts;
      const delBtn = document.createElement('button');
      delBtn.textContent = '✖';
      delBtn.onclick = () => {
        fetch('/remove-point', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team: currentTeam, player: currentPlayer, timestamp: ts })
        });
      };
      li.appendChild(delBtn);
      pointList.appendChild(li);
    });
  }
}

function updatePointsBeerpong(team) {
  const pointList = document.getElementById('pointListbeerpong');
  if (pointList) {
    pointList.innerHTML = '';
    team.beerpongpoints.forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      const delBtn = document.createElement('button');
      delBtn.textContent = '✖';
      delBtn.onclick = () => {
        fetch('/remove-point', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team: currentTeam, player: "BeerpongPointsAssignmentToTeam", timestamp: point })
        });
      };
      li.appendChild(delBtn);
      pointList.appendChild(li);
    });
  }
}

function updaterecentBeers(Beers) {
  if(document.getElementById('recentBeers') && Beers){
    const pointList = document.getElementById('recentBeers');
    if (pointList) {
      pointList.innerHTML = '';
      console.log("RecentBeers");
      console.dir(Beers);
      Beers.forEach((text, index) => {
        const li = document.createElement('li');
        li.textContent = `${text}`;
        pointList.appendChild(li);
      });
    }
  }
}


function addTeam() {
  const input = document.getElementById('newTeam');
  fetch('/add-team', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.value })
  });
  input.value = '';
}

function addPlayer() {
  const input = document.getElementById('newPlayer');
  if (!currentTeam) return;
  fetch('/add-player', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team: currentTeam, player: input.value })
  });
  input.value = '';
}

function addPoint() {
  const input = document.getElementById('newPoint');
  if (!currentTeam || !currentPlayer) return;
  fetch('/add-point', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team: currentTeam, player: currentPlayer, timestamp: input.value })
  });
  input.value = '';
}
function addPointBeerpong() {
  currentPlayer = "BeerpongPointsAssignmentToTeam"
  addPoint()
}


function updateDashboard_old(teams) {
  const ranking = document.getElementById('ranking');
  if (ranking) {
    ranking.innerHTML = '';
    const sorted = [...teams].map(team => {
      const score = team.players.reduce((sum, p) => sum + p.points.length, 0);
      return { name: team.name, points: score, members: team.players.length };
    }).sort((a, b) => b.points - a.points);

    sorted.forEach((team, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx + 1}</td><td>${team.name} (${team.members})</td><td>${team.points}</td>`;
      ranking.appendChild(tr);
    });
  }
}

// public/script.js – Dashboard automatische Seitenrotation


function updateDashboard(teams) {
  const ranking = document.getElementById('ranking');
  if (!ranking) return;

  const sorted = [...teams].map(team => {
    const score = team.players.reduce((sum, p) => sum + p.points.length, 0);
    const scoreBeerpong = team.beerpongpoints.length*beerpongpointValue;
    const tmpscoreTotal = score+scoreBeerpong;
    return { name: team.name, points: score, members: team.players.length,beerpongpoints: team.beerpongpoints,beerpongpointsMultiple: scoreBeerpong,scoreTotal:tmpscoreTotal };
  }).sort((a, b) => b.scoreTotal - a.scoreTotal);

  const totalPages = Math.ceil(sorted.length / teamsPerPage);
  const pageStart = currentPage * teamsPerPage;
  const pageItems = sorted.slice(pageStart, pageStart + teamsPerPage);

  ranking.innerHTML = '';
  pageItems.forEach((team, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${pageStart + idx + 1}</td><td>${team.name} (${team.members})</td><td>${team.points}</td><td>${team.beerpongpoints.length*beerpongpointValue}</td><td>${Math.round(team.scoreTotal/team.members*100)/100}</td><td>${team.scoreTotal}</td>`;
    ranking.appendChild(tr);
  });

  // automatische Seite umblättern
  currentPage = (currentPage + 1) % totalPages;
}

// alle 20 Sekunden auf nächste Seite umschalten
setInterval(() => {
  if (typeof lastTeams !== 'undefined') {
    updateDashboard(lastTeams);
  }
}, pageIntervalMs);

// globale Speicherung für socket.io Updates
let lastTeams = [];
socket.on('data-update', data => {
  lastTeams = data.teams;
  updateTeams(data.teams); // falls Adminbereich
  updateDashboard(data.teams);
});
