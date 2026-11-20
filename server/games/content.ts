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
  [
    "The lost sock bureau",
    "The laundrette wants to reunite missing socks with their owners.",
    ["Sock Portraits", "Laundry Hotline", "Lonely Sock Prom"],
    [
      "Portraits of missing socks on every noticeboard.",
      "A detective hotline staffed by retired washing machines.",
      "A weekly dance for socks seeking a new match.",
    ],
  ],
  [
    "A pigeon conference",
    "The station pigeons are hosting their first international conference.",
    ["Crumb Summit", "Roof Diplomacy", "Coop Awards"],
    [
      "A grand debate over the ideal sandwich crumb.",
      "A rooftop reception with miniature flags.",
      "An awards show for outstanding public loafing.",
    ],
  ],
  [
    "The sleepy aquarium",
    "The aquarium needs a new attraction for quiet weekday evenings.",
    ["Fish Radio", "Coral Book Club", "Bubble Theatre"],
    [
      "A radio station with playlists chosen by fish.",
      "A reading corner facing the most opinionated coral.",
      "Tiny dramas performed entirely in bubbles.",
    ],
  ],
  [
    "The roundabout festival",
    "A small suburb wants to celebrate its beloved traffic roundabout.",
    ["Circle Marathon", "Island Picnic", "Indicator Orchestra"],
    [
      "A race where nobody ever reaches the finish.",
      "A ceremonial picnic on the central island.",
      "An orchestra made from perfectly timed indicators.",
    ],
  ],
  [
    "An ambitious bakery",
    "A bakery has bought a huge oven and needs an opening stunt.",
    ["Bread Skyline", "Bun Parliament", "Toast Gallery"],
    [
      "A model of the entire town built from bread.",
      "A public election between competing cinnamon buns.",
      "A gallery of famous portraits burned into toast.",
    ],
  ],
  [
    "A polite haunted house",
    "A friendly ghost wants to improve its guest experience.",
    ["Scheduled Spooks", "Ghost Concierge", "Midnight Compliments"],
    [
      "Book a convenient time to be mildly startled.",
      "A floating concierge who carries your emotional baggage.",
      "A voice that whispers reassuring compliments at midnight.",
    ],
  ],
  [
    "The spare chair museum",
    "A museum has inherited hundreds of mismatched chairs.",
    ["Chair Speed Dating", "Seat History", "The Great Sit"],
    [
      "Visitors test chairs in a series of brief meetings.",
      "An audio tour of the arguments every chair has overheard.",
      "A perfectly coordinated public sit-down.",
    ],
  ],
  [
    "The weekend weather office",
    "The local weather office wants to make forecasts more personal.",
    ["Mood Clouds", "Rain Reviews", "Forecast Swap"],
    [
      "A daily cloud forecast matched to your mood.",
      "A five-star review system for each rain shower.",
      "Trade an unwanted forecast for someone else’s sunshine.",
    ],
  ],
  [
    "The tiny cinema",
    "A cinema with twelve seats needs a new signature event.",
    ["Trailer Marathon", "Audience Commentary", "Popcorn Lab"],
    [
      "An entire evening of trailers for imaginary films.",
      "The audience records the commentary before seeing the film.",
      "A scientific tasting panel for improbable popcorn flavours.",
    ],
  ],
  [
    "The grand library return",
    "The library is celebrating the return of a book sixty years overdue.",
    ["Amnesty Parade", "Book Spa", "Fine Roulette"],
    [
      "A parade for everyone carrying an overdue book.",
      "A restorative spa day for very tired paperbacks.",
      "A wheel that replaces overdue fines with harmless dares.",
    ],
  ],
  [
    "The ordinary superhero league",
    "Local superheroes have useful but extremely small powers.",
    ["Queue Rescue", "Jar Patrol", "Receipt Recovery"],
    [
      "A hero who always chooses the fastest checkout queue.",
      "A team that opens stubborn jars in emergencies.",
      "A specialist who finds receipts seconds before they expire.",
    ],
  ],
  [
    "The gardeners’ gala",
    "The allotment society has enough prize vegetables for a grand event.",
    ["Carrot Couture", "Marrow Opera", "Compost Debate"],
    [
      "A fashion show featuring vegetable-sized evening wear.",
      "An opera about a marrow seeking a more exciting life.",
      "A formal debate over the future of compost.",
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
