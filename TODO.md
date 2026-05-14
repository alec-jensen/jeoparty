- [ ] test buzz timing is correct

- [ ] use the 3d jeoparty logo in more places

- [ ] remove per-clue timer option from game start menu in dashboard
- [ ] make the rest of the game options in the dashboard work (e.g. daily double toggle, sound effects toggle, shuffle categories)
- [ ] team mode
  - [ ] start game with any number of teams
  - [ ] can change number of teams in lobby
  - [ ] when the game starts, team members suggest a name then the entire team votes on the name and the most popular name is chosen (ties are broken randomly)
  - [ ] teams just add up their members' scores, the gameplay doesnt change much
  - [ ] make the various ui elements (e.g. score display) and modes (host, player, presenter) work with teams instead and individual players

- [ ] rejoin game functionality for players who disconnect
  - [ ] if a player disconnects, they can go to /join and they will see a button to rejoin the game they were in
  - [ ] their game is stored via a cookie or something so it persists even if they refresh the page

- [ ] require unique player names when joining a game
- [ ] figure out and standardize player avatars. likely just colored rounded squares with different shapes holes in the middle, giving a lot of unique combinations without needing to store custom images or anything. 
  - [ ] players can choose their avatar when they join a game, and they can change it in the lobby while waiting for the game to start. make sure they never get an avatar that's already taken by someone else in the same game

- [ ] players should not be able to buzz twice for the same clue. if they get it wrong, they are locked out from buzzing again until the next clue.
- [ ] the first player to join is the first to pick a clue. the board should not be shown to them until the intro is over

- [ ] the "next" button for the host doesnt work (at least to go to final jeopardy). final jeopardy should not happen automatically, the host should have to click next. but next should also work.