// jp-app.jsx — Canvas composition + mount.

const {
  Presenter, PresenterTeam,
  HostMobile, HostMobileTeam,
  PlayerJoin, PlayerBuzzer, PlayerBuzzed,
  PlayerJoinTeam, PlayerBuzzerTeam, PlayerBuzzedTeam,
  Homepage, BoardEditor,
} = window.JP;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="meta" title="App shell"
        subtitle="Self-host landing + board authoring — these sit outside the live game">
        <DCArtboard id="homepage" label="Homepage · Self-host landing" width={1280} height={1140}>
          <Homepage/>
        </DCArtboard>
        <DCArtboard id="editor" label="Board editor · Editing $600 clue" width={1440} height={900}>
          <BoardEditor/>
        </DCArtboard>
      </DCSection>

      <DCSection id="big-screen" title="Big screen · Solo mode"
        subtitle="1920 × 1080 · Presenter view (cast to TV)">
        <DCArtboard id="presenter" label="Presenter · Priya buzzed" width={1920} height={1080}>
          <Presenter/>
        </DCArtboard>
      </DCSection>

      <DCSection id="big-screen-teams" title="Big screen · Team mode"
        subtitle="Player cards collapse into 3 team cards; scores are summed per team">
        <DCArtboard id="presenter-team" label="Presenter · Team Encyclopedia buzzed" width={1920} height={1080}>
          <PresenterTeam/>
        </DCArtboard>
      </DCSection>

      <DCSection id="host" title="Host · Solo mode"
        subtitle="390 × 844 · Phone-first. Bottom tabs swap clue / board / players">
        <DCArtboard id="host-solo" label="Host · Judging Priya's buzz" width={390} height={844}>
          <HostMobile/>
        </DCArtboard>
      </DCSection>

      <DCSection id="host-team" title="Host · Team mode"
        subtitle="Same flow, but the player list groups by team and ± adjusts the team total">
        <DCArtboard id="host-team" label="Host · Judging Team Encyclopedia" width={390} height={844}>
          <HostMobileTeam/>
        </DCArtboard>
      </DCSection>

      <DCSection id="phone-solo" title="Player · Solo mode"
        subtitle="390 × 844 · Three states: Join → Ready → You're up">
        <DCArtboard id="phone-join" label="1 · Join the game" width={390} height={844}>
          <PlayerJoin/>
        </DCArtboard>
        <DCArtboard id="phone-ready" label="2 · Ready to buzz" width={390} height={844}>
          <PlayerBuzzer/>
        </DCArtboard>
        <DCArtboard id="phone-buzzed" label="3 · You're up!" width={390} height={844}>
          <PlayerBuzzed/>
        </DCArtboard>
      </DCSection>

      <DCSection id="phone-team" title="Player · Team mode"
        subtitle="Pick a team on join; buzzer + score reflect your team's color and total">
        <DCArtboard id="phone-join-t" label="1 · Pick your team & join" width={390} height={844}>
          <PlayerJoinTeam/>
        </DCArtboard>
        <DCArtboard id="phone-ready-t" label="2 · Ready to buzz for the team" width={390} height={844}>
          <PlayerBuzzerTeam/>
        </DCArtboard>
        <DCArtboard id="phone-buzzed-t" label="3 · Your team's up!" width={390} height={844}>
          <PlayerBuzzedTeam/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
