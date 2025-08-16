// 2025 NFL Rookie Database for Fantasy Football
// This data represents the actual 2025 rookie class who have been drafted
// and are entering their rookie NFL season for fantasy purposes

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
    name: "Caleb Williams",
    team: "CHI",
    position: "QB",
    college: "USC",
    draftRound: 1,
    draftPick: 1,
    notes: "1st overall pick, expected starter, elite upside"
  },
  {
    name: "Jayden Daniels",
    team: "WAS",
    position: "QB",
    college: "LSU",
    draftRound: 1,
    draftPick: 2,
    notes: "2nd overall pick, dual-threat QB, expected starter"
  },
  {
    name: "Drake Maye",
    team: "NE",
    position: "QB",
    college: "North Carolina",
    draftRound: 1,
    draftPick: 3,
    notes: "3rd overall pick, strong arm, expected starter"
  },
  {
    name: "Michael Penix Jr.",
    team: "ATL",
    position: "QB",
    college: "Washington",
    draftRound: 1,
    draftPick: 8,
    notes: "1st round pick, backup to Kirk Cousins initially"
  },
  {
    name: "Bo Nix",
    team: "DEN",
    position: "QB",
    college: "Oregon",
    draftRound: 1,
    draftPick: 12,
    notes: "1st round pick, expected starter, Sean Payton QB"
  },
  {
    name: "J.J. McCarthy",
    team: "MIN",
    position: "QB",
    college: "Michigan",
    draftRound: 1,
    draftPick: 10,
    notes: "1st round pick, backup to Sam Darnold initially"
  },
  {
    name: "Spencer Rattler",
    team: "NO",
    position: "QB",
    college: "South Carolina",
    draftRound: 5,
    draftPick: 150,
    notes: "Late round pick, developmental backup"
  },

  // Running Backs - 2025 Rookie Class
  {
    name: "Jonathon Brooks",
    team: "CAR",
    position: "RB",
    college: "Texas",
    draftRound: 2,
    draftPick: 46,
    notes: "2nd round pick, expected to compete for starting role"
  },
  {
    name: "Trey Benson",
    team: "ARI",
    position: "RB",
    college: "Florida State",
    draftRound: 3,
    draftPick: 66,
    notes: "3rd round pick, backup to James Conner"
  },
  {
    name: "Blake Corum",
    team: "LAR",
    position: "RB",
    college: "Michigan",
    draftRound: 3,
    draftPick: 83,
    notes: "3rd round pick, backup to Kyren Williams"
  },
  {
    name: "Bucky Irving",
    team: "TB",
    position: "RB",
    college: "Oregon",
    draftRound: 4,
    draftPick: 125,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Ray Davis",
    team: "BUF",
    position: "RB",
    college: "Kentucky",
    draftRound: 4,
    draftPick: 128,
    notes: "4th round pick, backup to James Cook"
  },
  {
    name: "Isaac Guerendo",
    team: "SF",
    position: "RB",
    college: "Louisville",
    draftRound: 4,
    draftPick: 129,
    notes: "4th round pick, backup to Christian McCaffrey"
  },
  {
    name: "Braelon Allen",
    team: "NYJ",
    position: "RB",
    college: "Wisconsin",
    draftRound: 4,
    draftPick: 134,
    notes: "4th round pick, backup to Breece Hall"
  },
  {
    name: "Will Shipley",
    team: "PHI",
    position: "RB",
    college: "Clemson",
    draftRound: 4,
    draftPick: 127,
    notes: "4th round pick, backup to Saquon Barkley"
  },
  {
    name: "Dylan Laube",
    team: "LV",
    position: "RB",
    college: "New Hampshire",
    draftRound: 6,
    draftPick: 208,
    notes: "6th round pick, special teams/backup"
  },

  // Wide Receivers - 2025 Rookie Class
  {
    name: "Marvin Harrison Jr.",
    team: "ARI",
    position: "WR",
    college: "Ohio State",
    draftRound: 1,
    draftPick: 4,
    notes: "4th overall pick, expected WR1, elite prospect"
  },
  {
    name: "Malik Nabers",
    team: "NYG",
    position: "WR",
    college: "LSU",
    draftRound: 1,
    draftPick: 6,
    notes: "6th overall pick, expected WR1, explosive playmaker"
  },
  {
    name: "Rome Odunze",
    team: "CHI",
    position: "WR",
    college: "Washington",
    draftRound: 1,
    draftPick: 9,
    notes: "9th overall pick, expected WR2, contested catch specialist"
  },
  {
    name: "Brian Thomas Jr.",
    team: "JAC",
    position: "WR",
    college: "LSU",
    draftRound: 1,
    draftPick: 23,
    notes: "1st round pick, expected WR2, deep threat"
  },
  {
    name: "Xavier Worthy",
    team: "KC",
    position: "WR",
    college: "Texas",
    draftRound: 1,
    draftPick: 28,
    notes: "1st round pick, expected WR2, speed demon"
  },
  {
    name: "Ricky Pearsall",
    team: "SF",
    position: "WR",
    college: "Florida",
    draftRound: 1,
    draftPick: 31,
    notes: "1st round pick, expected WR3, reliable target"
  },
  {
    name: "Adonai Mitchell",
    team: "IND",
    position: "WR",
    college: "Texas",
    draftRound: 2,
    draftPick: 52,
    notes: "2nd round pick, expected WR2, red zone threat"
  },
  {
    name: "Keon Coleman",
    team: "BUF",
    position: "WR",
    college: "Florida State",
    draftRound: 2,
    draftPick: 33,
    notes: "2nd round pick, expected WR2, physical receiver"
  },
  {
    name: "Ladd McConkey",
    team: "LAC",
    position: "WR",
    college: "Georgia",
    draftRound: 2,
    draftPick: 34,
    notes: "2nd round pick, expected WR2, route runner"
  },
  {
    name: "Xavier Legette",
    team: "CAR",
    position: "WR",
    college: "South Carolina",
    draftRound: 1,
    draftPick: 32,
    notes: "1st round pick, expected WR1, physical specimen"
  },
  {
    name: "Troy Franklin",
    team: "DEN",
    position: "WR",
    college: "Oregon",
    draftRound: 4,
    draftPick: 102,
    notes: "4th round pick, expected backup, deep threat"
  },
  {
    name: "Javon Baker",
    team: "NE",
    position: "WR",
    college: "UCF",
    draftRound: 4,
    draftPick: 110,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Brenden Rice",
    team: "LAC",
    position: "WR",
    college: "USC",
    draftRound: 7,
    draftPick: 225,
    notes: "7th round pick, developmental, Jerry Rice's son"
  },

  // Tight Ends - 2025 Rookie Class
  {
    name: "Brock Bowers",
    team: "LV",
    position: "TE",
    college: "Georgia",
    draftRound: 1,
    draftPick: 13,
    notes: "1st round pick, expected TE1, elite prospect"
  },
  {
    name: "Ja'Tavion Sanders",
    team: "CAR",
    position: "TE",
    college: "Texas",
    draftRound: 4,
    draftPick: 101,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Cade Stover",
    team: "HOU",
    position: "TE",
    college: "Ohio State",
    draftRound: 4,
    draftPick: 123,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Theo Johnson",
    team: "NYG",
    position: "TE",
    college: "Penn State",
    draftRound: 4,
    draftPick: 107,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Erick All",
    team: "CIN",
    position: "TE",
    college: "Iowa",
    draftRound: 4,
    draftPick: 115,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Jared Wiley",
    team: "KC",
    position: "TE",
    college: "TCU",
    draftRound: 4,
    draftPick: 131,
    notes: "4th round pick, expected backup"
  },
  {
    name: "Tanner McLachlan",
    team: "CIN",
    position: "TE",
    college: "Arizona",
    draftRound: 6,
    draftPick: 194,
    notes: "6th round pick, developmental"
  },

  // Kickers - 2025 Rookie Class
  {
    name: "Cam Little",
    team: "DET",
    position: "K",
    college: "Arkansas",
    draftRound: 6,
    draftPick: 203,
    notes: "6th round pick, expected starter"
  },
  {
    name: "Will Reichard",
    team: "LAC",
    position: "K",
    college: "Alabama",
    draftRound: 6,
    draftPick: 203,
    notes: "6th round pick, expected starter"
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