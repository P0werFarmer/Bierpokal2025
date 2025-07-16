import requests
import csv
import os

# Pfad zur CSV-Datei
csv_filename = os.path.join(os.path.dirname(__file__), "Beachcup2025Teilnehmer20250716.csv")

# URLs
add_team_url = "http://localhost:3000/add-team"
add_player_url = "http://localhost:3000/add-player"

# Liste der bereits angelegten Teams (um doppelte Anfragen zu vermeiden)
created_teams = set()

# CSV einlesen mit Windows-Codierung (Excel-kompatibel)
with open(csv_filename, mode="r", encoding="cp1252") as csvfile:
    reader = csv.reader(csvfile, delimiter=";")
    
    for row in reader:
        if len(row) < 2 or not row[0].strip() or not row[1].strip():
            continue

        team = row[0].strip()
        player = row[1].strip()

        # Team anlegen, falls noch nicht vorhanden
        if team not in created_teams:
            team_payload = {"name": team}
            try:
                response = requests.post(add_team_url, json=team_payload)
                print(f"Team erstellt: {team} -> Antwort: {response.status_code}")
                if response.status_code == 200:
                    created_teams.add(team)
                else:
                    print(f"Fehler beim Erstellen von Team '{team}'")
            except Exception as e:
                print(f"Fehler beim Team-POST für {team}: {e}")
                continue  # wenn Team-Erstellung fehlschlägt, überspringe Spieler

        # Spieler hinzufügen
        player_payload = {
            "team": team,
            "player": player
        }

        try:
            response = requests.post(add_player_url, json=player_payload)
            print(f"Spieler hinzugefügt: {player} zu {team} -> Antwort: {response.status_code}")
        except Exception as e:
            print(f"Fehler beim Spieler-POST für {player}: {e}")
