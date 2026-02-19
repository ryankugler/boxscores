// import { useState } from "react";

// // ESPN CDN logos - publicly accessible
// const LOGOS = {
//   LAL: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
//   DAL: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
//   OKC: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
//   MIL: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
//   UTA: "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
//   POR: "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
// };

// const TEAM_COLORS = {
//   LAL: { dark: "#FDB927", light: "#552583" },
//   DAL: { dark: "#6CB4E8", light: "#0053BC" },
//   OKC: { dark: "#EF3B24", light: "#007AC1" },
//   MIL: { dark: "#88cc88", light: "#00471B" },
//   UTA: { dark: "#7BA4D9", light: "#002B5C" },
//   POR: { dark: "#E03A3E", light: "#C8102E" },
// };

// function getAccent(team, dark) {
//   const c = TEAM_COLORS[team];
//   return c ? (dark ? c.dark : c.light) : (dark ? "#e8401a" : "#cc3300");
// }

// const GAMES = [
//   {
//     id: "lal-dal",
//     date: "Feb 13, 2026",
//     home: "LAL", away: "DAL",
//     homeTeam: "Los Angeles Lakers", awayTeam: "Dallas Mavericks",
//     score: { LAL: 124, DAL: 104 },
//     periods: { "1": { LAL: 36, DAL: 31 }, "2": { LAL: 28, DAL: 32 }, "3": { LAL: 32, DAL: 19 }, "4": { LAL: 28, DAL: 22 } },
//     players: {
//       LAL: [
//         { name: "LeBron James",       pos: "F", fgm: 10, fga: 20, p3m: 2, p3a: 7,  ftm: 6, fta: 7,  pts: 28, reb: 10, ast: 12, stl: 0, blk: 1, to: 4 },
//         { name: "Rui Hachimura",      pos: "F", fgm: 9,  fga: 13, p3m: 3, p3a: 4,  ftm: 0, fta: 0,  pts: 21, reb: 3,  ast: 1,  stl: 1, blk: 0, to: 1 },
//         { name: "Austin Reaves",      pos: "G", fgm: 5,  fga: 10, p3m: 1, p3a: 3,  ftm: 7, fta: 9,  pts: 18, reb: 4,  ast: 6,  stl: 0, blk: 0, to: 2 },
//         { name: "Jaxson Hayes",       pos: "C", fgm: 8,  fga: 10, p3m: 0, p3a: 0,  ftm: 0, fta: 0,  pts: 16, reb: 7,  ast: 4,  stl: 3, blk: 1, to: 1 },
//         { name: "Jake LaRavia",       pos: "G", fgm: 4,  fga: 6,  p3m: 0, p3a: 1,  ftm: 3, fta: 3,  pts: 11, reb: 3,  ast: 2,  stl: 0, blk: 0, to: 2 },
//         { name: "Marcus Smart",       pos: "G", fgm: 4,  fga: 14, p3m: 1, p3a: 9,  ftm: 0, fta: 0,  pts: 9,  reb: 2,  ast: 6,  stl: 1, blk: 1, to: 0 },
//         { name: "Jarred Vanderbilt",  pos: "F", fgm: 2,  fga: 3,  p3m: 1, p3a: 2,  ftm: 0, fta: 0,  pts: 5,  reb: 6,  ast: 0,  stl: 2, blk: 0, to: 1 },
//         { name: "Maxi Kleber",        pos: "F", fgm: 2,  fga: 3,  p3m: 1, p3a: 2,  ftm: 0, fta: 0,  pts: 5,  reb: 1,  ast: 0,  stl: 0, blk: 0, to: 1 },
//         { name: "Bronny James",       pos: "G", fgm: 0,  fga: 1,  p3m: 0, p3a: 1,  ftm: 0, fta: 0,  pts: 0,  reb: 0,  ast: 0,  stl: 0, blk: 0, to: 0 },
//         { name: "Drew Timme",         pos: "F", fgm: 0,  fga: 0,  p3m: 0, p3a: 0,  ftm: 0, fta: 0,  pts: 0,  reb: 0,  ast: 1,  stl: 0, blk: 0, to: 0 },
//         { name: "Dalton Knecht",      pos: "F", fgm: 0,  fga: 0,  p3m: 0, p3a: 0,  ftm: 0, fta: 0,  pts: 0,  reb: 1,  ast: 0,  stl: 0, blk: 0, to: 0 },
//       ],
//       DAL: [
//         { name: "Naji Marshall",      pos: "F",   fgm: 8,  fga: 13, p3m: 0, p3a: 3, ftm: 3, fta: 5,  pts: 19, reb: 2,  ast: 4,  stl: 2, blk: 0, to: 2 },
//         { name: "P.J. Washington",    pos: "F",   fgm: 5,  fga: 10, p3m: 1, p3a: 4, ftm: 7, fta: 8,  pts: 18, reb: 4,  ast: 2,  stl: 0, blk: 0, to: 0 },
//         { name: "Brandon Williams",   pos: "G",   fgm: 6,  fga: 11, p3m: 1, p3a: 3, ftm: 4, fta: 5,  pts: 17, reb: 5,  ast: 7,  stl: 1, blk: 0, to: 4 },
//         { name: "Klay Thompson",      pos: "G",   fgm: 4,  fga: 8,  p3m: 1, p3a: 3, ftm: 0, fta: 0,  pts: 9,  reb: 3,  ast: 0,  stl: 1, blk: 0, to: 4 },
//         { name: "Khris Middleton",    pos: "F",   fgm: 3,  fga: 11, p3m: 1, p3a: 5, ftm: 1, fta: 1,  pts: 8,  reb: 1,  ast: 1,  stl: 0, blk: 0, to: 1 },
//         { name: "Marvin Bagley III",  pos: "F",   fgm: 3,  fga: 7,  p3m: 0, p3a: 1, ftm: 1, fta: 2,  pts: 7,  reb: 4,  ast: 0,  stl: 1, blk: 0, to: 0 },
//         { name: "Tyus Jones",         pos: "G",   fgm: 1,  fga: 3,  p3m: 1, p3a: 3, ftm: 0, fta: 0,  pts: 3,  reb: 0,  ast: 3,  stl: 1, blk: 0, to: 1 },
//         { name: "Daniel Gafford",     pos: "C",   fgm: 1,  fga: 2,  p3m: 0, p3a: 0, ftm: 0, fta: 0,  pts: 2,  reb: 6,  ast: 1,  stl: 0, blk: 1, to: 2 },
//         { name: "Dwight Powell",      pos: "F-C", fgm: 1,  fga: 1,  p3m: 0, p3a: 0, ftm: 0, fta: 0,  pts: 2,  reb: 1,  ast: 0,  stl: 0, blk: 0, to: 0 },
//         { name: "AJ Johnson",         pos: "G",   fgm: 0,  fga: 1,  p3m: 0, p3a: 0, ftm: 0, fta: 0,  pts: 0,  reb: 1,  ast: 0,  stl: 0, blk: 0, to: 0 },
//       ],
//     },
//   },
//   {
//     id: "okc-mil",
//     date: "Feb 13, 2026",
//     home: "OKC", away: "MIL",
//     homeTeam: "Oklahoma City Thunder", awayTeam: "Milwaukee Bucks",
//     score: { OKC: 93, MIL: 110 },
//     periods: { "1": { OKC: 25, MIL: 30 }, "2": { OKC: 30, MIL: 37 }, "3": { OKC: 18, MIL: 22 }, "4": { OKC: 20, MIL: 21 } },
//     players: {
//       OKC: [
//         { name: "Isaiah Joe",         pos: "G", fgm: 5, fga: 11, p3m: 4, p3a: 9,  ftm: 3, fta: 3, pts: 17, reb: 4,  ast: 2, stl: 0, blk: 0, to: 0 },
//         { name: "Chet Holmgren",      pos: "C", fgm: 5, fga: 12, p3m: 0, p3a: 4,  ftm: 6, fta: 6, pts: 16, reb: 13, ast: 4, stl: 0, blk: 2, to: 0 },
//         { name: "Jared McCain",       pos: "G", fgm: 3, fga: 9,  p3m: 2, p3a: 6,  ftm: 5, fta: 6, pts: 13, reb: 3,  ast: 2, stl: 0, blk: 0, to: 2 },
//         { name: "Luguentz Dort",      pos: "F", fgm: 4, fga: 12, p3m: 1, p3a: 6,  ftm: 0, fta: 0, pts: 9,  reb: 2,  ast: 1, stl: 1, blk: 0, to: 2 },
//         { name: "Alex Caruso",        pos: "G", fgm: 3, fga: 6,  p3m: 3, p3a: 4,  ftm: 0, fta: 0, pts: 9,  reb: 3,  ast: 1, stl: 1, blk: 0, to: 2 },
//         { name: "Aaron Wiggins",      pos: "G", fgm: 2, fga: 6,  p3m: 1, p3a: 2,  ftm: 0, fta: 0, pts: 5,  reb: 4,  ast: 2, stl: 1, blk: 0, to: 4 },
//         { name: "Cason Wallace",      pos: "G", fgm: 1, fga: 7,  p3m: 0, p3a: 2,  ftm: 1, fta: 2, pts: 3,  reb: 2,  ast: 3, stl: 0, blk: 2, to: 0 },
//         { name: "Buddy Boeheim",      pos: "F", fgm: 1, fga: 2,  p3m: 1, p3a: 2,  ftm: 0, fta: 0, pts: 3,  reb: 0,  ast: 0, stl: 0, blk: 0, to: 0 },
//         { name: "Brooks Barnhizer",   pos: "G", fgm: 0, fga: 2,  p3m: 0, p3a: 1,  ftm: 0, fta: 0, pts: 0,  reb: 5,  ast: 2, stl: 0, blk: 1, to: 0 },
//       ],
//       MIL: [
//         { name: "Ousmane Dieng",           pos: "F", fgm: 7, fga: 12, p3m: 3, p3a: 6,  ftm: 2, fta: 4, pts: 19, reb: 11, ast: 6, stl: 1, blk: 4, to: 0 },
//         { name: "AJ Green",                pos: "G", fgm: 6, fga: 14, p3m: 5, p3a: 11, ftm: 0, fta: 0, pts: 17, reb: 2,  ast: 3, stl: 1, blk: 0, to: 0 },
//         { name: "Bobby Portis",            pos: "F", fgm: 6, fga: 11, p3m: 3, p3a: 6,  ftm: 0, fta: 0, pts: 15, reb: 12, ast: 3, stl: 4, blk: 0, to: 1 },
//         { name: "Kyle Kuzma",              pos: "F", fgm: 5, fga: 15, p3m: 2, p3a: 6,  ftm: 2, fta: 2, pts: 14, reb: 4,  ast: 2, stl: 0, blk: 0, to: 0 },
//         { name: "Cam Thomas",              pos: "G", fgm: 5, fga: 13, p3m: 1, p3a: 6,  ftm: 1, fta: 1, pts: 12, reb: 1,  ast: 2, stl: 0, blk: 0, to: 1 },
//         { name: "Kevin Porter Jr.",        pos: "G", fgm: 6, fga: 15, p3m: 0, p3a: 1,  ftm: 0, fta: 0, pts: 12, reb: 3,  ast: 7, stl: 3, blk: 0, to: 3 },
//         { name: "Pete Nance",              pos: "F", fgm: 4, fga: 6,  p3m: 3, p3a: 5,  ftm: 0, fta: 0, pts: 11, reb: 7,  ast: 2, stl: 0, blk: 1, to: 1 },
//         { name: "Jericho Sims",            pos: "C", fgm: 4, fga: 5,  p3m: 0, p3a: 0,  ftm: 0, fta: 0, pts: 8,  reb: 5,  ast: 0, stl: 0, blk: 1, to: 3 },
//         { name: "Andre Jackson Jr.",       pos: "G", fgm: 1, fga: 1,  p3m: 0, p3a: 0,  ftm: 0, fta: 0, pts: 2,  reb: 3,  ast: 0, stl: 0, blk: 0, to: 1 },
//         { name: "Gary Trent Jr.",          pos: "G", fgm: 0, fga: 3,  p3m: 0, p3a: 1,  ftm: 0, fta: 0, pts: 0,  reb: 0,  ast: 0, stl: 0, blk: 0, to: 0 },
//         { name: "Thanasis Antetokounmpo",  pos: "F", fgm: 0, fga: 0,  p3m: 0, p3a: 0,  ftm: 0, fta: 0, pts: 0,  reb: 1,  ast: 0, stl: 0, blk: 0, to: 0 },
//       ],
//     },
//   },
//   {
//     id: "uta-por",
//     date: "Feb 13, 2026",
//     home: "UTA", away: "POR",
//     homeTeam: "Utah Jazz", awayTeam: "Portland Trail Blazers",
//     score: { UTA: 119, POR: 135 },
//     periods: { "1": { UTA: 31, POR: 28 }, "2": { UTA: 32, POR: 33 }, "3": { UTA: 23, POR: 40 }, "4": { UTA: 33, POR: 34 } },
//     players: {
//       UTA: [
//         { name: "Brice Sensabaugh",   pos: "G",   fgm: 8,  fga: 19, p3m: 5, p3a: 11, ftm: 7, fta: 9,  pts: 28, reb: 4,  ast: 0, stl: 0, blk: 0, to: 1 },
//         { name: "Ace Bailey",         pos: "F",   fgm: 7,  fga: 15, p3m: 1, p3a: 5,  ftm: 0, fta: 0,  pts: 15, reb: 8,  ast: 3, stl: 0, blk: 0, to: 4 },
//         { name: "Isaiah Collier",     pos: "G",   fgm: 3,  fga: 8,  p3m: 0, p3a: 0,  ftm: 9, fta: 12, pts: 15, reb: 2,  ast: 9, stl: 3, blk: 0, to: 4 },
//         { name: "Svi Mykhailiuk",     pos: "G-F", fgm: 5,  fga: 8,  p3m: 4, p3a: 5,  ftm: 0, fta: 0,  pts: 14, reb: 1,  ast: 3, stl: 1, blk: 0, to: 2 },
//         { name: "Cody Williams",      pos: "F",   fgm: 4,  fga: 9,  p3m: 0, p3a: 3,  ftm: 1, fta: 1,  pts: 9,  reb: 2,  ast: 3, stl: 2, blk: 1, to: 4 },
//         { name: "John Konchar",       pos: "G",   fgm: 2,  fga: 7,  p3m: 0, p3a: 3,  ftm: 2, fta: 3,  pts: 6,  reb: 7,  ast: 3, stl: 3, blk: 2, to: 0 },
//         { name: "Vince Williams Jr.", pos: "G",   fgm: 3,  fga: 5,  p3m: 0, p3a: 1,  ftm: 0, fta: 0,  pts: 6,  reb: 3,  ast: 0, stl: 0, blk: 0, to: 1 },
//         { name: "Oscar Tshiebwe",     pos: "F-C", fgm: 0,  fga: 0,  p3m: 0, p3a: 0,  ftm: 0, fta: 0,  pts: 0,  reb: 1,  ast: 3, stl: 0, blk: 0, to: 0 },
//       ],
//       POR: [
//         { name: "Jrue Holiday",       pos: "G",   fgm: 10, fga: 15, p3m: 4, p3a: 8, ftm: 7, fta: 9,  pts: 31, reb: 9,  ast: 7, stl: 0, blk: 0, to: 1 },
//         { name: "Donovan Clingan",    pos: "C",   fgm: 8,  fga: 12, p3m: 0, p3a: 1, ftm: 7, fta: 9,  pts: 23, reb: 18, ast: 7, stl: 0, blk: 3, to: 0 },
//         { name: "Jerami Grant",       pos: "G",   fgm: 7,  fga: 17, p3m: 2, p3a: 8, ftm: 2, fta: 2,  pts: 18, reb: 3,  ast: 0, stl: 1, blk: 2, to: 4 },
//         { name: "Scoot Henderson",    pos: "G",   fgm: 4,  fga: 6,  p3m: 2, p3a: 4, ftm: 5, fta: 6,  pts: 15, reb: 1,  ast: 4, stl: 1, blk: 0, to: 6 },
//         { name: "Vit Krejci",         pos: "G",   fgm: 4,  fga: 9,  p3m: 2, p3a: 6, ftm: 1, fta: 2,  pts: 11, reb: 5,  ast: 2, stl: 1, blk: 1, to: 1 },
//         { name: "Caleb Love",         pos: "G",   fgm: 4,  fga: 12, p3m: 3, p3a: 8, ftm: 0, fta: 0,  pts: 11, reb: 0,  ast: 2, stl: 0, blk: 0, to: 0 },
//         { name: "Sidy Cissoko",       pos: "F",   fgm: 3,  fga: 4,  p3m: 1, p3a: 2, ftm: 1, fta: 1,  pts: 8,  reb: 4,  ast: 1, stl: 2, blk: 0, to: 1 },
//         { name: "Rayan Rupert",       pos: "G-F", fgm: 1,  fga: 4,  p3m: 0, p3a: 1, ftm: 0, fta: 0,  pts: 2,  reb: 4,  ast: 0, stl: 1, blk: 0, to: 2 },
//         { name: "Yang Hansen",        pos: "C",   fgm: 0,  fga: 1,  p3m: 0, p3a: 0, ftm: 2, fta: 2,  pts: 2,  reb: 0,  ast: 0, stl: 0, blk: 0, to: 0 },
//         { name: "Javonte Cooke",      pos: "G",   fgm: 0,  fga: 0,  p3m: 0, p3a: 0, ftm: 0, fta: 0,  pts: 0,  reb: 0,  ast: 0, stl: 0, blk: 0, to: 0 },
//       ],
//     },
//   },
// ];

