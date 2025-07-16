import requests
import json

url = "http://localhost:3000/add-player"
payload = {
    "team": "Team Blau",
    "player": "Max"
}
requests.post(url, json=payload)

url = "http://localhost:3000/add-team"
payload = {
  "name": "Team Alpha"
}

url = "http://localhost:3000/add-point"
payload = {
  "team": "Team Alpha",
  "player": "Alice",
  "timestamp": "2025-06-22T12:00:00Z"
}

url = "http://localhost:3000/remove-team"
payload = {
  "name": "Team Alpha"
}

url = "http://localhost:3000/remove-player"
payload = {
    "team": "Team Blau",
    "player": "Max"
}
url = "http://localhost:3000/remove-point"
payload = {
  "team": "Team Alpha",
  "player": "Alice",
  "timestamp": "2025-06-22T12:00:00Z"
}
