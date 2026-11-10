import type { Ending, MoodId } from "./types";

/**
 * The CineMood Atlas — a hand-curated set of mood-tagged films.
 *
 * OMDb has no mood data and no "discover" endpoint, so this atlas seeds
 * candidate discovery. Each row: [imdbID, title, year, moods, ending, lang].
 *
 * Mood codes:   M mind-blown · E emotional · A adrenaline · R romantic
 *               Y mysterious · V motivational · D dark · X escape
 * Ending codes: h happy · b bittersweet · t twist · g tragic · o open
 * Lang:         OMDb language name, omitted when English.
 *
 * Title + year are kept so the server can verify an ID lookup and fall
 * back to a title lookup if an ID ever drifts. To extend the atlas, add rows.
 */
type Row = [id: string, title: string, year: number, moods: string, ending: string, lang?: string];

const ROWS: Row[] = [
  // ── Mind-benders ──────────────────────────────────────────────
  ["tt1375666", "Inception", 2010, "MAX", "o"],
  ["tt0816692", "Interstellar", 2014, "MEX", "b"],
  ["tt0133093", "The Matrix", 1999, "MAX", "h"],
  ["tt2543164", "Arrival", 2016, "MEY", "b"],
  ["tt1856101", "Blade Runner 2049", 2017, "MYD", "b"],
  ["tt0083658", "Blade Runner", 1982, "MYD", "o"],
  ["tt0470752", "Ex Machina", 2014, "MYD", "t"],
  ["tt0338013", "Eternal Sunshine of the Spotless Mind", 2004, "MER", "b"],
  ["tt0137523", "Fight Club", 1999, "MD", "t"],
  ["tt0209144", "Memento", 2000, "MYD", "t"],
  ["tt0482571", "The Prestige", 2006, "MYD", "t"],
  ["tt1130884", "Shutter Island", 2010, "MYD", "t"],
  ["tt0166924", "Mulholland Drive", 2001, "MYD", "o"],
  ["tt0246578", "Donnie Darko", 2001, "MYD", "o"],
  ["tt2866360", "Coherence", 2013, "MY", "t"],
  ["tt2397535", "Predestination", 2014, "MY", "t"],
  ["tt6723592", "Tenet", 2020, "MA", "o"],
  ["tt6710474", "Everything Everywhere All at Once", 2022, "MEAX", "h"],
  ["tt2798920", "Annihilation", 2018, "MYD", "o"],
  ["tt0062622", "2001: A Space Odyssey", 1968, "MX", "o"],
  ["tt0945513", "Source Code", 2011, "MA", "b"],
  ["tt1276104", "Looper", 2012, "MA", "b"],
  ["tt0181689", "Minority Report", 2002, "MAY", "h"],
  ["tt1182345", "Moon", 2009, "MEY", "b"],
  ["tt2316411", "Enemy", 2013, "MYD", "o"],
  ["tt0120382", "The Truman Show", 1998, "MEV", "h"],
  ["tt0851578", "Paprika", 2006, "MX", "h", "Japanese"],
  ["tt0094625", "Akira", 1988, "MAD", "o", "Japanese"],
  ["tt0113568", "Ghost in the Shell", 1995, "MY", "o", "Japanese"],
  ["tt15398776", "Oppenheimer", 2023, "MD", "g"],
  ["tt1798709", "Her", 2013, "MER", "b"],

  // ── Emotional ─────────────────────────────────────────────────
  ["tt0111161", "The Shawshank Redemption", 1994, "EV", "h"],
  ["tt0109830", "Forrest Gump", 1994, "EVR", "b"],
  ["tt0108052", "Schindler's List", 1993, "ED", "b"],
  ["tt0120689", "The Green Mile", 1999, "E", "g"],
  ["tt2380307", "Coco", 2017, "EX", "h"],
  ["tt1049413", "Up", 2009, "EX", "h"],
  ["tt2096673", "Inside Out", 2015, "EX", "h"],
  ["tt0095327", "Grave of the Fireflies", 1988, "ED", "g", "Japanese"],
  ["tt4034228", "Manchester by the Sea", 2016, "E", "o"],
  ["tt0118799", "Life Is Beautiful", 1997, "ER", "b", "Italian"],
  ["tt1028532", "Hachi: A Dog's Tale", 2009, "E", "b"],
  ["tt0095765", "Cinema Paradiso", 1988, "ER", "b", "Italian"],
  ["tt1675434", "The Intouchables", 2011, "EV", "h", "French"],
  ["tt0119217", "Good Will Hunting", 1997, "EV", "h"],
  ["tt0097165", "Dead Poets Society", 1989, "EV", "b"],
  ["tt2948372", "Soul", 2020, "EVX", "h"],
  ["tt0910970", "WALL·E", 2008, "ERX", "h"],
  ["tt0986264", "Like Stars on Earth", 2007, "EV", "h", "Hindi"],
  ["tt2350496", "The Lunchbox", 2013, "ER", "o", "Hindi"],
  ["tt2082197", "Barfi!", 2012, "ER", "b", "Hindi"],
  ["tt0367110", "Swades", 2004, "EV", "h", "Hindi"],
  ["tt13238346", "Past Lives", 2023, "ER", "b"],

  // ── Adrenaline ────────────────────────────────────────────────
  ["tt0468569", "The Dark Knight", 2008, "AD", "b"],
  ["tt1392190", "Mad Max: Fury Road", 2015, "AX", "h"],
  ["tt2911666", "John Wick", 2014, "AD", "b"],
  ["tt0095016", "Die Hard", 1988, "A", "h"],
  ["tt4912910", "Mission: Impossible - Fallout", 2018, "A", "h"],
  ["tt1745960", "Top Gun: Maverick", 2022, "AV", "h"],
  ["tt0172495", "Gladiator", 2000, "AE", "b"],
  ["tt0266697", "Kill Bill: Vol. 1", 2003, "AD", "o"],
  ["tt1899353", "The Raid: Redemption", 2011, "A", "h", "Indonesian"],
  ["tt3890160", "Baby Driver", 2017, "AR", "h"],
  ["tt1631867", "Edge of Tomorrow", 2014, "AM", "h"],
  ["tt0381061", "Casino Royale", 2006, "AR", "b"],
  ["tt0113277", "Heat", 1995, "AD", "g"],
  ["tt0440963", "The Bourne Ultimatum", 2007, "AY", "h"],
  ["tt0111257", "Speed", 1994, "A", "h"],
  ["tt0103064", "Terminator 2: Judgment Day", 1991, "AE", "b"],
  ["tt0090605", "Aliens", 1986, "AD", "h"],
  ["tt0107290", "Jurassic Park", 1993, "AX", "h"],
  ["tt5013056", "Dunkirk", 2017, "A", "b"],
  ["tt8579674", "1917", 2019, "AE", "b"],
  ["tt1950186", "Ford v Ferrari", 2019, "AV", "b"],
  ["tt1979320", "Rush", 2013, "AV", "b"],
  ["tt5700672", "Train to Busan", 2016, "AE", "b", "Korean"],
  ["tt8178634", "RRR", 2022, "AX", "h", "Telugu"],
  ["tt4849438", "Baahubali 2: The Conclusion", 2017, "AX", "h", "Telugu"],
  ["tt2631186", "Baahubali: The Beginning", 2015, "AX", "o", "Telugu"],
  ["tt0190332", "Crouching Tiger, Hidden Dragon", 2000, "ARX", "b", "Mandarin"],
  ["tt0299977", "Hero", 2002, "AX", "g", "Mandarin"],
  ["tt3397884", "Sicario", 2015, "AD", "g"],

  // ── Romantic ──────────────────────────────────────────────────
  ["tt3783958", "La La Land", 2016, "REV", "b"],
  ["tt0112471", "Before Sunrise", 1995, "R", "o"],
  ["tt0332280", "The Notebook", 2004, "RE", "b"],
  ["tt0414387", "Pride & Prejudice", 2005, "R", "h"],
  ["tt2194499", "About Time", 2013, "RE", "h"],
  ["tt0120338", "Titanic", 1997, "RE", "g"],
  ["tt0211915", "Amélie", 2001, "RX", "h", "French"],
  ["tt5311514", "Your Name.", 2016, "RMX", "h", "Japanese"],
  ["tt1022603", "500 Days of Summer", 2009, "R", "b"],
  ["tt3104988", "Crazy Rich Asians", 2018, "R", "h"],
  ["tt0098635", "When Harry Met Sally...", 1989, "R", "h"],
  ["tt0125439", "Notting Hill", 1999, "R", "h"],
  ["tt0034583", "Casablanca", 1942, "RE", "b"],
  ["tt0118694", "In the Mood for Love", 2000, "RE", "b", "Cantonese"],
  ["tt5726616", "Call Me by Your Name", 2017, "RE", "b"],
  ["tt8613070", "Portrait of a Lady on Fire", 2019, "RE", "b", "French"],
  ["tt0112870", "Dilwale Dulhania Le Jayenge", 1995, "R", "h", "Hindi"],
  ["tt1093370", "Jab We Met", 2007, "R", "h", "Hindi"],
  ["tt0093779", "The Princess Bride", 1987, "RX", "h"],

  // ── Mysterious ────────────────────────────────────────────────
  ["tt0114369", "Se7en", 1995, "YD", "g"],
  ["tt2267998", "Gone Girl", 2014, "YD", "t"],
  ["tt1392214", "Prisoners", 2013, "YD", "o"],
  ["tt0443706", "Zodiac", 2007, "YD", "o"],
  ["tt8946378", "Knives Out", 2019, "Y", "t"],
  ["tt0114814", "The Usual Suspects", 1995, "YM", "t"],
  ["tt0167404", "The Sixth Sense", 1999, "YE", "t"],
  ["tt0047396", "Rear Window", 1954, "Y", "h"],
  ["tt0052357", "Vertigo", 1958, "YRD", "g"],
  ["tt0071315", "Chinatown", 1974, "YD", "g"],
  ["tt1568346", "The Girl with the Dragon Tattoo", 2011, "YD", "b"],
  ["tt0353969", "Memories of Murder", 2003, "YD", "o", "Korean"],
  ["tt4016934", "The Handmaiden", 2016, "YR", "t", "Korean"],
  ["tt8108198", "Andhadhun", 2018, "Y", "t", "Hindi"],
  ["tt4430212", "Drishyam", 2015, "Y", "t", "Hindi"],
  ["tt1821480", "Kahaani", 2012, "Y", "t", "Hindi"],
  ["tt0102926", "The Silence of the Lambs", 1991, "YD", "o"],
  ["tt5052448", "Get Out", 2017, "YD", "t"],

  // ── Motivational ──────────────────────────────────────────────
  ["tt2582802", "Whiplash", 2014, "VD", "o"],
  ["tt0454921", "The Pursuit of Happyness", 2006, "VE", "h"],
  ["tt0075148", "Rocky", 1976, "VR", "b"],
  ["tt3076658", "Creed", 2015, "VA", "b"],
  ["tt1285016", "The Social Network", 2010, "V", "b"],
  ["tt1210166", "Moneyball", 2011, "V", "b"],
  ["tt0108002", "Rudy", 1993, "V", "h"],
  ["tt0210945", "Remember the Titans", 2000, "VE", "h"],
  ["tt2084970", "The Imitation Game", 2014, "VE", "b"],
  ["tt4846340", "Hidden Figures", 2016, "V", "h"],
  ["tt3659388", "The Martian", 2015, "VX", "h"],
  ["tt1542344", "127 Hours", 2010, "VA", "h"],
  ["tt0359950", "The Secret Life of Walter Mitty", 2013, "VX", "h"],
  ["tt1187043", "3 Idiots", 2009, "VE", "h", "Hindi"],
  ["tt5074352", "Dangal", 2016, "V", "h", "Hindi"],
  ["tt0169102", "Lagaan: Once Upon a Time in India", 2001, "V", "h", "Hindi"],
  ["tt0871510", "Chak De! India", 2007, "V", "h", "Hindi"],
  ["tt2356180", "Bhaag Milkha Bhaag", 2013, "V", "b", "Hindi"],
  ["tt1562872", "Zindagi Na Milegi Dobara", 2011, "VRX", "h", "Hindi"],
  ["tt3322420", "Queen", 2013, "V", "h", "Hindi"],
  ["tt2395469", "Gully Boy", 2019, "V", "h", "Hindi"],
  ["tt0405508", "Rang De Basanti", 2006, "VE", "g", "Hindi"],

  // ── Dark ──────────────────────────────────────────────────────
  ["tt6751668", "Parasite", 2019, "DY", "g", "Korean"],
  ["tt0364569", "Oldboy", 2003, "DY", "t", "Korean"],
  ["tt7286456", "Joker", 2019, "D", "g"],
  ["tt0477348", "No Country for Old Men", 2007, "D", "o"],
  ["tt0469494", "There Will Be Blood", 2007, "D", "g"],
  ["tt0180093", "Requiem for a Dream", 2000, "D", "g"],
  ["tt0947798", "Black Swan", 2010, "DM", "g"],
  ["tt2872718", "Nightcrawler", 2014, "D", "o"],
  ["tt0075314", "Taxi Driver", 1976, "D", "o"],
  ["tt7784604", "Hereditary", 2018, "D", "g"],
  ["tt7984734", "The Lighthouse", 2019, "DM", "g"],
  ["tt4263482", "The Witch", 2015, "D", "o"],
  ["tt8772262", "Midsommar", 2019, "D", "o"],
  ["tt0081505", "The Shining", 1980, "DY", "o"],
  ["tt0084787", "The Thing", 1982, "DY", "o"],
  ["tt0078748", "Alien", 1979, "DA", "b"],
  ["tt6644200", "A Quiet Place", 2018, "DA", "b"],
  ["tt0780504", "Drive", 2011, "DR", "o"],
  ["tt0110912", "Pulp Fiction", 1994, "D", "o"],
  ["tt0099685", "Goodfellas", 1990, "D", "b"],
  ["tt0068646", "The Godfather", 1972, "D", "g"],
  ["tt0407887", "The Departed", 2006, "DY", "g"],
  ["tt0317248", "City of God", 2002, "D", "g", "Portuguese"],
  ["tt1954470", "Gangs of Wasseypur", 2012, "D", "g", "Hindi"],
  ["tt8239946", "Tumbbad", 2018, "DY", "g", "Hindi"],
  ["tt0457430", "Pan's Labyrinth", 2006, "DX", "b", "Spanish"],

  // ── Escape reality ────────────────────────────────────────────
  ["tt0245429", "Spirited Away", 2001, "X", "h", "Japanese"],
  ["tt0347149", "Howl's Moving Castle", 2004, "XR", "h", "Japanese"],
  ["tt0499549", "Avatar", 2009, "XA", "h"],
  ["tt0120737", "The Lord of the Rings: The Fellowship of the Ring", 2001, "X", "o"],
  ["tt0241527", "Harry Potter and the Sorcerer's Stone", 2001, "X", "h"],
  ["tt2278388", "The Grand Budapest Hotel", 2014, "X", "b"],
  ["tt1160419", "Dune", 2021, "XM", "o"],
  ["tt0076759", "Star Wars: Episode IV - A New Hope", 1977, "XA", "h"],
  ["tt0080684", "Star Wars: Episode V - The Empire Strikes Back", 1980, "XA", "o"],
  ["tt0088763", "Back to the Future", 1985, "X", "h"],
  ["tt0454876", "Life of Pi", 2012, "XE", "o"],
  ["tt0319061", "Big Fish", 2003, "XE", "b"],
  ["tt0486655", "Stardust", 2007, "XR", "h"],
  ["tt2015381", "Guardians of the Galaxy", 2014, "XA", "h"],
  ["tt4633694", "Spider-Man: Into the Spider-Verse", 2018, "XAV", "h"],
  ["tt1454468", "Gravity", 2013, "XA", "h"],
  ["tt1136608", "District 9", 2009, "MA", "b"],
  ["tt2338151", "PK", 2014, "XE", "b", "Hindi"],
  ["tt0292490", "Dil Chahta Hai", 2001, "RE", "h", "Hindi"],
];

const MOOD_CODE: Record<string, MoodId> = {
  M: "mind-blown",
  E: "emotional",
  A: "adrenaline",
  R: "romantic",
  Y: "mysterious",
  V: "motivational",
  D: "dark",
  X: "escape",
};

const ENDING_CODE: Record<string, Ending> = {
  h: "happy",
  b: "bittersweet",
  t: "twist",
  g: "tragic",
  o: "open",
};

export interface AtlasEntry {
  imdbID: string;
  title: string;
  year: number;
  /** ordered: first mood is the film's dominant feeling */
  moods: MoodId[];
  ending: Ending;
  language: string;
}

export const ATLAS: AtlasEntry[] = ROWS.map(([imdbID, title, year, moods, ending, lang]) => ({
  imdbID,
  title,
  year,
  moods: moods.split("").map((c) => MOOD_CODE[c]),
  ending: ENDING_CODE[ending],
  language: lang ?? "English",
}));

export const ATLAS_BY_ID = new Map(ATLAS.map((e) => [e.imdbID, e]));