// const COLS    = ["FGM/A", "3PM/A", "FTM/A", "PTS", "REB", "AST", "STL", "BLK", "TO"];
// const COL_KEY = { "FGM/A": "fgm", "3PM/A": "p3m", "FTM/A": "ftm", PTS: "pts", REB: "reb", AST: "ast", STL: "stl", BLK: "blk", TO: "to" };

// function mkTheme(dark) {
//   return dark ? {
//     pageBg: "#0a0a0f", headerBg: "#0d0d1a", cardBg: "#16162e", altRowBg: "#13132a",
//     border: "#1e1e3a", hoverBg: "#1d1d36", subHeader: "#0d0d1a", divider: "#1a1a32",
//     textPrimary: "#f0f0fa", textSecond: "#ccccdd", textMuted: "#555570", textDim: "#888899",
//     textMono: "#aaaacc", posColor: "#444460",
//     badgeOff: "#1e1e3a", badgeTextOff: "#555570", badgeTextOn: "#000",
//     scoreDim: "#606080", toWarn: "#ff6666", toggleBg: "#2a2a4a", toggleLabel: "#888899",
//   } : {
//     pageBg: "#eef0f8", headerBg: "#ffffff", cardBg: "#ffffff", altRowBg: "#f6f7fc",
//     border: "#dde0ee", hoverBg: "#eaecf8", subHeader: "#f4f5fb", divider: "#e2e4f0",
//     textPrimary: "#0a0a1e", textSecond: "#2a2a4a", textMuted: "#9090aa", textDim: "#aaaacc",
//     textMono: "#555577", posColor: "#b0b0cc",
//     badgeOff: "#e8eaf6", badgeTextOff: "#9090aa", badgeTextOn: "#ffffff",
//     scoreDim: "#b8b8d0", toWarn: "#cc2222", toggleBg: "#c8cae0", toggleLabel: "#9090aa",
//   };
// }

