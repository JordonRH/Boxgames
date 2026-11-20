// Independently written questions and definitions. Sources verify facts, not copied game content.
export interface Question {
  category?: string;
  difficulty?: "medium" | "hard";
  question: string;
  answer: string;
  wrong: [string, string, string];
  explanation: string;
  source: string;
}
export const trivia: Question[] = [
  {
    category: "Space",
    difficulty: "medium",
    question:
      "On which planet does one full rotation take longer than one orbit of the Sun?",
    answer: "Venus",
    wrong: ["Mercury", "Mars", "Earth"],
    explanation:
      "Venus takes about 243 Earth days to rotate once and about 225 to orbit the Sun.",
    source: "https://science.nasa.gov/venus/venus-facts/",
  },
  {
    category: "Space",
    difficulty: "medium",
    question:
      "Which planet is tilted so far that it effectively orbits on its side?",
    answer: "Uranus",
    wrong: ["Neptune", "Saturn", "Jupiter"],
    explanation: "The axis of Uranus is tilted about 98 degrees.",
    source: "https://science.nasa.gov/uranus/facts/",
  },
  {
    category: "Space",
    difficulty: "hard",
    question:
      "Which planet has the fastest recorded winds in our Solar System?",
    answer: "Neptune",
    wrong: ["Saturn", "Venus", "Uranus"],
    explanation: "Winds on Neptune can exceed 2,000 kilometres per hour.",
    source: "https://science.nasa.gov/neptune/neptune-facts/",
  },
  {
    category: "Space",
    difficulty: "hard",
    question: "The dense clouds above Venus contain droplets of which acid?",
    answer: "Sulfuric acid",
    wrong: ["Nitric acid", "Hydrochloric acid", "Acetic acid"],
    explanation:
      "Venus has sulfuric-acid clouds above its carbon-dioxide-rich atmosphere.",
    source: "https://science.nasa.gov/venus/venus-facts/",
  },
  {
    category: "Science",
    difficulty: "medium",
    question: "Which element uses W as its chemical symbol?",
    answer: "Tungsten",
    wrong: ["Tin", "Antimony", "Seaborgium"],
    explanation: "W comes from wolfram, another name for tungsten.",
    source: "https://periodic-table.rsc.org/element/74/tungsten",
  },
  {
    category: "Science",
    difficulty: "medium",
    question: "Which non-metal is a liquid at 20°C?",
    answer: "Bromine",
    wrong: ["Iodine", "Chlorine", "Sulfur"],
    explanation:
      "Bromine melts below 20°C and boils above it, so it is liquid at that temperature.",
    source: "https://periodic-table.rsc.org/element/35/bromine",
  },
  {
    category: "Science",
    difficulty: "hard",
    question: "Which element is hiding behind the symbol Sb?",
    answer: "Antimony",
    wrong: ["Tin", "Samarium", "Strontium"],
    explanation: "Antimony has the symbol Sb, from stibium.",
    source: "https://periodic-table.rsc.org/element/51/antimony",
  },
  {
    category: "Science",
    difficulty: "hard",
    question:
      "Which metal gets its English name from Swedish words meaning 'heavy stone'?",
    answer: "Tungsten",
    wrong: ["Molybdenum", "Vanadium", "Tantalum"],
    explanation:
      "The name tungsten comes from an old Swedish name meaning heavy stone.",
    source: "https://periodic-table.rsc.org/element/74/tungsten",
  },
  {
    category: "History",
    difficulty: "medium",
    question: "In which Indian city would you find the Taj Mahal?",
    answer: "Agra",
    wrong: ["Delhi", "Jaipur", "Mumbai"],
    explanation: "The Taj Mahal was built in Agra.",
    source: "https://whc.unesco.org/en/list/252/",
  },
  {
    category: "History",
    difficulty: "medium",
    question: "Which empire built Machu Picchu?",
    answer: "Inca",
    wrong: ["Maya", "Aztec", "Olmec"],
    explanation: "Machu Picchu was an urban creation of the Inca Empire.",
    source: "https://whc.unesco.org/en/list/274/",
  },
  {
    category: "History",
    difficulty: "hard",
    question: "Petra was a caravan city of which ancient people?",
    answer: "Nabataeans",
    wrong: ["Phoenicians", "Assyrians", "Persians"],
    explanation: "Petra was a Nabataean city at a major trading crossroads.",
    source: "https://whc.unesco.org/en/list/326/",
  },
  {
    category: "History",
    difficulty: "hard",
    question: "The temples at Angkor were capitals of which empire?",
    answer: "Khmer",
    wrong: ["Champa", "Srivijaya", "Majapahit"],
    explanation: "Angkor preserves several capitals of the Khmer Empire.",
    source: "https://whc.unesco.org/en/list/668/",
  },
  {
    category: "Books",
    difficulty: "medium",
    question: "Who wrote the original Frankenstein novel?",
    answer: "Mary Shelley",
    wrong: ["Bram Stoker", "Robert Louis Stevenson", "Arthur Conan Doyle"],
    explanation: "Frankenstein was written by Mary Wollstonecraft Shelley.",
    source: "https://www.gutenberg.org/ebooks/84",
  },
  {
    category: "Books",
    difficulty: "medium",
    question: "Who wrote Pride and Prejudice?",
    answer: "Jane Austen",
    wrong: ["Charlotte Brontë", "George Eliot", "Elizabeth Gaskell"],
    explanation: "Jane Austen wrote Pride and Prejudice.",
    source: "https://www.gutenberg.org/ebooks/1342",
  },
  {
    category: "Books",
    difficulty: "hard",
    question: "Which author wrote Middlemarch?",
    answer: "George Eliot",
    wrong: ["Elizabeth Gaskell", "Thomas Hardy", "Charles Dickens"],
    explanation: "Middlemarch was written under the name George Eliot.",
    source: "https://www.gutenberg.org/ebooks/8227",
  },
  {
    category: "Books",
    difficulty: "hard",
    question: "Which Brontë sister wrote Wuthering Heights?",
    answer: "Emily",
    wrong: ["Charlotte", "Anne", "None of them"],
    explanation: "Wuthering Heights is Emily Brontë’s novel.",
    source:
      "https://www.britishlibrary.cn/en/works/emily-bronte-s-wuthering-heights/",
  },
  {
    category: "Nature",
    difficulty: "medium",
    question:
      "Platypuses and echidnas belong to which egg-laying mammal group?",
    answer: "Monotremes",
    wrong: ["Marsupials", "Rodents", "Primates"],
    explanation: "Monotremes are mammals that lay eggs.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "medium",
    question:
      "Which part of a platypus detects electrical signals from prey underwater?",
    answer: "Its bill",
    wrong: ["Its tail", "Its webbed feet", "Its ears"],
    explanation: "Electroreceptors in the bill help a platypus find prey.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "hard",
    question: "Where does a platypus store a reserve of fat?",
    answer: "Its tail",
    wrong: ["Its bill", "Its webbed feet", "Its neck"],
    explanation: "A platypus uses its broad tail to store fat reserves.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "hard",
    question:
      "A male platypus delivers venom through spurs on which body part?",
    answer: "Its ankles",
    wrong: ["Its bill", "Its tail", "Its front claws"],
    explanation: "The ankle spurs connect to venom glands in the upper legs.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Numbers",
    difficulty: "medium",
    question: "A price goes up 20%, then down 20%. What is the net change?",
    answer: "4% lower",
    wrong: ["No change", "4% higher", "2% lower"],
    explanation: "Starting at 100: 100 × 1.2 × 0.8 = 96.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "medium",
    question:
      "Two fair six-sided dice are rolled. What is the chance their total is 7?",
    answer: "1 in 6",
    wrong: ["1 in 7", "1 in 12", "1 in 9"],
    explanation: "Six of the 36 equally likely pairs sum to 7.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "hard",
    question:
      "A bag has 3 red and 2 blue tokens. Draw two without replacement. Chance both are red?",
    answer: "3 in 10",
    wrong: ["2 in 5", "9 in 25", "1 in 5"],
    explanation: "The probability is 3/5 × 2/4 = 3/10.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "hard",
    question:
      "Every interior angle of a regular polygon is 150°. How many sides does it have?",
    answer: "12",
    wrong: ["10", "15", "18"],
    explanation: "Each exterior angle is 30°. There are 360/30 = 12 sides.",
    source: "",
  },
];
// Several multi-step repair families; close alternatives reward working it out.
export function repairQuestion(seed: number): Question {
  const n = 5 + Math.floor(seed / 6);
  let question: string, value: number, explanation: string;
  switch (seed % 6) {
    case 0:
      question = `Four relays each need ${n + 3} units. Solar supplies ${n + 7}. How many units must the battery supply?`;
      value = 4 * (n + 3) - (n + 7);
      explanation = `4 × ${n + 3} − ${n + 7} = ${value}.`;
      break;
    case 1:
      question = `Decode (${n + 8} + 7) × 3 − 8. What is the result?`;
      value = (n + 15) * 3 - 8;
      explanation = `Brackets first: ${n + 15} × 3 − 8 = ${value}.`;
      break;
    case 2:
      question = `The signal alternates +7, −3: ${n}, ${n + 7}, ${n + 4}, ${n + 11}, ?`;
      value = n + 8;
      explanation = `The next step is −3: ${n + 11} − 3 = ${value}.`;
      break;
    case 3: {
      const first = 1 + Math.floor((n - 5) / 5),
        tens = 2 + ((n - 5) % 5),
        units = tens + 2;
      question = `A three-digit code starts with ${first}. Its last two digits total ${tens + units}; the units digit is 2 more than the tens digit. What is it?`;
      value = first * 100 + tens * 10 + units;
      explanation = `The last two digits are ${tens} and ${units}, giving ${value}.`;
      break;
    }
    case 4:
      question = `A ${4 * n}-unit battery loses 25% of its starting charge, then uses ${n - 2} more units. How much remains?`;
      value = 2 * n + 2;
      explanation = `75% of ${4 * n} is ${3 * n}; subtract ${n - 2} to get ${value}.`;
      break;
    default:
      question = `A panel needs exactly ${3 * n + 7} volts. One line gives ${n + 3} and another gives ${n - 1}. What must the third give?`;
      value = n + 5;
      explanation = `${3 * n + 7} − ${n + 3} − ${n - 1} = ${value}.`;
  }
  return {
    question,
    answer: String(value),
    wrong: [String(value - 2), String(value + 2), String(value + 5)],
    explanation,
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
