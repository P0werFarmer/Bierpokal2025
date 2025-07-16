import requests
import json

url = "http://localhost:3000/add-player"
payload = {
    "team": "Team Alpha",
    "player": "Maxi"
}
requests.post(url, json=payload)