// function TeamLogo({ abbr, size = 28, style = {} }) {
//   const src = LOGOS[abbr];
//   if (!src) return <span style={{ width: size, height: size, display: "inline-block", flexShrink: 0, ...style }} />;
//   return (
//     <img
//       src={src}
//       alt={abbr}
//       width={size}
//       height={size}
//       style={{ objectFit: "contain", display: "block", flexShrink: 0, ...style }}
//       onError={e => { e.target.style.visibility = "hidden"; }}
//     />
//   );
// }

// export default function App() {
//   const [selectedGame, setSelectedGame] = useState(GAMES[0]);
//   const [activeTeam,   setActiveTeam]   = useState(GAMES[0].home);
//   const [sortCol,      setSortCol]      = useState("pts");
//   const [sortDir,      setSortDir]      = useState(-1);
//   const [animKey,      setAnimKey]      = useState(0);
//   const [dark,         setDark]         = useState(true);

//   const T       = mkTheme(dark);
//   const game    = selectedGame;
//   const accent  = getAccent(activeTeam, dark);
//   const winTeam = game.score[game.home] > game.score[game.away] ? game.home : game.away;
//   const players = game.players[activeTeam] || [];
//   const sorted  = [...players].sort((a, b) => sortDir * ((b[sortCol] ?? 0) - (a[sortCol] ?? 0)));

