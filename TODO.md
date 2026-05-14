- [ ] test buzz timing is correct

- [x] use the 3d jeoparty logo in more places

- [x] remove per-clue timer option from game start menu in dashboard
- [x] make the rest of the game options in the dashboard work (e.g. daily double toggle, sound effects toggle, shuffle categories)
- [ ] team mode
  - [ ] start game with any number of teams
  - [ ] can change number of teams in lobby
  - [x] when the game starts, team members suggest a name then the entire team votes on the name and the most popular name is chosen (ties are broken randomly)
  - [ ] teams just add up their members' scores, the gameplay doesnt change much
  - [ ] make the various ui elements (e.g. score display) and modes (host, player, presenter) work with teams instead and individual players

- [x] rejoin game functionality for players who disconnect
  - [x] if a player disconnects, they can go to /join and they will see a button to rejoin the game they were in
  - [x] their game is stored via a cookie or something so it persists even if they refresh the page

- [x] require unique player names when joining a game
- [x] figure out and standardize player avatars. likely just colored rounded squares with different shapes holes in the middle, giving a lot of unique combinations without needing to store custom images or anything. 
  - [x] players can choose their avatar when they join a game, and they can change it in the lobby while waiting for the game to start. make sure they never get an avatar that's already taken by someone else in the same game

- [x] players should not be able to buzz twice for the same clue. if they get it wrong, they are locked out from buzzing again until the next clue.
- [ ] the first player to join is the first to pick a clue. the board should not be shown to them until the intro is over

- [x] the "next" button for the host doesnt work (at least to go to final jeopardy). final jeopardy should not happen automatically, the host should have to click next. but next should also work.

- [ ] run subagents to find all ui features that are not yet functional

- [ ] run subagents to make sure state recovery fully works for all possible game states (should even survive server restarts, currently does not)

- [x] for the host login flow on their mobile device, when redirecting to login, use a query param to indicate that the login modal should be shown (currently it just sends them to the homepage, doesnt actually say to login)

- [ ] animate the game results at the end of the game, starting from lowest score to highest score, with the winning team/player doing a little dance or something