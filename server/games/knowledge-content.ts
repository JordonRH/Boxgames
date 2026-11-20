// Independently written questions and definitions. Sources verify facts, not copied game content.
export interface Question {
  question: string;
  answer: string;
  wrong: [string, string, string];
  explanation: string;
  source: string;
}
const nasa = "https://science.nasa.gov/solar-system/planets/";
export const trivia: Question[] = [
  {
    question: "Which planet needs the biggest parking space?",
    answer: "Jupiter",
    wrong: ["Saturn", "Neptune", "Earth"],
    explanation: "Jupiter is the largest planet in our Solar System.",
    source: nasa,
  },
  {
    question: "Start at the Sun. Which planet do you reach first?",
    answer: "Mercury",
    wrong: ["Venus", "Mars", "Earth"],
    explanation: "Mercury orbits closest to the Sun.",
    source: nasa,
  },
  {
    question: "Which planet is Earth's next neighbour farther from the Sun?",
    answer: "Mars",
    wrong: ["Venus", "Mercury", "Saturn"],
    explanation: "The order begins Mercury, Venus, Earth, Mars.",
    source: nasa,
  },
  {
    question: "How many planets are in our Solar System?",
    answer: "8",
    wrong: ["7", "9", "10"],
    explanation:
      "Our Solar System has eight planets; dwarf planets are a separate category.",
    source: nasa,
  },
  {
    question: "Which planet comes between Saturn and Neptune?",
    answer: "Uranus",
    wrong: ["Jupiter", "Mars", "Venus"],
    explanation:
      "The outer planets in order are Jupiter, Saturn, Uranus and Neptune.",
    source: nasa,
  },
  {
    question: "Which of these planets is farthest from the Sun?",
    answer: "Neptune",
    wrong: ["Uranus", "Saturn", "Jupiter"],
    explanation: "Neptune is the eighth and outermost planet.",
    source: nasa,
  },
  {
    question: "A normal adult insect has how many legs?",
    answer: "6",
    wrong: ["4", "8", "10"],
    explanation: "Insects have three pairs of legs.",
    source:
      "https://www.tepapa.govt.nz/digital-museum/explore-digital-museum/your-bug-questions-answered/what-is-a-bug-insects-arachnids-and-myriapods",
  },
  {
    question: "A normal adult spider has how many legs?",
    answer: "8",
    wrong: ["6", "10", "12"],
    explanation: "Spiders are arachnids, with four pairs of legs.",
    source:
      "https://fieldofmar-e.schools.nsw.gov.au/fact-sheets/invertebrates/arachnids-fact-sheet",
  },
  {
    question: "A cube has how many square faces?",
    answer: "6",
    wrong: ["4", "8", "12"],
    explanation: "A cube has three opposite pairs of square faces.",
    source: "",
  },
  {
    question: "How many minutes make up a quarter of an hour?",
    answer: "15",
    wrong: ["10", "20", "25"],
    explanation: "60 divided by 4 is 15.",
    source: "",
  },
  {
    question: "How many sides does a hexagon have?",
    answer: "6",
    wrong: ["5", "7", "8"],
    explanation: "A hexagon has six sides.",
    source: "",
  },
  {
    question: "Which fraction is exactly the same as one half?",
    answer: "3/6",
    wrong: ["2/3", "1/4", "3/4"],
    explanation:
      "Dividing the numerator and denominator of 3/6 by 3 gives 1/2.",
    source: "",
  },
  {
    question:
      "You roll a standard six-sided die. How many even faces are there?",
    answer: "3",
    wrong: ["2", "4", "6"],
    explanation: "The even values are 2, 4 and 6.",
    source: "",
  },
  {
    question: "A triangle has two angles of 60°. What is its third angle?",
    answer: "60°",
    wrong: ["30°", "90°", "120°"],
    explanation: "The angles of a triangle sum to 180°: 180 − 60 − 60 = 60.",
    source: "",
  },
  {
    question: "A clock reads 23:00. What is that in 12-hour time?",
    answer: "11 pm",
    wrong: ["11 am", "1 pm", "12 pm"],
    explanation: "23 minus 12 is 11, in the evening.",
    source: "",
  },
  {
    question: "Which number has no remainder when divided by both 3 and 4?",
    answer: "24",
    wrong: ["18", "20", "22"],
    explanation: "24 ÷ 3 = 8 and 24 ÷ 4 = 6.",
    source: "",
  },
];
export function repairQuestion(seed: number): Question {
  const n = 3 + seed;
  if (seed % 2 === 0)
    return {
      question: `Balance the supply: ${n} + ? = ${n * 3}`,
      answer: String(n * 2),
      wrong: [String(n * 2 - 1), String(n * 2 + 1), String(n * 2 + 3)],
      explanation: `${n * 3} − ${n} = ${n * 2}.`,
      source: "",
    };
  return {
    question: `The signal repeats the same step: ${n}, ${n + 3}, ${n + 6}, ?`,
    answer: String(n + 9),
    wrong: [String(n + 7), String(n + 8), String(n + 12)],
    explanation: `Add 3 each time. ${n + 6} + 3 = ${n + 9}.`,
    source: "",
  };
}
export interface OddWord {
  term: string;
  truth: string;
  aliases: string[];
  decoy: string;
  source: string;
}
export const oddWords: OddWord[] = [
  {
    term: "Aglet",
    truth: "The little cap that keeps a shoelace end together",
    aliases: ["shoelace tip", "tip of a shoelace", "lace tip"],
    decoy: "A small weight sewn into a curtain hem",
    source: "https://www.dictionary.com/browse/aglet",
  },
  {
    term: "Octothorpe",
    truth: "Another name for the # sign",
    aliases: ["#", "hashtag", "hash", "hash sign", "number sign", "pound sign"],
    decoy: "A musical phrase played eight times",
    source: "https://www.merriam-webster.com/dictionary/octothorpe",
  },
  {
    term: "Tittle",
    truth: "A tiny written mark, such as the dot above a lowercase i",
    aliases: ["dot on an i", "dot above an i", "dot over i"],
    decoy: "The gap between the teeth of a comb",
    source: "https://www.merriam-webster.com/dictionary/tittle",
  },
  {
    term: "Glabella",
    truth: "The smooth area of forehead between the eyebrows",
    aliases: ["between eyebrows", "space between eyebrows"],
    decoy: "The curved edge at the top of an ear",
    source: "https://www.merriam-webster.com/dictionary/glabella",
  },
  {
    term: "Interrobang",
    truth:
      "A punctuation mark combining a question mark and an exclamation mark",
    aliases: ["?!", "!?", "‽"],
    decoy: "A pause taken between two drum rolls",
    source: "https://www.merriam-webster.com/dictionary/interrobang",
  },
  {
    term: "Limnology",
    truth: "The scientific study of fresh water, including lakes",
    aliases: ["study of lakes", "study of fresh water"],
    decoy: "The study of how light bends around corners",
    source: "https://www.merriam-webster.com/dictionary/limnology",
  },
  {
    term: "Ecdysis",
    truth: "The shedding of an outer layer, such as an animal's skin",
    aliases: ["molting", "moulting", "shedding skin"],
    decoy: "The brief glow after a lamp is switched off",
    source: "https://www.merriam-webster.com/dictionary/ecdysis",
  },
  {
    term: "Borborygmus",
    truth: "A rumbling noise made by gas moving through the intestine",
    aliases: ["stomach rumbling", "rumbling stomach", "belly rumble"],
    decoy: "The low hum inside an empty seashell",
    source: "https://www.merriam-webster.com/dictionary/borborygmus",
  },
];
