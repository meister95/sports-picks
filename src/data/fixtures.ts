import type { Fixture } from "@/data/picks";

export type FixtureDateGroup = {
  date: string;
  label: string;
  fixtures: Fixture[];
};

export type FixtureSchedule = {
  label: string;
  dates: FixtureDateGroup[];
};

// Spielpläne für die kommenden Spieltage, Stand 12.11.2026. Alle Zeiten sind CET.
export const fixtureSchedules: Record<string, FixtureSchedule> = {
  "Premier League": {
    label: "Spieltag 12",
    dates: [
      { date: "2026-11-21", label: "Samstag, 21. November", fixtures: [
        { id: "pl-2026-11-21-city-fulham", home: "Manchester City", away: "Fulham", kickoff: "13:30" },
        { id: "pl-2026-11-21-bournemouth-forest", home: "AFC Bournemouth", away: "Nottingham Forest", kickoff: "16:00" },
        { id: "pl-2026-11-21-villa-sunderland", home: "Aston Villa", away: "Sunderland", kickoff: "16:00" },
        { id: "pl-2026-11-21-chelsea-leeds", home: "Chelsea", away: "Leeds United", kickoff: "16:00" },
        { id: "pl-2026-11-21-coventry-palace", home: "Coventry City", away: "Crystal Palace", kickoff: "16:00" },
        { id: "pl-2026-11-21-spurs-ipswich", home: "Tottenham Hotspur", away: "Ipswich Town", kickoff: "16:00" },
        { id: "pl-2026-11-21-newcastle-arsenal", home: "Newcastle United", away: "Arsenal", kickoff: "18:30" },
      ] },
      { date: "2026-11-22", label: "Sonntag, 22. November", fixtures: [
        { id: "pl-2026-11-22-hull-brighton", home: "Hull City", away: "Brighton & Hove Albion", kickoff: "15:00" },
        { id: "pl-2026-11-22-liverpool-united", home: "Liverpool", away: "Manchester United", kickoff: "17:30" },
      ] },
      { date: "2026-11-23", label: "Montag, 23. November", fixtures: [
        { id: "pl-2026-11-23-brentford-everton", home: "Brentford", away: "Everton", kickoff: "21:00" },
      ] },
    ],
  },
  Bundesliga: {
    label: "Spieltag 10",
    dates: [
      { date: "2026-11-20", label: "Freitag, 20. November", fixtures: [
        { id: "bund-2026-11-20-bayern-koeln", home: "Bayern München", away: "1. FC Köln", kickoff: "20:30" },
      ] },
      { date: "2026-11-21", label: "Samstag, 21. November", fixtures: [
        { id: "bund-2026-11-21-leverkusen-paderborn", home: "Bayer Leverkusen", away: "SC Paderborn", kickoff: "15:30" },
        { id: "bund-2026-11-21-frankfurt-hoffenheim", home: "Eintracht Frankfurt", away: "TSG Hoffenheim", kickoff: "15:30" },
        { id: "bund-2026-11-21-union-leipzig", home: "Union Berlin", away: "RB Leipzig", kickoff: "15:30" },
        { id: "bund-2026-11-21-gladbach-dortmund", home: "Borussia Mönchengladbach", away: "Borussia Dortmund", kickoff: "15:30" },
        { id: "bund-2026-11-21-elversberg-freiburg", home: "SV Elversberg", away: "SC Freiburg", kickoff: "15:30" },
        { id: "bund-2026-11-21-schalke-stuttgart", home: "Schalke 04", away: "VfB Stuttgart", kickoff: "18:30" },
      ] },
      { date: "2026-11-22", label: "Sonntag, 22. November", fixtures: [
        { id: "bund-2026-11-22-augsburg-mainz", home: "FC Augsburg", away: "Mainz 05", kickoff: "15:30" },
        { id: "bund-2026-11-22-bremen-hamburg", home: "Werder Bremen", away: "Hamburger SV", kickoff: "17:30" },
      ] },
    ],
  },
  "La Liga": {
    label: "Spieltag 13",
    dates: [
      { date: "2026-11-20", label: "Freitag, 20. November", fixtures: [
        { id: "laliga-2026-11-20-athletic-espanyol", home: "Athletic Club", away: "Espanyol", kickoff: "21:00" },
      ] },
      { date: "2026-11-21", label: "Samstag, 21. November", fixtures: [
        { id: "laliga-2026-11-21-alaves-depor", home: "Alavés", away: "Deportivo", kickoff: "14:00" },
        { id: "laliga-2026-11-21-rayo-valencia", home: "Rayo Vallecano", away: "Valencia", kickoff: "16:15" },
        { id: "laliga-2026-11-21-sevilla-betis", home: "Sevilla", away: "Real Betis", kickoff: "18:30" },
        { id: "laliga-2026-11-21-madrid-celta", home: "Real Madrid", away: "Celta Vigo", kickoff: "21:00" },
      ] },
      { date: "2026-11-22", label: "Sonntag, 22. November", fixtures: [
        { id: "laliga-2026-11-22-barcelona-villarreal", home: "Barcelona", away: "Villarreal", kickoff: "14:00" },
        { id: "laliga-2026-11-22-racing-sociedad", home: "Racing Santander", away: "Real Sociedad", kickoff: "16:15" },
        { id: "laliga-2026-11-22-osasuna-malaga", home: "Osasuna", away: "Málaga", kickoff: "18:30" },
        { id: "laliga-2026-11-22-getafe-atletico", home: "Getafe", away: "Atlético de Madrid", kickoff: "21:00" },
      ] },
      { date: "2026-11-23", label: "Montag, 23. November", fixtures: [
        { id: "laliga-2026-11-23-levante-elche", home: "Levante", away: "Elche", kickoff: "21:00" },
      ] },
    ],
  },
  "Champions League": {
    label: "Spieltag 5",
    dates: [
      { date: "2026-11-24", label: "Dienstag, 24. November", fixtures: [
        { id: "ucl-2026-11-24-bodo-lask", home: "Bodø/Glimt", away: "LASK", kickoff: "18:45" },
        { id: "ucl-2026-11-24-galatasaray-villa", home: "Galatasaray", away: "Aston Villa", kickoff: "18:45" },
        { id: "ucl-2026-11-24-arsenal-dortmund", home: "Arsenal", away: "Borussia Dortmund", kickoff: "21:00" },
        { id: "ucl-2026-11-24-como-aek", home: "Como", away: "AEK Athen", kickoff: "21:00" },
        { id: "ucl-2026-11-24-feyenoord-porto", home: "Feyenoord", away: "Porto", kickoff: "21:00" },
        { id: "ucl-2026-11-24-city-napoli", home: "Manchester City", away: "Napoli", kickoff: "21:00" },
        { id: "ucl-2026-11-24-leipzig-lens", home: "Leipzig", away: "Lens", kickoff: "21:00" },
        { id: "ucl-2026-11-24-madrid-psv", home: "Real Madrid", away: "PSV Eindhoven", kickoff: "21:00" },
        { id: "ucl-2026-11-24-slovan-betis", home: "Slovan Bratislava", away: "Real Betis", kickoff: "21:00" },
      ] },
      { date: "2026-11-25", label: "Mittwoch, 25. November", fixtures: [
        { id: "ucl-2026-11-25-sabah-barcelona", home: "Sabah", away: "Barcelona", kickoff: "18:45" },
        { id: "ucl-2026-11-25-slavia-villarreal", home: "Slavia Praha", away: "Villarreal", kickoff: "18:45" },
        { id: "ucl-2026-11-25-atletico-viking", home: "Atlético de Madrid", away: "Viking", kickoff: "21:00" },
        { id: "ucl-2026-11-25-brugge-liverpool", home: "Club Brugge", away: "Liverpool", kickoff: "21:00" },
        { id: "ucl-2026-11-25-inter-stuttgart", home: "Inter", away: "Stuttgart", kickoff: "21:00" },
        { id: "ucl-2026-11-25-shakhtar-fenerbahce", home: "Shakhtar Donetsk", away: "Fenerbahçe", kickoff: "21:00" },
        { id: "ucl-2026-11-25-lille-bayern", home: "Lille", away: "Bayern München", kickoff: "21:00" },
        { id: "ucl-2026-11-25-psg-roma", home: "Paris Saint-Germain", away: "Roma", kickoff: "21:00" },
        { id: "ucl-2026-11-25-sporting-united", home: "Sporting CP", away: "Manchester United", kickoff: "21:00" },
      ] },
    ],
  },
  "Europa League": {
    label: "Spieltag 5",
    dates: [
      { date: "2026-11-26", label: "Donnerstag, 26. November", fixtures: [
        { id: "uel-2026-11-26-besiktas-hapoel", home: "Beşiktaş", away: "Hapoel Beer-Sheva", kickoff: "18:45" },
        { id: "uel-2026-11-26-salzburg-ararat", home: "Salzburg", away: "Ararat-Armenia", kickoff: "18:45" },
        { id: "uel-2026-11-26-plzen-benfica", home: "Viktoria Plzeň", away: "Benfica", kickoff: "18:45" },
        { id: "uel-2026-11-26-dinamo-leverkusen", home: "GNK Dinamo", away: "Bayer Leverkusen", kickoff: "18:45" },
        { id: "uel-2026-11-26-olympiacos-milan", home: "Olympiacos", away: "Milan", kickoff: "18:45" },
        { id: "uel-2026-11-26-marseille-levski", home: "Marseille", away: "Levski Sofia", kickoff: "18:45" },
        { id: "uel-2026-11-26-union-lech", home: "Union SG", away: "Lech Poznań", kickoff: "18:45" },
        { id: "uel-2026-11-26-celta-bournemouth", home: "Celta", away: "Bournemouth", kickoff: "18:45" },
        { id: "uel-2026-11-26-sparta-az", home: "Sparta Praha", away: "AZ Alkmaar", kickoff: "21:00" },
        { id: "uel-2026-11-26-palace-sociedad", home: "Crystal Palace", away: "Real Sociedad", kickoff: "21:00" },
        { id: "uel-2026-11-26-ferencvaros-celje", home: "Ferencváros", away: "Celje", kickoff: "21:00" },
        { id: "uel-2026-11-26-juventus-omonia", home: "Juventus", away: "Omonia", kickoff: "21:00" },
        { id: "uel-2026-11-26-nec-rennes", home: "N.E.C. Nijmegen", away: "Rennes", kickoff: "21:00" },
        { id: "uel-2026-11-26-ofi-anderlecht", home: "OFI Crete", away: "Anderlecht", kickoff: "21:00" },
        { id: "uel-2026-11-26-lyon-lillestrom", home: "Lyon", away: "Lillestrøm", kickoff: "21:00" },
        { id: "uel-2026-11-26-torreense-celtic", home: "Torreense", away: "Celtic", kickoff: "21:00" },
        { id: "uel-2026-11-26-sunderland-jagiellonia", home: "Sunderland", away: "Jagiellonia", kickoff: "21:00" },
        { id: "uel-2026-11-26-hoffenheim-sturm", home: "Hoffenheim", away: "Sturm Graz", kickoff: "21:00" },
      ] },
    ],
  },
};
