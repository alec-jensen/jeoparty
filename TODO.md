- [ ] team mode
  - [ ] start game with any number of teams
  - [ ] can change number of teams in lobby
  - [x] when the game starts, team members suggest a name then the entire team votes on the name and the most popular name is chosen (ties are broken randomly)
  - [ ] teams just add up their members' scores, the gameplay doesnt change much
  - [ ] make the various ui elements (e.g. score display) and modes (host, player, presenter) work with teams instead and individual players

# playtest results

- [x] player state isnt exactly recovered correctly (although players can still play after a refresh, they just lose the ability to buzz for the current clue) *FIXED PARTIALLY - final jeopardy state is still not recovered correctly, but everything else is*

- [ ] if a player client disconnects or breaks or anything during final jeopardy before they submit their answer, the game gets hard locked with no way to continue *not tested if fixed yet, supposedly fixed*

- [ ] scrolling the board on player mode, the scroll position gets reset
- [ ] when entering wager for daily double, the text entry gets reset after a time
- [ ] both of these issues are due to the client dom being rerendered when it shouldnt be, need to fix the state management and component structure to avoid this

- [ ] players shouldnt be able to change avatar mid game (they can change it client side only, but that shouldnt be allowed and it shouldnt change for other players)