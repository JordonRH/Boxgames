import type { Scenario } from "../../shared/types.js";
const packs: [
  string,
  string,
  [string, string, string],
  [string, string, string],
][] = [
  [
    "Rain check",
    "A town has one weekend to improve its rainiest bus stop.",
    ["Puddle Post", "Dry-Seat Carousel", "Cloud Exchange"],
    [
      "Stepping stones that form a new route after every shower.",
      "A slowly turning bench that keeps one seat sheltered.",
      "Borrow an umbrella. Return a weather prediction.",
    ],
  ],
  [
    "The midnight market",
    "The night market needs a reason for people to stay past their bedtime.",
    ["Moon Soup", "Pocket Orchestra", "Dream Repairs"],
    [
      "A soup stall whose menu changes with the moon.",
      "Tiny concerts performed inside enormous coat pockets.",
      "A repair desk for unfinished dreams.",
    ],
  ],
  [
    "A very small island",
    "An island the size of a tennis court wants to become a destination.",
    ["One-Tree Forest", "Ferry for Two", "Low-Tide Museum"],
    [
      "A forest with exactly one extremely well-signposted tree.",
      "A two-seat ferry with a surprisingly formal captain.",
      "Exhibits that only appear when the sea steps back.",
    ],
  ],
  [
    "Office of the future",
    "Your office has a budget for making Mondays less Monday.",
    ["Meeting Meadow", "Snack Elevator", "Quiet Cloud"],
    [
      "Replace one meeting room with a tiny wildflower meadow.",
      "A dedicated lift that delivers snacks, never people.",
      "A soundproof pod for thinking absolutely nothing.",
    ],
  ],
  [
    "Station celebration",
    "The last train station on the line is throwing its first festival.",
    ["Platform Picnic", "Lost-Glove Ball", "Departure Disco"],
    [
      "A picnic where the tables run along unused rails.",
      "A dance for people wearing mismatched lost-property gloves.",
      "A light show choreographed to the departure board.",
    ],
  ],
  [
    "Museum after hours",
    "A museum has room for one wonderfully unnecessary new department.",
    ["Future Fossils", "Almost Inventions", "Ordinary Wonders"],
    [
      "Fossils of objects that have not been invented yet.",
      "Inventions that came very close to working.",
      "A grand exhibition of spectacularly ordinary things.",
    ],
  ],
  [
    "Neighbourhood upgrade",
    "A street wins a grant to make everyday errands more interesting.",
    ["Bread Bell", "Bench Library", "Crosswalk Choir"],
    [
      "A bell tower that announces freshly baked bread.",
      "Benches with a drawer of books and emergency biscuits.",
      "Crossing signals sung by a very patient choir.",
    ],
  ],
  [
    "The rooftop club",
    "An apartment roof becomes a shared escape above the city.",
    ["Sky Garden", "Star Desk", "Laundry Cinema"],
    [
      "A garden of plants selected for excellent silhouettes.",
      "A desk where you can write letters to distant stars.",
      "Films projected onto freshly washed bedsheets.",
    ],
  ],
  [
    "Winter without snow",
    "A warm town wants all the excitement of a snow day.",
    ["Sock Slope", "Cocoa Canal", "Scarf Exchange"],
    [
      "A polished wooden hill for sliding in enormous socks.",
      "A miniature canal delivering cups of warm cocoa.",
      "Trade scarves and invent stories about where they have been.",
    ],
  ],
  [
    "The library experiment",
    "Your library is testing three ways to bring stories outside.",
    ["Plot Walk", "Ending Booth", "Book Picnic"],
    [
      "A walking route with a new chapter at each corner.",
      "A phone booth where strangers record alternative endings.",
      "Borrow a basket containing lunch and a mystery novel.",
    ],
  ],
  [
    "Harbour of hobbies",
    "An unused harbour is becoming a place to try something new.",
    ["Kite Pier", "Floating Studio", "Bottle Orchestra"],
    [
      "A pier dedicated to extremely ambitious kite designs.",
      "An art studio that gently drifts between moorings.",
      "An orchestra made entirely of rescued glass bottles.",
    ],
  ],
  [
    "Welcome to tomorrow",
    "A village is burying a time capsule, but wants a bigger send-off.",
    ["Future Feast", "Message Orchard", "Tomorrow Parade"],
    [
      "Cook a dinner that people might eat in a hundred years.",
      "Plant trees with messages tucked into weatherproof tags.",
      "A parade of homemade predictions about future transport.",
    ],
  ],
  [
    "The tiny airport",
    "A small airport wants its delays to become the best part of the trip.",
    ["Gate Garden", "Suitcase Stage", "Cloud Kitchen"],
    [
      "A garden with every plant named after a destination.",
      "A fold-out theatre built from retired suitcases.",
      "Cooking lessons inspired by shapes seen in passing clouds.",
    ],
  ],
  [
    "Summer on a budget",
    "A community centre needs a holiday feeling without leaving town.",
    ["Indoor Coast", "Postcard Desk", "Breeze Machine"],
    [
      "A beach made of cushions, warm lights and excellent sea sounds.",
      "Send illustrated postcards from imaginary destinations.",
      "A bicycle-powered breeze with adjustable seaside scent.",
    ],
  ],
  [
    "The wandering fair",
    "A travelling fair needs one new attraction that fits in a van.",
    ["Shadow Zoo", "Teacup Planet", "Puzzle Bakery"],
    [
      "A zoo of enormous shadows made by very small objects.",
      "Explore a whole imaginary planet arranged inside teacups.",
      "Solve a puzzle to discover which pastry you just ordered.",
    ],
  ],
  [
    "Town square reboot",
    "An empty square wants to become somewhere people stop.",
    ["Lunch Compass", "Story Fountain", "Borrowed Chairs"],
    [
      "A giant compass pointing towards nearby lunch specials.",
      "A fountain whose ripples trigger tiny recorded stories.",
      "A colourful collection of chairs donated by the whole town.",
    ],
  ],
  [
    "The slow race",
    "A park is holding a competition where taking your time is the point.",
    ["Snail Stadium", "Picnic Relay", "Cloud Watching"],
    [
      "An elaborate stadium for very short snail journeys.",
      "Pass a picnic basket while stopping to admire every flower.",
      "Teams give names to clouds before they drift away.",
    ],
  ],
  [
    "A brighter blackout",
    "A neighbourhood plans a cheerful evening with the power turned off.",
    ["Lantern Trail", "Acoustic Arcade", "Starlight Supper"],
    [
      "A trail of handmade lanterns connecting front gardens.",
      "An arcade of mechanical games and homemade sound effects.",
      "A shared dinner with a different constellation at every table.",
    ],
  ],
];
export const scenarios: Scenario[] = packs.map(
  ([title, brief, names, descriptions], i) => ({
    id: `scenario-${i + 1}`,
    title,
    brief,
    projects: names.map((name, j) => ({
      name,
      description: descriptions[j],
      symbol: ["orbit", "spark", "layers"][j],
    })) as Scenario["projects"],
  }),
);
