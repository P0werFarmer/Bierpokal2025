import requests
import json

url = "http://localhost:3000/add-point"
payload = {
  "player": "Matze",
  "timestamp": "Bier-2"
}
requests.post(url, json=payload)