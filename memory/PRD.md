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

## Iteration 2 (2026-06)
- Bigger, centered rocket on the launch screen
- Bad ending: large glowing flower, 5 emotional B.O.B. lines, tears
- Good ending: new Explore screen (7 places on the Mars/Gratziella World map with facts and B.O.B. jokes; 4 needed before meeting the colony)

## Iteration 3 (2026-06): EXPLORE MARS update
- New mode in src/mars/: a 2D top-down open world drawn on canvas (Mars surface 180x180 tiles + underground layer 120x120), generated from a fixed seed with mountains, craters, polar ice, roads, caves and tunnels
- 15 story missions (the missing Ares-7 expedition, Dr. Vega, the B.O.B. twist, The Hollow, 3 endings + a secret ending), 30 side quests from 7 NPCs, 12 science discoveries, 12 relics, 5 Easter eggs, 25 achievements
- Mining, a 3D printer, upgrades, a market with daily prices, 7 colony buildings with production every sol, a habitat to decorate and sleep in
- Oxygen, health, energy and radiation, day/night, weather and dust storms, emergencies (solar flare, meteors, rescue, suit leak)
- Rover, jetpack, world map with fog and waypoints, navigation arrow, inventory, autosave to localStorage, touch joystick
- Unlocks after winning Level 3 (localStorage flag); entry from the credits screen and the title screen
- No multiplayer (user's choice)

## Iteration 4 (2026-06): EXPLORE MARS 2.1 + flow fix
- After landing (good ending), Explore Mars opens directly. Menu > Save & finish leads to the colony and then the credits (from the title screen it returns to the title). The Explore Mars button was removed from the credits
- The credits use the player's name (there's no default "Alex" any more; the name field is empty, fallback "Rookie"); the Mars save uses the current name
- 2.1: messages when there aren't enough credits or resources, supplies are not used when the stat is already full, 120 starting credits, the Queen is preferred as the talk target
- New in src/mars/living.js, content2.js, LivingPanels.jsx: NPC schedules (work/market/plaza/sleep), colony levels with houses and colonists, festivals with fireworks, Residential/Market Street/Spaceport/Robot Factory, mining robots, rover paint and decals, 8 underground chests + treasure map, 4 real abandoned spacecraft, space tourism, race against B.O.B., 3 daily challenges, 5 rare world events, the secret city of Aurelia + Mayor Lux + luxury shop, alien encounter at the Black Monolith, 5 secret missions, 6 animated cutscenes, Photo Mode with filters + in-game album (localStorage, 12 photos), particles, coloured glows, dusk, aurora, comet, new sounds

## Backlog
- P1: keyboard play for the puzzle, save progress when the page reloads, retry Level 3 without starting over, ask before publishing a name to the leaderboard, check scores on the server
- P1: messages when there aren't enough credits or resources, block using supplies when the stat is already full, Queen as the preferred first talk target
- P2: real-time multiplayer / shared colony, team mode (up to 4 players), more mission trade-offs (budget and power), difficulty levels
