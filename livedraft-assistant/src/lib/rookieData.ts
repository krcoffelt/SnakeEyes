// 2025 NFL Rookie Database for Fantasy Football
// This data represents the actual 2025 rookie class who are entering the NFL in 2025
// NOT players who were drafted in 2024 (those are 2nd year players now)

export interface RookieInfo {
  name: string;
  team: string; // NFL team they were drafted to
  position: string;
  college: string;
  draftRound: number;
  draftPick: number;
  notes?: string;
}

export const ROOKIE_2025_DATABASE: RookieInfo[] = [
  // Quarterbacks - 2025 Rookie Class
  {
    name: "Carson Beck",
    team: "TBD",
    position: "QB",
    college: "Georgia",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Georgia QB"
  },
  {
    name: "Quinn Ewers",
    team: "TBD",
    position: "QB",
    college: "Texas",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Texas QB"
  },
  {
    name: "Jalen Milroe",
    team: "TBD",
    position: "QB",
    college: "Alabama",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Alabama QB"
  },
  {
    name: "Drew Allar",
    team: "TBD",
    position: "QB",
    college: "Penn State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Penn State QB"
  },
  {
    name: "Riley Leonard",
    team: "TBD",
    position: "QB",
    college: "Notre Dame",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Notre Dame QB"
  },

  // Running Backs - 2025 Rookie Class
  {
    name: "Ashton Jeanty",
    team: "TBD",
    position: "RB",
    college: "Boise State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Boise State RB"
  },
  {
    name: "RJ Harvey",
    team: "TBD",
    position: "RB",
    college: "UCF",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, UCF RB"
  },
  {
    name: "Ollie Gordon II",
    team: "TBD",
    position: "RB",
    college: "Oklahoma State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Oklahoma State RB"
  },
  {
    name: "TreVeyon Henderson",
    team: "TBD",
    position: "RB",
    college: "Ohio State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Ohio State RB"
  },
  {
    name: "Donovan Edwards",
    team: "TBD",
    position: "RB",
    college: "Michigan",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Michigan RB"
  },
  {
    name: "Bucky Irving",
    team: "TBD",
    position: "RB",
    college: "Oregon",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Oregon RB"
  },
  {
    name: "Chip Trayanum",
    team: "TBD",
    position: "RB",
    college: "Ohio State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Ohio State RB"
  },

  // Wide Receivers - 2025 Rookie Class
  {
    name: "Evan Stewart",
    team: "TBD",
    position: "WR",
    college: "Oregon",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Oregon WR"
  },
  {
    name: "Emeka Egbuka",
    team: "TBD",
    position: "WR",
    college: "Ohio State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Ohio State WR"
  },
  {
    name: "Tetairoa McMillan",
    team: "TBD",
    position: "WR",
    college: "Arizona",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Arizona WR"
  },
  {
    name: "Barion Brown",
    team: "TBD",
    position: "WR",
    college: "Kentucky",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Kentucky WR"
  },
  {
    name: "Antwane Wells Jr.",
    team: "TBD",
    position: "WR",
    college: "South Carolina",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, South Carolina WR"
  },
  {
    name: "J. Michael Sturdivant",
    team: "TBD",
    position: "WR",
    college: "UCLA",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, UCLA WR"
  },
  {
    name: "Dorian Singer",
    team: "TBD",
    position: "WR",
    college: "USC",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, USC WR"
  },

  // Tight Ends - 2025 Rookie Class
  {
    name: "Brock Bowers",
    team: "TBD",
    position: "TE",
    college: "Georgia",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected 1st round pick, Georgia TE"
  },
  {
    name: "Ja'Tavion Sanders",
    team: "TBD",
    position: "TE",
    college: "Texas",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected early round pick, Texas TE"
  },
  {
    name: "Cade Stover",
    team: "TBD",
    position: "TE",
    college: "Ohio State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Ohio State TE"
  },
  {
    name: "Theo Johnson",
    team: "TBD",
    position: "TE",
    college: "Penn State",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Penn State TE"
  },
  {
    name: "Erick All",
    team: "TBD",
    position: "TE",
    college: "Iowa",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Iowa TE"
  },

  // Kickers - 2025 Rookie Class
  {
    name: "Will Reichard",
    team: "TBD",
    position: "K",
    college: "Alabama",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Alabama K"
  },
  {
    name: "Cam Little",
    team: "TBD",
    position: "K",
    college: "Arkansas",
    draftRound: 0,
    draftPick: 0,
    notes: "Projected mid-round pick, Arkansas K"
  }
];

// Helper function to check if a player is a rookie
export function isRookie2025(playerName: string): boolean {
  return ROOKIE_2025_DATABASE.some(rookie => 
    rookie.name.toLowerCase() === playerName.toLowerCase()
  );
}

// Helper function to get rookie info
export function getRookieInfo(playerName: string): RookieInfo | null {
  return ROOKIE_2025_DATABASE.find(rookie => 
    rookie.name.toLowerCase() === playerName.toLowerCase()
  ) || null;
}

// Helper function to get all rookies by position
export function getRookiesByPosition(position: string): RookieInfo[] {
  return ROOKIE_2025_DATABASE.filter(rookie => 
    rookie.position === position
  );
}

// Helper function to get all rookies by team
export function getRookiesByTeam(team: string): RookieInfo[] {
  return ROOKIE_2025_DATABASE.filter(rookie => 
    rookie.team === team
  );
}

// Helper function to get all rookies by college
export function getRookiesByCollege(college: string): RookieInfo[] {
  return ROOKIE_2025_DATABASE.filter(rookie => 
    rookie.college === college
  );
} 