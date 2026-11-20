// Independently written questions and definitions. Sources verify facts, not copied game content.
export interface Question {
  category?: string;
  difficulty?: "casual" | "medium" | "hard";
  question: string;
  answer: string;
  wrong: [string, string, string];
  explanation: string;
  source: string;
}
export const trivia: Question[] = [
  {
    category: "Space",
    difficulty: "casual",
    question: "Which planet is largest?",
    answer: "Jupiter",
    wrong: ["Saturn", "Neptune", "Earth"],
    explanation: "Jupiter is the largest planet in our Solar System.",
    source: "https://science.nasa.gov/solar-system/planets/",
  },
  {
    category: "Space",
    difficulty: "casual",
    question: "Which planet orbits nearest the Sun?",
    answer: "Mercury",
    wrong: ["Venus", "Earth", "Mars"],
    explanation: "Mercury is the innermost planet.",
    source: "https://science.nasa.gov/solar-system/planets/",
  },
  {
    category: "Space",
    difficulty: "casual",
    question: "Which planet is fourth from the Sun?",
    answer: "Mars",
    wrong: ["Earth", "Venus", "Jupiter"],
    explanation: "The order begins Mercury, Venus, Earth, Mars.",
    source: "https://science.nasa.gov/solar-system/planets/",
  },
  {
    category: "Space",
    difficulty: "casual",
    question: "How many planets orbit our Sun?",
    answer: "8",
    wrong: ["7", "9", "10"],
    explanation:
      "There are eight planets; dwarf planets form a different category.",
    source: "https://science.nasa.gov/solar-system/planets/",
  },
  {
    category: "Space",
    difficulty: "medium",
    question: "A year on which planet lasts about 165 Earth years?",
    answer: "Neptune",
    wrong: ["Uranus", "Saturn", "Jupiter"],
    explanation: "Neptune needs about 165 Earth years to orbit the Sun.",
    source: "https://science.nasa.gov/neptune/neptune-facts/",
  },
  {
    category: "Space",
    difficulty: "medium",
    question:
      "Many moons of which planet are named after Shakespeare and Alexander Pope characters?",
    answer: "Uranus",
    wrong: ["Mars", "Jupiter", "Neptune"],
    explanation: "Uranian moons use names from those literary works.",
    source: "https://science.nasa.gov/uranus/facts/",
  },
  {
    category: "Space",
    difficulty: "hard",
    question: "Which spacecraft mapped Venus using radar in the early 1990s?",
    answer: "Magellan",
    wrong: ["Galileo", "Cassini", "Viking"],
    explanation:
      "NASA’s Magellan mission mapped the surface of Venus with radar.",
    source: "https://science.nasa.gov/venus/venus-facts/",
  },
  {
    category: "Space",
    difficulty: "hard",
    question: "Uranus has an axial tilt closest to which value?",
    answer: "98°",
    wrong: ["23°", "45°", "180°"],
    explanation: "Its tilt is about 97.77 degrees.",
    source: "https://science.nasa.gov/uranus/facts/",
  },
  {
    category: "Science",
    difficulty: "casual",
    question: "Which element has the chemical symbol H?",
    answer: "Hydrogen",
    wrong: ["Helium", "Hafnium", "Holmium"],
    explanation: "Hydrogen uses the symbol H.",
    source: "https://periodic-table.rsc.org/element/1/hydrogen",
  },
  {
    category: "Science",
    difficulty: "casual",
    question: "Which element has the symbol O?",
    answer: "Oxygen",
    wrong: ["Osmium", "Gold", "Oganesson"],
    explanation: "O is oxygen’s symbol.",
    source: "https://periodic-table.rsc.org/element/8/oxygen",
  },
  {
    category: "Science",
    difficulty: "casual",
    question: "Au is the symbol for which precious metal?",
    answer: "Gold",
    wrong: ["Silver", "Platinum", "Copper"],
    explanation: "Gold has the symbol Au.",
    source: "https://periodic-table.rsc.org/element/79/gold",
  },
  {
    category: "Science",
    difficulty: "casual",
    question: "Fe is the symbol for which metal?",
    answer: "Iron",
    wrong: ["Fluorine", "Lead", "Copper"],
    explanation: "Iron has the symbol Fe.",
    source: "https://periodic-table.rsc.org/element/26/iron",
  },
  {
    category: "Science",
    difficulty: "medium",
    question: "Which element uses the symbol K?",
    answer: "Potassium",
    wrong: ["Krypton", "Calcium", "Cobalt"],
    explanation: "K is potassium; krypton is Kr.",
    source: "https://periodic-table.rsc.org/element/19/potassium",
  },
  {
    category: "Science",
    difficulty: "medium",
    question: "Which of these metals is liquid at 20°C?",
    answer: "Mercury",
    wrong: ["Gallium", "Caesium", "Lead"],
    explanation:
      "Mercury is liquid at 20°C; gallium and caesium melt above that temperature.",
    source: "https://periodic-table.rsc.org/element/80/mercury",
  },
  {
    category: "Science",
    difficulty: "hard",
    question: "Which element is named after the Norse goddess Vanadis?",
    answer: "Vanadium",
    wrong: ["Titanium", "Tantalum", "Niobium"],
    explanation: "Vanadium’s name honours Vanadis, also known as Freyja.",
    source: "https://periodic-table.rsc.org/element/23/vanadium",
  },
  {
    category: "Science",
    difficulty: "hard",
    question: "Which element was once widely called columbium?",
    answer: "Niobium",
    wrong: ["Tellurium", "Tantalum", "Scandium"],
    explanation: "Niobium was originally named columbium.",
    source: "https://periodic-table.rsc.org/element/41/niobium",
  },
  {
    category: "History",
    difficulty: "casual",
    question: "The pyramids at Giza are in which country?",
    answer: "Egypt",
    wrong: ["Greece", "Mexico", "Iraq"],
    explanation: "Giza is part of Egypt’s ancient pyramid landscape.",
    source: "https://whc.unesco.org/en/list/86/",
  },
  {
    category: "History",
    difficulty: "casual",
    question: "Which country contains the Great Wall?",
    answer: "China",
    wrong: ["Japan", "India", "Mongolia"],
    explanation: "The Great Wall is a historic Chinese defensive system.",
    source: "https://whc.unesco.org/en/list/438/",
  },
  {
    category: "History",
    difficulty: "casual",
    question: "The Eiffel Tower is a landmark of which city?",
    answer: "Paris",
    wrong: ["Rome", "Berlin", "Vienna"],
    explanation: "The Eiffel Tower stands in Paris beside the Seine.",
    source: "https://whc.unesco.org/en/list/600/",
  },
  {
    category: "History",
    difficulty: "casual",
    question: "The ancient Pantheon is a landmark of which city?",
    answer: "Rome",
    wrong: ["Athens", "Istanbul", "Naples"],
    explanation: "The Pantheon is one of the major monuments in Rome.",
    source: "https://whc.unesco.org/en/list/91/",
  },
  {
    category: "History",
    difficulty: "medium",
    question: "Which emperor commissioned the Taj Mahal?",
    answer: "Shah Jahan",
    wrong: ["Akbar", "Babur", "Aurangzeb"],
    explanation: "The Mughal emperor Shah Jahan commissioned it.",
    source: "https://whc.unesco.org/en/list/252/",
  },
  {
    category: "History",
    difficulty: "medium",
    question: "In which present-day country is Angkor?",
    answer: "Cambodia",
    wrong: ["Thailand", "Vietnam", "Laos"],
    explanation: "Angkor’s temple complexes are in Cambodia.",
    source: "https://whc.unesco.org/en/list/668/",
  },
  {
    category: "History",
    difficulty: "hard",
    question: "Hattusha was the capital of which ancient empire?",
    answer: "Hittite",
    wrong: ["Assyrian", "Achaemenid", "Seleucid"],
    explanation: "Hattusha served as the Hittite capital in Anatolia.",
    source: "https://whc.unesco.org/en/list/377/",
  },
  {
    category: "History",
    difficulty: "hard",
    question:
      "Cahokia Mounds is associated with which North American cultural period?",
    answer: "Mississippian",
    wrong: ["Woodland", "Clovis", "Paleo-Indian"],
    explanation: "Cahokia was occupied mainly during the Mississippian period.",
    source: "https://whc.unesco.org/en/list/198/",
  },
  {
    category: "Books",
    difficulty: "casual",
    question: "Who wrote Hamlet?",
    answer: "William Shakespeare",
    wrong: ["Christopher Marlowe", "John Milton", "Geoffrey Chaucer"],
    explanation: "Hamlet is a play by William Shakespeare.",
    source: "https://www.gutenberg.org/ebooks/1524",
  },
  {
    category: "Books",
    difficulty: "casual",
    question: "Who wrote Emma?",
    answer: "Jane Austen",
    wrong: ["Mary Shelley", "George Eliot", "Anne Brontë"],
    explanation: "Emma is a novel by Jane Austen.",
    source: "https://www.gutenberg.org/ebooks/158",
  },
  {
    category: "Books",
    difficulty: "casual",
    question: "Who wrote Moby-Dick?",
    answer: "Herman Melville",
    wrong: ["Mark Twain", "Jack London", "Nathaniel Hawthorne"],
    explanation: "Moby-Dick is Herman Melville’s novel.",
    source: "https://www.gutenberg.org/ebooks/2701",
  },
  {
    category: "Books",
    difficulty: "casual",
    question: "Who wrote Alice’s Adventures in Wonderland?",
    answer: "Lewis Carroll",
    wrong: ["J. M. Barrie", "Kenneth Grahame", "A. A. Milne"],
    explanation:
      "Alice’s Adventures in Wonderland was written by Lewis Carroll.",
    source: "https://www.gutenberg.org/ebooks/11",
  },
  {
    category: "Books",
    difficulty: "medium",
    question: "Who wrote A Christmas Carol?",
    answer: "Charles Dickens",
    wrong: ["Thomas Hardy", "Wilkie Collins", "Oscar Wilde"],
    explanation: "Charles Dickens wrote A Christmas Carol.",
    source: "https://www.gutenberg.org/ebooks/46",
  },
  {
    category: "Books",
    difficulty: "medium",
    question: "Who wrote The Picture of Dorian Gray?",
    answer: "Oscar Wilde",
    wrong: ["Bram Stoker", "Henry James", "Robert Louis Stevenson"],
    explanation: "The Picture of Dorian Gray is Oscar Wilde’s novel.",
    source: "https://www.gutenberg.org/ebooks/174",
  },
  {
    category: "Books",
    difficulty: "hard",
    question: "Who wrote The Woman in White?",
    answer: "Wilkie Collins",
    wrong: ["Anthony Trollope", "Thomas Hardy", "William Thackeray"],
    explanation: "The Woman in White was written by Wilkie Collins.",
    source: "https://www.gutenberg.org/ebooks/583",
  },
  {
    category: "Books",
    difficulty: "hard",
    question: "Which Restoration writer wrote Oroonoko?",
    answer: "Aphra Behn",
    wrong: ["Mary Astell", "Margaret Cavendish", "Eliza Haywood"],
    explanation: "Oroonoko was written by Aphra Behn.",
    source:
      "https://scholarsbank.uoregon.edu/server/api/core/bitstreams/ac72a123-6794-46be-bb0c-a6ee7cd5425f/content",
  },
  {
    category: "Nature",
    difficulty: "casual",
    question: "A platypus belongs to which broad animal group?",
    answer: "Mammals",
    wrong: ["Birds", "Reptiles", "Amphibians"],
    explanation: "Despite laying eggs, a platypus is a mammal.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "casual",
    question: "How does a female platypus produce its young?",
    answer: "Lays eggs",
    wrong: ["Gives birth in a pouch", "Splits in two", "Produces tadpoles"],
    explanation: "Platypuses are egg-laying mammals.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "casual",
    question: "Which covers a platypus’s body?",
    answer: "Fur",
    wrong: ["Scales", "Feathers", "A shell"],
    explanation: "Its dense waterproof fur keeps it insulated.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "casual",
    question: "In which kind of water does a platypus normally live?",
    answer: "Fresh water",
    wrong: ["Open ocean", "Deep sea", "Salt lakes"],
    explanation:
      "Platypuses live in rivers, creeks and other freshwater systems.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "medium",
    question: "Which platypus limbs provide most swimming propulsion?",
    answer: "Front limbs",
    wrong: ["Hind limbs", "All four equally", "None: it uses its tail"],
    explanation: "The webbed front limbs propel it; the hind feet help steer.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "medium",
    question:
      "What does a platypus do with its eyes while foraging underwater?",
    answer: "Closes them",
    wrong: [
      "Keeps only one open",
      "Rotates them backwards",
      "Covers them with its tail",
    ],
    explanation:
      "It closes eyes, ears and nostrils while its bill senses prey.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "hard",
    question: "What replaces functional teeth in an adult platypus?",
    answer: "Horny pads",
    wrong: [
      "A beak full of baleen",
      "Rows of tiny fangs",
      "A single grinding tooth",
    ],
    explanation:
      "Adult platypuses have horny pads instead of functional teeth.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Nature",
    difficulty: "hard",
    question:
      "Platypus ancestors evolved in the Australian–Antarctic part of which supercontinent?",
    answer: "Gondwana",
    wrong: ["Laurasia", "Laurentia", "Baltica"],
    explanation:
      "The fossil history links monotremes to that part of Gondwana.",
    source: "https://australian.museum/learn/animals/mammals/platypus/",
  },
  {
    category: "Numbers",
    difficulty: "casual",
    question: "What is 15% of 200?",
    answer: "30",
    wrong: ["15", "20", "35"],
    explanation: "10% is 20 and 5% is 10, so the total is 30.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "casual",
    question: "How many minutes are in two and a half hours?",
    answer: "150",
    wrong: ["125", "120", "180"],
    explanation: "2.5 × 60 = 150.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "casual",
    question: "A cube has how many edges?",
    answer: "12",
    wrong: ["6", "8", "16"],
    explanation:
      "There are four edges on top, four below and four joining them.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "casual",
    question: "Which fraction equals 0.75?",
    answer: "3/4",
    wrong: ["2/3", "1/4", "4/5"],
    explanation: "Three quarters is 75 hundredths.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "medium",
    question: "How many ways can three different books be arranged in a row?",
    answer: "6",
    wrong: ["3", "9", "12"],
    explanation: "There are 3 × 2 × 1 = 6 arrangements.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "medium",
    question:
      "At exactly 3:00, what is the smaller angle between the clock hands?",
    answer: "90°",
    wrong: ["60°", "120°", "180°"],
    explanation: "A quarter of a full 360° circle is 90°.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "hard",
    question: "What is the binary number 101101 in decimal?",
    answer: "45",
    wrong: ["41", "43", "47"],
    explanation: "32 + 8 + 4 + 1 = 45.",
    source: "",
  },
  {
    category: "Numbers",
    difficulty: "hard",
    question: "How many prime numbers are less than 30?",
    answer: "10",
    wrong: ["9", "11", "12"],
    explanation: "They are 2, 3, 5, 7, 11, 13, 17, 19, 23 and 29.",
    source: "",
  },

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
    term: "Petrichor",
    truth: "The earthy smell that arrives when rain falls on dry ground",
    aliases: ["smell of rain"],
    decoy: "A measuring cup used by perfumers",
    source: "https://www.merriam-webster.com/dictionary/petrichor",
  },
  {
    term: "Pareidolia",
    truth:
      "Seeing a familiar image in a random pattern, like a face in a cloud",
    aliases: ["seeing faces in clouds"],
    decoy: "The habit of sorting coins by their age",
    source: "https://www.merriam-webster.com/dictionary/pareidolia",
  },
  {
    term: "Sternutation",
    truth: "The act of sneezing",
    aliases: ["sneezing"],
    decoy: "A formal bow made before a meal",
    source: "https://www.merriam-webster.com/dictionary/sternutation",
  },
  {
    term: "Quincunx",
    truth: "Five objects arranged like the five dots on a die",
    aliases: ["five dots on a die"],
    decoy: "A lock that requires five separate keys",
    source: "https://www.merriam-webster.com/dictionary/quincunx",
  },
  {
    term: "Ferrule",
    truth: "A strengthening band or cap around a handle or shaft",
    aliases: ["metal band on a handle"],
    decoy: "A tiny shelf inside a bread oven",
    source: "https://www.merriam-webster.com/dictionary/ferrule",
  },
  {
    term: "Philtrum",
    truth: "The groove running from below the nose to the upper lip",
    aliases: ["groove above the lip"],
    decoy: "The curved handle of a small teacup",
    source: "https://www.merriam-webster.com/medical/philtrum",
  },
  {
    term: "Brumation",
    truth: "A reptile’s cold-weather period of greatly reduced activity",
    aliases: ["reptile dormancy"],
    decoy: "The slow cooling of newly made glass",
    source: "https://www.merriam-webster.com/dictionary/brumation",
  },
  {
    term: "Fulgurite",
    truth: "Glassy material formed when lightning fuses sand or rock",
    aliases: ["lightning glass"],
    decoy: "A mineral that glows only under moonlight",
    source: "https://www.merriam-webster.com/dictionary/fulgurite",
  },
  {
    term: "Susurrus",
    truth: "A soft whispering or rustling noise",
    aliases: ["rustling", "whispering"],
    decoy: "The moment a spinning coin falls flat",
    source: "https://www.merriam-webster.com/dictionary/susurrus",
  },
  {
    term: "Osculation",
    truth: "An act of kissing",
    aliases: ["kissing"],
    decoy: "The polishing of a tiny mirror",
    source: "https://www.merriam-webster.com/dictionary/osculation",
  },
  {
    term: "Velleity",
    truth: "A slight wish or inclination",
    aliases: ["slight wish"],
    decoy: "The shine left behind by a snail",
    source: "https://www.merriam-webster.com/dictionary/velleity",
  },
  {
    term: "Defenestration",
    truth: "Throwing someone or something through a window",
    aliases: ["throwing out of a window"],
    decoy: "Removing the seeds from a ripe pear",
    source: "https://www.merriam-webster.com/dictionary/defenestration",
  },
  {
    term: "Lunula",
    truth: "The pale crescent near the base of a fingernail",
    aliases: ["fingernail half moon"],
    decoy: "A small moon-shaped dessert spoon",
    source: "https://www.merriam-webster.com/medical/lunula",
  },
  {
    term: "Cacography",
    truth: "Poor spelling or untidy handwriting",
    aliases: ["bad spelling", "bad handwriting"],
    decoy: "A map showing abandoned railway lines",
    source: "https://www.merriam-webster.com/dictionary/cacography",
  },
  {
    term: "Uvula",
    truth: "The small fleshy part hanging at the back of the soft palate",
    aliases: ["dangly bit in throat"],
    decoy: "A flap inside the neck of a musical instrument",
    source: "https://www.merriam-webster.com/dictionary/uvula",
  },
  {
    term: "Palindrome",
    truth: "A word or number that reads identically in either direction",
    aliases: ["reads the same backwards"],
    decoy: "A building whose rooms form a spiral",
    source: "https://www.merriam-webster.com/dictionary/palindrome",
  },

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