//   const handleGameSelect = (g) => {
//     setSelectedGame(g); setActiveTeam(g.home);
//     setSortCol("pts"); setSortDir(-1); setAnimKey(k => k + 1);
//   };
//   const handleTeamSwitch = (team) => {
//     setActiveTeam(team); setSortCol("pts"); setSortDir(-1); setAnimKey(k => k + 1);
//   };
//   const handleSort = (col) => {
//     const key = COL_KEY[col];
//     if (sortCol === key) setSortDir(d => -d);
//     else { setSortCol(key); setSortDir(-1); }
//   };

//   const teamName = (abbr) => abbr === game.home ? game.homeTeam : game.awayTeam;
//   const TR = { transition: "background 0.22s, color 0.22s, border-color 0.22s" };

//   return (
//     <div style={{ minHeight: "100vh", background: T.pageBg, fontFamily: "'Barlow Condensed', sans-serif", color: T.textPrimary, ...TR }}>
//       <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

//       {/* ── HEADER ── */}
//       <div style={{ background: T.headerBg, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: "14px", ...TR }}>
//         <div style={{ background: "#e8401a", color: "#fff", fontWeight: 900, fontSize: "12px", letterSpacing: "3px", padding: "4px 10px", flexShrink: 0 }}>
//           NBA
//         </div>
//         <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>Box Scores</span>
//         <span style={{ fontSize: "12px", color: T.textMuted, letterSpacing: "1px", fontWeight: 500 }}>Last 7 Days</span>
//         <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
//           <span style={{ fontSize: "11px", color: T.toggleLabel, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
//             {dark ? "Dark" : "Light"}
//           </span>
//           <button onClick={() => setDark(d => !d)} aria-label="Toggle theme"
//             style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px",
//               border: `1px solid ${T.border}`, background: T.toggleBg, cursor: "pointer",
//               transition: "background 0.25s", padding: 0, flexShrink: 0 }}>
//             <span style={{ position: "absolute", top: "3px", left: dark ? "22px" : "3px",
//               width: "16px", height: "16px", borderRadius: "50%",
//               background: dark ? "#FDB927" : "#552583",
//               transition: "left 0.22s, background 0.22s",
//               display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px" }}>
//               {dark ? "🌙" : "☀️"}
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* ── GAME SELECTOR ── */}
//       <div style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${T.border}`, background: T.pageBg, ...TR }}>
//         {GAMES.map((g) => {
//           const isSel  = g.id === game.id;
//           const winner = g.score[g.home] > g.score[g.away] ? g.home : g.away;
//           const hAc    = getAccent(g.home, dark);
//           const aAc    = getAccent(g.away, dark);
//           return (
//             <button key={g.id} onClick={() => handleGameSelect(g)}
//               style={{ background: isSel ? T.cardBg : "transparent", border: "none",
//                 borderTop: `3px solid ${isSel ? "#e8401a" : "transparent"}`,
//                 padding: "12px 20px 16px", cursor: "pointer", minWidth: "200px",
//                 transition: "background 0.15s" }}>
//               <div style={{ fontSize: "10px", color: T.textMuted, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>
//                 {g.date}
//               </div>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
//                 {/* Away */}
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px" }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
//                     <TeamLogo abbr={g.away} size={22} />
//                     <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "1px", color: winner === g.away ? T.textPrimary : T.scoreDim }}>
//                       {g.away}
//                     </span>
//                   </div>
//                   <span style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1, paddingLeft: "29px",
//                     color: winner === g.away ? (isSel ? aAc : T.textPrimary) : T.scoreDim }}>
//                     {g.score[g.away]}
//                   </span>
//                 </div>
//                 <div style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700 }}>@</div>
//                 {/* Home */}
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
//                     <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "1px", color: winner === g.home ? T.textPrimary : T.scoreDim }}>
//                       {g.home}
//                     </span>
//                     <TeamLogo abbr={g.home} size={22} />
//                   </div>
//                   <span style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1, paddingRight: "29px",
//                     color: winner === g.home ? (isSel ? hAc : T.textPrimary) : T.scoreDim }}>
//                     {g.score[g.home]}
//                   </span>
//                 </div>
//               </div>
//             </button>
//           );
//         })}
//       </div>

