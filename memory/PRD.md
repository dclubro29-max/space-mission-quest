# Mission: Gratziella — NASA Space Apps 2026 (Space Mission Design Game)

## Problem statement
Cartoon game for middle-school kids, in English. B.O.B., a sarcastic robot, introduces the story and tells the user's jokes. Then 3 levels: puzzle, quiz (based on the training), and repairs during the flight (3 mistakes = explosion). Win ending: the colony Gratziella welcomes the player. Lose ending: the rocket explodes, B.O.B. drifts to Mars, puts a flower on a grave and says "Stoooopids!". The 6 colony members appear at the end either way, then the credits (Andreea Vladu, Maria Cojocaru, Ionuț Ivanici, Goran Giuchici, Patrick Drăghina).

## Architecture
- React (no router), stage machine in App.js, game files in src/game/ (data.js, story.js, sound.js using Web Audio, screens/*)
- FastAPI: POST/GET /api/scores (Mongo `scores`, top 10)
- Assets in /public/game (user's characters + generated backgrounds)

## Implemented (2026-06)
- Title + cadet name, intro and training dialogues, door joke, 15 training cards
- L1 4x3 swap puzzle (tap/drag, peek), L2 quiz with 10 of 15 questions (7 needed to pass, retry on fail), cargo check (mass limit of 100 kg), launch countdown
- L3: 8 malfunctions, 3 lives; win and lose endings; colony screen; credits roll + leaderboard; mute button

## Backlog
- P1: keyboard play for the puzzle, save progress when the page reloads, retry Level 3 without starting over, ask before publishing a name to the leaderboard, check scores on the server
- P2: team mode (up to 4 players), more mission trade-offs (budget and power), difficulty levels
