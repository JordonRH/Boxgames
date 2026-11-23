// Independently written prompts. Factual references are revealed with answers.
export interface YearCard {
  text: string;
  year: number;
  source: string;
}
const hubble =
  "https://science.nasa.gov/mission/hubble/overview/hubble-timeline/hubble-history-timeline-full-text/";
const web = "https://home.cern/science/computing/the-birth-of-the-web/";
const horizons = "https://science.nasa.gov/mission/new-horizons/";
export const years: YearCard[] = [
  {
    text: "The World Wide Web is proposed at CERN. Which year?",
    year: 1989,
    source: web,
  },
  {
    text: "CERN releases its Web software into the public domain. Which year?",
    year: 1993,
    source: web,
  },
  {
    text: "Hubble launches aboard the space shuttle Discovery. Which year?",
    year: 1990,
    source: hubble,
  },
  {
    text: "Astronauts make the first servicing visit to Hubble. Which year?",
    year: 1993,
    source: hubble,
  },
  {
    text: "Sputnik 1 becomes the first artificial satellite. Which year?",
    year: 1957,
    source: hubble,
  },
  {
    text: "Apollo 11 lands people on the Moon. Which year?",
    year: 1969,
    source: "https://www.nasa.gov/mission/apollo-11/",
  },
  {
    text: "Both Voyager probes launch from Earth. Which year?",
    year: 1977,
    source: "https://science.nasa.gov/mission/voyager/fact-sheet/",
  },
  {
    text: "New Horizons launches on its long trip to Pluto. Which year?",
    year: 2006,
    source: horizons,
  },
  {
    text: "New Horizons makes its close flyby of Pluto. Which year?",
    year: 2015,
    source: horizons,
  },
  {
    text: "New Horizons flies past the Kuiper Belt object Arrokoth. Which year?",
    year: 2019,
    source: horizons,
  },
  {
    text: "The James Webb Space Telescope launches on Christmas Day. Which year?",
    year: 2021,
    source: "https://science.nasa.gov/mission/webb/faqs-full/",
  },
  {
    text: "Webb's first full-colour science images are released. Which year?",
    year: 2022,
    source: "https://science.nasa.gov/mission/webb/webb-mission-timeline/",
  },
  {
    text: "The Sydney Opera House officially opens. Which year?",
    year: 1973,
    source:
      "https://www.sydneyoperahouse.com/our-story/50-years-extraordinary-moments",
  },
  {
    text: "The Sydney Harbour Bridge opens to the public. Which year?",
    year: 1932,
    source:
      "https://www.nma.gov.au/defining-moments/resources/sydney-harbour-bridge-opens",
  },
  {
    text: "The Wright brothers make their first powered flights at Kitty Hawk. Which year?",
    year: 1903,
    source: "https://www.si.edu/object/1903-wrightflyer:nasm_A19610048000",
  },
  {
    text: "Euro banknotes and coins enter circulation. Which year?",
    year: 2002,
    source:
      "https://www.ecb.europa.eu/press/pr/date/2002/html/pr020228.en.html",
  },
];
export interface ArtistCard {
  name: string;
  aliases: string[];
  clues: [string, string];
  source: string;
}
export const artists: ArtistCard[] = [
  {
    name: "David Bowie",
    aliases: ["bowie"],
    clues: [
      "This British performer created the Ziggy Stardust persona.",
      "He sang Space Oddity, Heroes and Let's Dance.",
    ],
    source: "https://www.davidbowie.com/",
  },
  {
    name: "Dolly Parton",
    aliases: ["dolly"],
    clues: [
      "This Tennessee-born songwriter founded the Imagination Library.",
      "Her songs include Jolene and 9 to 5.",
    ],
    source: "https://dollyparton.com/",
  },
  {
    name: "Freddie Mercury",
    aliases: ["freddie", "mercury"],
    clues: [
      "Born in Zanzibar as Farrokh Bulsara, this singer became a spectacular rock frontman.",
      "He was Queen's lead singer, heard on Bohemian Rhapsody.",
    ],
    source: "https://www.queenonline.com/freddie_mercury",
  },
  {
    name: "Beyoncé",
    aliases: ["beyonce", "beyonce knowles"],
    clues: [
      "This Houston-born performer released the visual album Lemonade.",
      "Before her solo career, she sang in Destiny's Child.",
    ],
    source: "https://www.beyonce.com/",
  },
  {
    name: "Taylor Swift",
    aliases: ["taylor", "swift"],
    clues: [
      "This songwriter's albums include Folklore and Evermore.",
      "Her albums also include Red, 1989 and The Tortured Poets Department.",
    ],
    source: "https://www.taylorswift.com/",
  },
  {
    name: "Elton John",
    aliases: ["elton"],
    clues: [
      "A pianist whose longtime songwriting partner is Bernie Taupin.",
      "His songs include Rocket Man and Tiny Dancer.",
    ],
    source: "https://www.eltonjohn.com/",
  },
  {
    name: "Adele",
    aliases: ["adele adkins"],
    clues: [
      "This London-born singer named her first four studio albums after ages.",
      "Her songs include Hello and Rolling in the Deep.",
    ],
    source: "https://www.adele.com/",
  },
  {
    name: "Bob Marley",
    aliases: ["marley"],
    clues: [
      "This Jamaican singer performed with the Wailers.",
      "His songs include Three Little Birds and One Love.",
    ],
    source: "https://www.bobmarley.com/",
  },
  {
    name: "Kylie Minogue",
    aliases: ["kylie"],
    clues: [
      "This Australian pop singer first became widely known through Neighbours.",
      "Her songs include Can't Get You Out of My Head and Padam Padam.",
    ],
    source: "https://www.kylie.com/",
  },
  {
    name: "Prince",
    aliases: ["prince rogers nelson"],
    clues: [
      "This Minneapolis musician's home and studio was Paisley Park.",
      "His albums include Purple Rain and Sign o' the Times.",
    ],
    source: "https://www.prince.com/",
  },
  {
    name: "Daft Punk",
    aliases: ["daftpunk"],
    clues: [
      "A French electronic duo known for wearing robot helmets.",
      "Their tracks include One More Time and Get Lucky.",
    ],
    source: "https://www.daftpunk.com/",
  },
  {
    name: "Lady Gaga",
    aliases: ["gaga", "stefani germanotta"],
    clues: [
      "This performer played Ally in the 2018 film A Star Is Born.",
      "Her songs include Poker Face and Bad Romance.",
    ],
    source: "https://www.ladygaga.com/",
  },
];
export const drawingPrompts: Record<string, string[]> = {
  movies: [
    "Draw Jaws without writing its title.",
    "Draw The Lion King in one scene, without words.",
    "Draw Jurassic Park as a very low-budget film poster.",
    "Draw The Wizard of Oz without any lettering.",
    "Draw a scene that makes people think of Finding Nemo.",
    "Draw a scene that makes people think of Ghostbusters.",
    "Draw a moment from Home Alone without words.",
    "Draw a tiny version of King Kong.",
  ],
  games: [
    "Draw a chaotic Mario Kart race, without words.",
    "Draw Tetris blocks having a disagreement.",
    "Draw a Minecraft house with one terrible design choice.",
    "Draw Pac-Man on a lunch break.",
    "Draw a football video game's most unlikely goalkeeper.",
    "Draw a board game being played by dragons.",
    "Draw a very confused chess knight.",
    "Draw a video-game boss who is afraid of the player.",
  ],
  sports: [
    "Draw a goalkeeper being distracted by a butterfly.",
    "Draw the slowest Olympic sprint imaginable.",
    "Draw a surfing competition for penguins.",
    "Draw a tennis player with a ridiculously tiny racket.",
    "Draw a cricket umpire who has lost the ball.",
    "Draw a basketball dunk attempted by a giraffe.",
    "Draw a cycling race with one square wheel.",
    "Draw a golfer trying to escape a sand trap.",
  ],
  creatures: [
    "Draw an original creature that delivers the post.",
    "Draw a dragon that is allergic to treasure.",
    "Draw an original sea monster who loves karaoke.",
    "Draw a tiny creature with enormous roller skates.",
    "Draw an alien trying to make a sandwich.",
    "Draw a forest creature whose tail is an umbrella.",
    "Draw a monster that works at a library.",
    "Draw a very polite creature with far too many legs.",
  ],
  everyday: [
    "Draw a toaster celebrating its birthday.",
    "Draw a kettle on a secret mission.",
    "Draw a chair that does not want anyone to sit down.",
    "Draw a washing machine having a holiday.",
    "Draw a houseplant being interviewed on television.",
    "Draw a sock escaping from a laundry basket.",
    "Draw a shopping trolley trying ballet.",
    "Draw an alarm clock that has overslept.",
  ],
};
export const rareTopics = [
  {
    text: "Name one planet in our Solar System.",
    answers: [
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
    ],
    aliases: { terra: "earth" },
  },
  {
    text: "Name one month of the year.",
    answers: [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ],
  },
  {
    text: "Name a chess piece type.",
    answers: ["king", "queen", "rook", "bishop", "knight", "pawn"],
    aliases: { castle: "rook" },
  },
  {
    text: "Name one of Australia’s six states, the ACT, or the Northern Territory.",
    answers: [
      "new south wales",
      "victoria",
      "queensland",
      "western australia",
      "south australia",
      "tasmania",
      "australian capital territory",
      "northern territory",
    ],
    aliases: {
      nsw: "new south wales",
      vic: "victoria",
      qld: "queensland",
      wa: "western australia",
      sa: "south australia",
      tas: "tasmania",
      act: "australian capital territory",
      nt: "northern territory",
    },
  },
  {
    text: "Name a recognised swimming stroke: freestyle, backstroke, breaststroke or butterfly.",
    answers: ["freestyle", "backstroke", "breaststroke", "butterfly"],
    aliases: { "front crawl": "freestyle", crawl: "freestyle" },
  },
  {
    text: "Name a standard orchestral string instrument: violin, viola, cello or double bass.",
    answers: ["violin", "viola", "cello", "double bass"],
    aliases: { bass: "double bass", contrabass: "double bass" },
  },
  {
    text: "Name a standard colour of the rainbow.",
    answers: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
  },
  {
    text: "Name a day of the week.",
    answers: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
  },
  {
    text: "Name a face value on a standard six-sided die, written as a word or digit.",
    answers: ["one", "two", "three", "four", "five", "six"],
    aliases: {
      "1": "one",
      "2": "two",
      "3": "three",
      "4": "four",
      "5": "five",
      "6": "six",
    },
  },
  {
    text: "Name one of the five Olympic ring colours.",
    answers: ["blue", "yellow", "black", "green", "red"],
  },
  {
    text: "Name one of the four suits in a standard French-suited deck.",
    answers: ["hearts", "diamonds", "clubs", "spades"],
    aliases: {
      heart: "hearts",
      diamond: "diamonds",
      club: "clubs",
      spade: "spades",
    },
  },
  {
    text: "Name a cardinal or intercardinal compass direction.",
    answers: [
      "north",
      "northeast",
      "east",
      "southeast",
      "south",
      "southwest",
      "west",
      "northwest",
    ],
    aliases: {
      ne: "northeast",
      se: "southeast",
      sw: "southwest",
      nw: "northwest",
      n: "north",
      e: "east",
      s: "south",
      w: "west",
      "north east": "northeast",
      "south east": "southeast",
      "south west": "southwest",
      "north west": "northwest",
    },
  },
];
export const realCreatures = [
  "axolotl",
  "okapi",
  "platypus",
  "echidna",
  "quokka",
  "wombat",
  "numbat",
  "bilby",
  "pangolin",
  "binturong",
  "tapir",
  "capybara",
  "aardvark",
  "narwhal",
  "dugong",
  "manatee",
  "cassowary",
  "kookaburra",
  "shoebill",
  "puffin",
  "aye-aye",
  "fossa",
  "tuatara",
  "saiga",
];
export const fakeCreatures = [
  "glimmerbadger",
  "snorfle",
  "velvet snork",
  "puddlehorn",
  "tanglewump",
  "mosswhistler",
  "bristleplonk",
  "fluffernar",
  "moon wobbit",
  "spindlebeak",
  "rubblefin",
  "dapplegrom",
  "fizzletoad",
  "crumbleyak",
  "tinselnewt",
  "thimblemoose",
  "wogglebat",
  "bramblequonk",
  "pufflemink",
  "grumblewren",
  "nibblenox",
  "muddlefox",
  "gloopernit",
  "flopplejay",
];