//       <div style={{ padding: "0 28px 40px" }}>

//         {/* ── QUARTER BREAKDOWN ── */}
//         <div style={{ background: T.cardBg, padding: "16px 22px", borderBottom: `1px solid ${T.border}`, ...TR }}>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
//             <thead>
//               <tr>
//                 <th style={{ textAlign: "left", color: T.textMuted, fontWeight: 700, letterSpacing: "1px", padding: "3px 12px 3px 0", textTransform: "uppercase" }}>Team</th>
//                 {["Q1", "Q2", "Q3", "Q4", "FINAL"].map(q => (
//                   <th key={q} style={{ textAlign: "center", color: T.textMuted, fontWeight: 700, letterSpacing: "1px", padding: "3px 14px", textTransform: "uppercase" }}>{q}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {[game.away, game.home].map((team) => {
//                 const isW = winTeam === team;
//                 const ac2 = getAccent(team, dark);
//                 return (
//                   <tr key={team}>
//                     <td style={{ padding: "7px 12px 7px 0" }}>
//                       <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                         <TeamLogo abbr={team} size={28} />
//                         <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "1px", color: isW ? ac2 : T.textMuted }}>
//                           {team}
//                         </span>
//                       </div>
//                     </td>
//                     {["1", "2", "3", "4"].map(q => (
//                       <td key={q} style={{ textAlign: "center", padding: "5px 14px", color: T.textSecond, fontWeight: 600, fontSize: "15px" }}>
//                         {game.periods[q]?.[team] ?? 0}
//                       </td>
//                     ))}
//                     <td style={{ textAlign: "center", padding: "5px 14px", fontWeight: 900, fontSize: "20px", color: isW ? ac2 : T.textMuted }}>
//                       {game.score[team]}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* ── TEAM TABS ── */}
//         <div style={{ display: "flex", background: T.cardBg, borderBottom: `1px solid ${T.border}`, ...TR }}>
//           {[game.away, game.home].map((team) => {
//             const isAct = activeTeam === team;
//             const ac2   = getAccent(team, dark);
//             return (
//               <button key={team} onClick={() => handleTeamSwitch(team)}
//                 style={{ background: isAct ? T.cardBg : T.subHeader, border: "none",
//                   borderBottom: `3px solid ${isAct ? ac2 : "transparent"}`,
//                   padding: "12px 22px", cursor: "pointer",
//                   color: isAct ? T.textPrimary : T.textMuted,
//                   fontFamily: "'Barlow Condensed', sans-serif",
//                   fontWeight: 800, fontSize: "14px", letterSpacing: "2px",
//                   textTransform: "uppercase", transition: "all 0.15s",
//                   display: "flex", alignItems: "center", gap: "10px" }}>
//                 <TeamLogo abbr={team} size={24} style={{ opacity: isAct ? 1 : 0.4, transition: "opacity 0.15s" }} />
//                 <span>{teamName(team)}</span>
//                 <span style={{ background: isAct ? ac2 : T.badgeOff,
//                   color: isAct ? T.badgeTextOn : T.badgeTextOff,
//                   fontSize: "13px", padding: "1px 8px", fontWeight: 900, borderRadius: "2px" }}>
//                   {game.score[team]}
//                 </span>
//               </button>
//             );
//           })}
//         </div>

//         {/* ── PLAYER TABLE ── */}
//         <div style={{ background: T.cardBg, overflowX: "auto", ...TR }}>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
//             <thead>
//               <tr style={{ background: T.subHeader, borderBottom: `2px solid ${T.border}` }}>
//                 <th style={{ textAlign: "left", padding: "11px 16px", fontWeight: 700,
//                   letterSpacing: "2px", fontSize: "11px", color: T.textMuted,
//                   textTransform: "uppercase", minWidth: "165px",
//                   position: "sticky", left: 0, background: T.subHeader }}>Player</th>
//                 <th style={{ textAlign: "center", padding: "11px 8px", fontWeight: 700,
//                   fontSize: "11px", color: T.textMuted, textTransform: "uppercase",
//                   minWidth: "38px", letterSpacing: "1px" }}>POS</th>
//                 {COLS.map((col) => {
//                   const key   = COL_KEY[col];
//                   const isAct = sortCol === key;
//                   return (
//                     <th key={col} onClick={() => handleSort(col)}
//                       style={{ textAlign: "center", padding: "11px 10px",
//                         fontWeight: 700, letterSpacing: "1px", fontSize: "11px",
//                         color: isAct ? accent : T.textMuted, textTransform: "uppercase",
//                         cursor: "pointer", userSelect: "none",
//                         minWidth: col.includes("/") ? "68px" : "42px",
//                         whiteSpace: "nowrap",
//                         borderBottom: isAct ? `2px solid ${accent}` : "2px solid transparent",
//                         transition: "color 0.15s, border-color 0.15s" }}>
//                       {col}{isAct ? (sortDir === -1 ? " ↓" : " ↑") : ""}
//                     </th>
//                   );
//                 })}
//               </tr>
//             </thead>
//             <tbody key={`${game.id}-${activeTeam}-${animKey}`}>
//               {sorted.map((p, i) => {
//                 const rowBg = i % 2 === 0 ? T.cardBg : T.altRowBg;
//                 const isTop = i === 0;
//                 return (
//                   <tr key={p.name}
//                     style={{ background: rowBg, borderBottom: `1px solid ${T.divider}`, transition: "background 0.1s" }}
//                     onMouseEnter={e => e.currentTarget.style.background = T.hoverBg}
//                     onMouseLeave={e => e.currentTarget.style.background = rowBg}>
//                     {/* Name */}
//                     <td style={{ padding: "10px 16px", fontWeight: isTop ? 800 : 600,
//                       fontSize: isTop ? "15px" : "14px",
//                       color: isTop ? T.textPrimary : T.textSecond,
//                       letterSpacing: "0.5px", position: "sticky", left: 0,
//                       background: rowBg, whiteSpace: "nowrap" }}>
//                       {isTop && (
//                         <span style={{ display: "inline-block", width: "6px", height: "6px",
//                           background: accent, borderRadius: "50%",
//                           marginRight: "8px", verticalAlign: "middle" }} />
//                       )}
//                       {p.name}
//                     </td>
//                     {/* Pos */}
//                     <td style={{ textAlign: "center", padding: "10px 8px",
//                       color: T.posColor, fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
//                       {p.pos}
//                     </td>
//                     {/* Ratio cols */}
//                     {[["fgm","fga"], ["p3m","p3a"], ["ftm","fta"]].map(([m, a], ri) => (
//                       <td key={ri} style={{ textAlign: "center", padding: "10px 10px",
//                         color: T.textMono, fontFamily: "monospace", fontSize: "13px", fontWeight: 500 }}>
//                         {p[m]}/{p[a]}
//                       </td>
//                     ))}
//                     {/* Numeric stat cols */}
//                     {["pts", "reb", "ast", "stl", "blk", "to"].map((key) => {
//                       const val     = p[key] ?? 0;
//                       const isSort  = sortCol === key;
//                       const isBig   = val >= 20;
//                       const isMed   = val >= 10;
//                       const isBadTo = key === "to" && val >= 4;
//                       const color   =
//                         isBadTo           ? T.toWarn :
//                         isSort && val > 0 ? accent :
//                         isBig             ? T.textPrimary :
//                         isMed             ? T.textSecond :
//                                             T.textDim;
//                       return (
//                         <td key={key} style={{ textAlign: "center", padding: "10px 10px",
//                           fontWeight: isBig ? 900 : isMed ? 700 : 500,
//                           fontSize: isBig ? "16px" : "14px",
//                           color, letterSpacing: "0.5px", transition: "color 0.15s" }}>
//                           {val}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }
