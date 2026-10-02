const fs = require("fs");
const path = require("path");
const vm = require("vm");

const poolPath = path.join(__dirname, "pool.js");
const existing = new Set();
if (fs.existsSync(poolPath)) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(poolPath, "utf8") + "\nthis.POOL = POOL;", ctx);
  for (const q of ctx.POOL) existing.add(q.prompt.replace(/\s+/g, " ").trim());
}

const items = [];
const seen = new Set();

function push(item) {
  const prompt = item.prompt.replace(/\s+/g, " ").trim();
  if (seen.has(prompt) || existing.has(prompt)) return false;
  const choices = [];
  const used = new Set();
  for (const value of item.choices) {
    const text = String(value).trim();
    if (!text || used.has(text)) continue;
    used.add(text);
    choices.push(text);
  }
  if (choices.length < 3 || choices.length > 6) return false;
  const answer = String(item.answer).trim();
  if (choices.filter(choice => choice === answer).length !== 1) return false;
  if (/oklahoma|how many states|united states|u\.s\.a|u\.s\. states/i.test(prompt)) return false;
  seen.add(prompt);
  items.push({
    tag: item.tag,
    band: item.band,
    prompt: item.prompt,
    choices,
    answer,
    why: item.why
  });
  return true;
}

function shuffled(answer, wrongs) {
  const choices = [answer, ...wrongs];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

const OPPOSITES = [
  ["generous", "stingy", ["kind", "giving", "lavish", "open"]],
  ["ancient", "modern", ["old", "historic", "aged", "early"]],
  ["candid", "evasive", ["frank", "honest", "open", "direct"]],
  ["frugal", "extravagant", ["thrifty", "careful", "sparing", "poor"]],
  ["fervent", "apathetic", ["eager", "passionate", "zealous", "ardent"]],
  ["vehement", "apathetic", ["ardent", "impassioned", "zealous", "fervent"]],
  ["timid", "bold", ["shy", "fearful", "quiet", "meek"]],
  ["scarce", "plentiful", ["rare", "sparse", "limited", "short"]],
  ["brief", "lengthy", ["short", "concise", "quick", "small"]],
  ["opaque", "transparent", ["cloudy", "dark", "solid", "thick"]],
  ["vacant", "occupied", ["empty", "bare", "open", "free"]],
  ["inept", "skilled", ["clumsy", "awkward", "bungling", "foolish"]],
  ["ambiguous", "clear", ["vague", "unclear", "doubtful", "hazy"]],
  ["loquacious", "quiet", ["talkative", "chatty", "wordy", "vocal"]],
  ["ephemeral", "permanent", ["fleeting", "brief", "temporary", "passing"]],
  ["mitigate", "worsen", ["lessen", "ease", "reduce", "soften"]],
  ["abundant", "scarce", ["plentiful", "ample", "rich", "full"]],
  ["elated", "miserable", ["joyful", "happy", "thrilled", "glad"]],
  ["reluctant", "willing", ["unwilling", "hesitant", "slow", "shy"]],
  ["meticulous", "careless", ["careful", "precise", "thorough", "exact"]],
  ["prudent", "reckless", ["careful", "wise", "cautious", "sensible"]],
  ["gawky", "graceful", ["awkward", "clumsy", "ungainly", "lanky"]],
  ["affluent", "poor", ["wealthy", "rich", "prosperous", "moneyed"]],
  ["stingy", "generous", ["mean", "miserly", "cheap", "tight"]],
  ["bold", "timid", ["brave", "daring", "confident", "fearless"]],
  ["permanent", "temporary", ["lasting", "enduring", "fixed", "stable"]],
  ["obscure", "clear", ["hidden", "vague", "dark", "unclear"]],
  ["hostile", "friendly", ["angry", "aggressive", "harsh", "cold"]],
  ["trivial", "important", ["minor", "small", "petty", "slight"]],
  ["rigid", "flexible", ["stiff", "firm", "strict", "hard"]],
  ["dormant", "active", ["idle", "inactive", "asleep", "quiet"]],
  ["novice", "expert", ["beginner", "learner", "newcomer", "pupil"]],
  ["concise", "wordy", ["brief", "short", "terse", "compact"]],
  ["barren", "fertile", ["empty", "dry", "bare", "lifeless"]],
  ["cordial", "hostile", ["warm", "friendly", "polite", "kind"]],
  ["feeble", "strong", ["weak", "frail", "fragile", "faint"]],
  ["impartial", "biased", ["fair", "neutral", "even", "just"]],
  ["expand", "shrink", ["grow", "enlarge", "increase", "spread"]],
  ["transparent", "opaque", ["clear", "sheer", "obvious", "open"]],
  ["zealous", "apathetic", ["eager", "passionate", "fervent", "ardent"]]
];

for (const [word, opposite, traps] of OPPOSITES) {
  const cap = word.toUpperCase();
  push({
    tag: "Opposite",
    band: 1,
    prompt: `The opposite of ${cap} is:`,
    choices: shuffled(opposite, traps),
    answer: opposite,
    why: `${cap} is opposite in meaning to ${opposite}.`
  });
  push({
    tag: "Opposite",
    band: 1,
    prompt: `Which word is most nearly opposite in meaning to "${word}"?`,
    choices: shuffled(opposite, traps),
    answer: opposite,
    why: `The opposite of ${word} is ${opposite}.`
  });
}

const SYNONYMS = [
  ["candid", "frank"],
  ["credit", "acclaim"],
  ["affluent", "wealthy"],
  ["gawky", "maladroit"],
  ["elated", "joyful"],
  ["meticulous", "careful"],
  ["reluctant", "unwilling"],
  ["manifest", "obvious"],
  ["evade", "elude"],
  ["brief", "short"],
  ["scarce", "rare"],
  ["vacant", "empty"],
  ["timid", "shy"],
  ["ancient", "old"],
  ["mitigate", "lessen"],
  ["prudent", "cautious"],
  ["novice", "beginner"],
  ["hostile", "unfriendly"],
  ["cordial", "friendly"],
  ["feeble", "weak"],
  ["concise", "terse"],
  ["dormant", "inactive"],
  ["impartial", "fair"],
  ["trivial", "minor"],
  ["rigid", "stiff"],
  ["obscure", "unclear"],
  ["permanent", "lasting"],
  ["ephemeral", "fleeting"],
  ["inept", "unskilled"],
  ["equivocal", "ambiguous"]
];

for (const [a, b] of SYNONYMS) {
  push({
    tag: "Verbal",
    band: 1,
    prompt: `The words ${a.toUpperCase()} and ${b.toUpperCase()} have ________ meanings.`,
    choices: ["Similar", "Opposite", "Unrelated"],
    answer: "Similar",
    why: `${a} and ${b} mean nearly the same thing.`
  });
  push({
    tag: "Verbal",
    band: 2,
    prompt: `${a.toUpperCase()} and ${b.toUpperCase()}. Do these words have:`,
    choices: ["opposite meanings", "similar meanings", "neither similar nor opposite meanings"],
    answer: "similar meanings",
    why: `${a} and ${b} are similar in meaning.`
  });
}

const MEANS = [
  ["manifest", "obvious", ["hidden", "theoretical", "indefinite", "doubtful"]],
  ["equivocal", "ambiguous", ["certain", "hostile", "permanent", "simple"]],
  ["chide", "scold", ["praise", "hurry", "fear", "delay"]],
  ["frugal", "thrifty", ["extravagant", "poor", "loud", "careless"]],
  ["candid", "frank", ["secretive", "rude", "timid", "false"]],
  ["inept", "unskilled", ["expert", "careful", "quick", "strong"]],
  ["apathetic", "uninterested", ["eager", "angry", "loud", "kind"]],
  ["zealous", "passionate", ["lazy", "calm", "doubtful", "shy"]],
  ["brief", "short", ["lengthy", "late", "wide", "heavy"]],
  ["scarce", "rare", ["plentiful", "cheap", "common", "open"]],
  ["vacant", "empty", ["occupied", "full", "busy", "closed"]],
  ["opaque", "not transparent", ["clear", "thin", "bright", "open"]],
  ["loquacious", "talkative", ["quiet", "shy", "rude", "slow"]],
  ["mitigate", "lessen", ["worsen", "ignore", "begin", "hide"]],
  ["reluctant", "unwilling", ["eager", "certain", "loud", "quick"]],
  ["meticulous", "very careful", ["careless", "fast", "late", "rude"]],
  ["elated", "joyful", ["miserable", "calm", "angry", "tired"]],
  ["prudent", "cautious", ["reckless", "loud", "late", "weak"]],
  ["gawky", "awkward", ["graceful", "strong", "quiet", "rich"]],
  ["affluent", "wealthy", ["poor", "busy", "famous", "young"]],
  ["timid", "shy", ["bold", "angry", "loud", "quick"]],
  ["generous", "giving", ["stingy", "rude", "late", "quiet"]],
  ["stingy", "miserly", ["generous", "kind", "loud", "brave"]],
  ["hostile", "unfriendly", ["friendly", "calm", "weak", "fair"]],
  ["novice", "beginner", ["expert", "teacher", "leader", "guest"]],
  ["dormant", "inactive", ["active", "loud", "new", "open"]],
  ["feeble", "weak", ["strong", "loud", "quick", "bold"]],
  ["impartial", "fair", ["biased", "angry", "late", "strict"]],
  ["trivial", "unimportant", ["important", "large", "rare", "final"]],
  ["cordial", "friendly", ["hostile", "formal", "quiet", "brief"]]
];

for (const [word, meaning, wrongs] of MEANS) {
  push({
    tag: "Verbal",
    band: 1,
    prompt: `${word.toUpperCase()} most nearly means:`,
    choices: shuffled(meaning, wrongs),
    answer: meaning,
    why: `${word} most nearly means ${meaning}.`
  });
}

const ANALOGIES = [
  ["glove", "hand", "sock", "foot", ["shoe", "toe", "cloth", "leg"]],
  ["hunger", "eat", "need", "purchase", ["money", "store", "salary", "price"]],
  ["buy", "sell", "deposit", "withdraw", ["bank", "save", "check", "interest"]],
  ["eye", "see", "ear", "hear", ["sound", "head", "ring", "talk"]],
  ["knife", "cut", "pen", "write", ["ink", "paper", "book", "draw"]],
  ["bird", "fly", "fish", "swim", ["water", "fin", "lake", "catch"]],
  ["painter", "brush", "writer", "pen", ["book", "story", "desk", "reader"]],
  ["hot", "cold", "up", "down", ["sky", "high", "left", "far"]],
  ["teacher", "school", "doctor", "hospital", ["nurse", "patient", "medicine", "clinic"]],
  ["page", "book", "scene", "play", ["actor", "stage", "film", "word"]],
  ["finger", "hand", "toe", "foot", ["shoe", "leg", "nail", "walk"]],
  ["bark", "dog", "meow", "cat", ["pet", "purr", "mouse", "fur"]],
  ["captain", "ship", "pilot", "plane", ["airport", "crew", "ticket", "runway"]],
  ["author", "book", "composer", "symphony", ["music", "piano", "concert", "note"]],
  ["thermometer", "temperature", "clock", "time", ["hour", "alarm", "minute", "bell"]],
  ["rain", "umbrella", "cold", "coat", ["winter", "hat", "boot", "snow"]],
  ["question", "answer", "problem", "solution", ["test", "work", "puzzle", "guess"]],
  ["artist", "painting", "poet", "poem", ["rhyme", "book", "verse", "song"]],
  ["baker", "bread", "tailor", "suit", ["cloth", "shop", "needle", "button"]],
  ["wheel", "car", "wing", "plane", ["bird", "sky", "pilot", "engine"]],
  ["seed", "plant", "egg", "bird", ["nest", "shell", "tree", "feather"]],
  ["wool", "sheep", "milk", "cow", ["farm", "drink", "grass", "barn"]],
  ["puppy", "dog", "kitten", "cat", ["pet", "fur", "mouse", "paw"]],
  ["chef", "kitchen", "teacher", "classroom", ["student", "lesson", "book", "desk"]],
  ["oar", "boat", "pedal", "bicycle", ["wheel", "ride", "road", "helmet"]],
  ["root", "tree", "foundation", "building", ["house", "wall", "brick", "door"]],
  ["dawn", "day", "dusk", "night", ["moon", "star", "evening", "dark"]],
  ["brake", "stop", "accelerator", "go", ["car", "speed", "fast", "driver"]],
  ["needle", "sew", "brush", "paint", ["color", "canvas", "art", "draw"]],
  ["shelf", "book", "hanger", "coat", ["closet", "wear", "hook", "shirt"]],
  ["compass", "direction", "scale", "weight", ["heavy", "pound", "size", "height"]],
  ["key", "lock", "password", "account", ["computer", "user", "bank", "screen"]],
  ["acorn", "oak", "seed", "flower", ["leaf", "soil", "garden", "vase"]],
  ["ink", "pen", "lead", "pencil", ["write", "paper", "eraser", "draw"]],
  ["chorus", "song", "chapter", "book", ["page", "read", "title", "author"]],
  ["map", "city", "blueprint", "building", ["house", "street", "plan", "brick"]],
  ["ice", "solid", "steam", "gas", ["cloud", "hot", "boil", "water"]],
  ["judge", "court", "surgeon", "hospital", ["nurse", "patient", "knife", "school"]],
  ["sugar", "sweet", "lemon", "sour", ["fruit", "yellow", "juice", "bitter"]],
  ["winter", "cold", "summer", "hot", ["sun", "beach", "year", "rain"]]
];

for (const [a, b, c, d, wrongs] of ANALOGIES) {
  push({
    tag: "Analogy",
    band: 2,
    prompt: `${a.toUpperCase()} is to ${b.toUpperCase()} as ${c.toUpperCase()} is to:`,
    choices: shuffled(d, wrongs),
    answer: d,
    why: `${a} goes with ${b} in the same way that ${c} goes with ${d}.`
  });
}

const ODDS = [
  [["mile", "foot", "yard", "inch", "ounce"], "ounce", "Ounce measures weight. The others measure length."],
  [["violin", "cello", "harp", "guitar", "drum"], "drum", "Drum is percussion. The others are string instruments."],
  [["red", "blue", "green", "yellow", "circle"], "circle", "Circle is a shape. The others are colors."],
  [["apple", "pear", "peach", "plum", "carrot"], "carrot", "Carrot is a vegetable. The others are fruits."],
  [["see", "hear", "taste", "smell", "walk"], "walk", "Walk is movement. The others are senses."],
  [["add", "subtract", "multiply", "divide", "write"], "write", "Write is not an arithmetic operation."],
  [["Monday", "Friday", "Sunday", "Wednesday", "March"], "March", "March is a month. The others are days."],
  [["circle", "square", "triangle", "oval", "cube"], "cube", "Cube is a solid. The others are flat shapes."],
  [["whisper", "shout", "murmur", "speak", "sprint"], "sprint", "Sprint is running. The others are ways of using the voice."],
  [["shirt", "hat", "sock", "glove", "hammer"], "hammer", "Hammer is a tool. The others are clothing."],
  [["sparrow", "robin", "eagle", "crow", "shark"], "shark", "Shark is a fish. The others are birds."],
  [["copper", "iron", "silver", "gold", "oak"], "oak", "Oak is a tree. The others are metals."],
  [["joy", "anger", "fear", "sorrow", "table"], "table", "Table is an object. The others are feelings."],
  [["inch", "centimeter", "meter", "yard", "gram"], "gram", "Gram measures mass. The others measure length."],
  [["novel", "poem", "essay", "play", "violin"], "violin", "Violin is an instrument. The others are kinds of writing."],
  [["plus", "minus", "times", "divided", "between"], "between", "Between is not an arithmetic sign."],
  [["rose", "tulip", "daisy", "lily", "pine"], "pine", "Pine is a tree. The others are flowers."],
  [["walk", "run", "jog", "sprint", "read"], "read", "Read is not a way of moving on foot."],
  [["triangle", "square", "pentagon", "hexagon", "sphere"], "sphere", "Sphere is a solid. The others are polygons."],
  [["doctor", "nurse", "surgeon", "dentist", "plumber"], "plumber", "Plumber is not a health profession."],
  [["bake", "boil", "fry", "roast", "sweep"], "sweep", "Sweep is cleaning. The others are ways of cooking."],
  [["piano", "flute", "trumpet", "drum", "easel"], "easel", "An easel holds a painting. The others are instruments."],
  [["river", "lake", "ocean", "stream", "desert"], "desert", "A desert is dry land. The others are water."],
  [["kitten", "puppy", "calf", "foal", "nest"], "nest", "A nest is a home. The others are young animals."],
  [["north", "south", "east", "west", "center"], "center", "Center is not a compass direction."]
];

for (const [words, odd, why] of ODDS) {
  push({
    tag: "Odd one out",
    band: 2,
    prompt: `Which word does NOT belong: ${words.join(", ")}?`,
    choices: shuffled(odd, words.filter(word => word !== odd)),
    answer: odd,
    why
  });
}

const TRIPLES = [
  ["hazy, foggy, humid", ["hazy, foggy, barren", "hazy, arid, barren", "foggy, arid, humid", "arid, humid, barren"], "Hazy, foggy, and humid all describe moist or unclear air."],
  ["shy, timid, bashful", ["shy, timid, bold", "bold, brave, timid", "shy, bold, loud", "brave, bold, bashful"], "Shy, timid, and bashful all mean unwilling to draw attention."],
  ["rich, wealthy, affluent", ["rich, wealthy, poor", "poor, needy, affluent", "wealthy, broke, rich", "affluent, poor, scarce"], "Rich, wealthy, and affluent all mean having plenty of money."],
  ["start, begin, commence", ["start, begin, finish", "end, stop, begin", "commence, finish, close", "start, end, halt"], "Start, begin, and commence all mean to get going."],
  ["tiny, small, minute", ["tiny, small, huge", "large, vast, minute", "small, huge, giant", "tiny, vast, enormous"], "Tiny, small, and minute all mean little in size."],
  ["angry, irate, furious", ["angry, irate, calm", "calm, peaceful, furious", "furious, gentle, angry", "irate, calm, mild"], "Angry, irate, and furious all mean very cross."],
  ["hide, conceal, cover", ["hide, conceal, reveal", "show, display, cover", "conceal, reveal, expose", "hide, show, uncover"], "Hide, conceal, and cover all mean to keep from view."],
  ["error, mistake, blunder", ["error, mistake, success", "success, triumph, blunder", "mistake, victory, win", "error, success, triumph"], "Error, mistake, and blunder all mean something done wrong."],
  ["quick, rapid, swift", ["quick, rapid, slow", "slow, late, swift", "rapid, sluggish, swift", "quick, slow, delayed"], "Quick, rapid, and swift all mean fast."],
  ["brave, bold, courageous", ["brave, bold, timid", "timid, shy, courageous", "bold, fearful, brave", "courageous, timid, meek"], "Brave, bold, and courageous all mean ready to face danger."],
  ["help, aid, assist", ["help, aid, hinder", "block, stop, assist", "aid, hinder, prevent", "help, block, resist"], "Help, aid, and assist all mean to give support."],
  ["end, finish, conclude", ["end, finish, start", "begin, open, conclude", "finish, start, launch", "end, begin, commence"], "End, finish, and conclude all mean to bring to a close."],
  ["wet, damp, moist", ["wet, damp, dry", "dry, arid, moist", "damp, parched, wet", "moist, dry, barren"], "Wet, damp, and moist all mean containing water."],
  ["happy, glad, joyful", ["happy, glad, sad", "sad, miserable, joyful", "glad, gloomy, happy", "joyful, sad, grim"], "Happy, glad, and joyful all mean pleased."],
  ["big, large, huge", ["big, large, tiny", "small, tiny, huge", "large, minute, big", "huge, small, slight"], "Big, large, and huge all mean great in size."]
];

for (const [answer, wrongs, why] of TRIPLES) {
  push({
    tag: "Verbal",
    band: 2,
    prompt: `Which three words have similar meanings?\n${[answer, ...wrongs].slice().sort().join("\n")}`,
    choices: shuffled(answer, wrongs),
    answer,
    why
  });
}

const PROVERBS = [
  ["Look before you leap.", "Haste makes waste.", "Similar", "Both warn against acting without thinking."],
  ["A stitch in time saves nine.", "An ounce of prevention is worth a pound of cure.", "Similar", "Both praise acting early to prevent a larger problem."],
  ["Birds of a feather flock together.", "A man is known by the company he keeps.", "Similar", "Both say people are known by those they associate with."],
  ["The early bird catches the worm.", "Haste makes waste.", "Unrelated", "One praises acting early. The other warns against rushing."],
  ["Still waters run deep.", "Actions speak louder than words.", "Unrelated", "One is about a quiet person's depth. The other compares deeds with talk."],
  ["Don't count your chickens before they hatch.", "Look before you leap.", "Unrelated", "One warns against assuming a result. The other warns against acting without looking."],
  ["Two heads are better than one.", "Many hands make light work.", "Similar", "Both say a job goes better when more than one person takes part."],
  ["Practice makes perfect.", "Haste makes waste.", "Unrelated", "One is about repetition. The other is about rushing."],
  ["A penny saved is a penny earned.", "Waste not, want not.", "Similar", "Both praise not wasting what you have."],
  ["When in Rome, do as the Romans do.", "Birds of a feather flock together.", "Unrelated", "One is about matching local custom. The other is about similar people grouping together."]
];

for (const [a, b, answer, why] of PROVERBS) {
  push({
    tag: "Proverb",
    band: 2,
    prompt: `Do the following two sayings have similar, contradictory, or unrelated meanings?\n"${a}" "${b}"`,
    choices: ["Similar", "Contradictory", "Unrelated"],
    answer,
    why
  });
}

const EASY_LOGIC = [
  ["sparrows", "a sparrow", "birds", "a bird"],
  ["roses in this garden", "a rose in this garden", "red", "red"],
  ["the pianos in the hall", "a piano in the hall", "tuned", "tuned"],
  ["the clerks in this office", "a clerk in this office", "salaried", "salaried"],
  ["owls", "an owl", "birds", "a bird"],
  ["the lamps in this shop", "a lamp in this shop", "electric", "electric"],
  ["the novels on this shelf", "a novel on this shelf", "fiction", "fiction"],
  ["goldfish", "a goldfish", "fish", "a fish"],
  ["the locks on this door", "a lock on this door", "metal", "metal"],
  ["the shirts in this box", "a shirt in this box", "cotton", "cotton"],
  ["eagles", "an eagle", "birds", "a bird"],
  ["the chairs in this room", "a chair in this room", "wooden", "wooden"]
];

const NAMES = ["Pip", "Mira", "Nora", "Evan", "Lina", "Hugo", "Rita", "Owen"];

for (const [group, one, category, property] of EASY_LOGIC) {
  for (const name of NAMES.slice(0, 2)) {
    const verb = property.split(" ").length > 1 ? "is" : "is";
    push({
      tag: "Logic",
      band: 2,
      prompt: `All ${group} are ${category}. ${name} is ${one}. Is ${name} ${property}?`,
      choices: ["Yes", "No", "Not certain"],
      answer: "Yes",
      why: `${name} is ${one}, and all ${group} are ${category}, so ${name} ${verb} ${property}.`
    });
    push({
      tag: "Logic",
      band: 2,
      prompt: `All ${group} are ${category}. ${name} is ${property}. Is ${name} ${one}?`,
      choices: ["Yes", "No", "Not certain"],
      answer: "Not certain",
      why: `Being ${property} does not show that ${name} is ${one}. Other things can be ${category} too.`
    });
    push({
      tag: "Logic",
      band: 2,
      prompt: `All ${group} are ${category}. ${name} is not ${property}. Is ${name} ${one}?`,
      choices: ["Yes", "No", "Not certain"],
      answer: "No",
      why: `If ${name} were ${one}, ${name} would be ${property}. ${name} is not, so ${name} is not ${one}.`
    });
  }
}

const HARD_LOGIC = [
  ["Some painters in the studio are musicians.", "All musicians rise early.", "Some painters in the studio rise early.", "True", "The painters who are musicians must rise early, because all musicians do."],
  ["Some cooks in the hotel are gardeners.", "All gardeners like rain.", "Some cooks in the hotel like rain.", "True", "The cooks who are gardeners like rain."],
  ["No reptiles have fur.", "All snakes are reptiles.", "Some snakes have fur.", "False", "Every snake is a reptile, and no reptile has fur, so no snake has fur."],
  ["No fish are mammals.", "All salmon are fish.", "Some salmon are mammals.", "False", "Salmon are fish, and no fish are mammals."],
  ["All drivers at the firm have a license.", "Some people with a license are not drivers at the firm.", "Some drivers at the firm do not have a license.", "False", "The first statement says every driver at the firm has a license."],
  ["All editors here know the style guide.", "Some people who know the style guide are not editors here.", "Some editors here do not know the style guide.", "False", "The first statement already says every editor here knows it."],
  ["Nina arrived before Omar.", "Omar arrived before Pia.", "Nina arrived before Pia.", "True", "Before carries through: Nina is ahead of Omar, and Omar is ahead of Pia."],
  ["Bill is taller than Sam.", "Sam is taller than Joe.", "Bill is taller than Joe.", "True", "The order of height carries through from Bill to Joe."],
  ["All dogs are mammals.", "Rex is a dog.", "Rex is a mammal.", "True", "Rex is a dog, and every dog is a mammal."],
  ["All cats are animals.", "Mist is a cat.", "Mist is an animal.", "True", "Mist is a cat, and every cat is an animal."],
  ["Either Kai or Lena opens the shop, but not both.", "Kai does not open the shop.", "Lena opens the shop.", "True", "Exactly one of them opens it, and Kai does not, so Lena does."],
  ["Either Amir or Noor locks the gate, but not both.", "Amir does not lock the gate.", "Noor locks the gate.", "True", "Exactly one locks it. Amir does not, so Noor does."],
  ["All analysts are careful.", "No careless person is trusted.", "Every analyst is trusted.", "Not certain", "Every analyst is careful. A careful person is not necessarily trusted."],
  ["All guides are patient.", "No impatient person is promoted.", "Every guide is promoted.", "Not certain", "Every guide is patient. A patient person is not necessarily promoted."],
  ["Some of these cards are red, and every red card is numbered.", "No numbered card is blank.", "Some of these cards are not blank.", "True", "The red cards are numbered, and numbered cards are not blank, so those cards are not blank."],
  ["Some of these boxes are sealed, and every sealed box is labeled.", "No labeled box is empty.", "Some of these boxes are not empty.", "True", "The sealed boxes are labeled, and labeled boxes are not empty, so those boxes are not empty."]
];

for (const [a, b, c, answer, why] of HARD_LOGIC) {
  push({
    tag: "Logic",
    band: 3,
    prompt: `Assume the first two statements are true.\n${a}\n${b}\nIs the final statement true, false, or not certain?\n${c}`,
    choices: ["True", "False", "Not certain"],
    answer,
    why
  });
}

function money(dollars) {
  if (Number.isInteger(dollars)) return `$${dollars.toLocaleString("en-US")}`;
  const cents = Math.round(dollars * 100);
  const whole = Math.floor(Math.abs(cents) / 100);
  const rem = Math.abs(cents) % 100;
  return `$${whole.toLocaleString("en-US")}.${String(rem).padStart(2, "0")}`;
}

const GOODS = ["pens", "mugs", "apples", "stamps", "notebooks", "lamps"];

for (let d = 2; d <= 12; d++) {
  for (let q = 2; q <= 12; q++) {
    const a = d * q;
    push({
      tag: "Arithmetic",
      band: 1,
      prompt: `What is ${a} divided by ${d}?`,
      choices: shuffled(String(q), [q + 1, q - 1, d, a, q * 2].filter(n => n > 0 && n !== q).map(String)),
      answer: String(q),
      why: `${a} ÷ ${d} = ${q}.`
    });
  }
}

for (let a = 3; a <= 12; a++) {
  for (let b = 3; b <= 12; b++) {
    const prod = a * b;
    push({
      tag: "Arithmetic",
      band: 1,
      prompt: `What is ${a} times ${b}?`,
      choices: shuffled(String(prod), [(a + 1) * b, a * (b + 1), a + b, prod + a, Math.max(1, (a - 1) * b)].filter(n => n !== prod).map(String)),
      answer: String(prod),
      why: `${a} × ${b} = ${prod}.`
    });
  }
}

for (const p of [10, 20, 25, 50]) {
  const bases = p === 25 ? [20, 40, 60, 80, 120, 160, 200] : [20, 30, 40, 50, 60, 80, 90, 100, 140, 180];
  for (const base of bases) {
    const answer = base * p / 100;
    if (!Number.isInteger(answer)) continue;
    push({
      tag: "Arithmetic",
      band: 1,
      prompt: `What is ${p}% of ${base}?`,
      choices: shuffled(String(answer), [base, p, answer + p, answer + 1, base - answer].filter(n => n > 0 && n !== answer).map(String)),
      answer: String(answer),
      why: `${p}% of ${base} = ${base} × ${p}/100 = ${answer}.`
    });
  }
}

for (const [den, word] of [[2, "one-half"], [3, "one-third"], [4, "one-fourth"], [5, "one-fifth"]]) {
  for (let k = 3; k <= 16; k++) {
    const base = den * k;
    push({
      tag: "Arithmetic",
      band: 1,
      prompt: `What is ${word} of ${base}?`,
      choices: shuffled(String(k), [base, den, k + 1, k * 2, base - k].filter(n => n > 0 && n !== k).map(String)),
      answer: String(k),
      why: `${word} of ${base} = ${base} / ${den} = ${k}.`
    });
  }
}

let goodsCount = 0;
for (const itemName of GOODS) {
  for (const cents of [25, 50, 75, 125, 150, 200]) {
    for (const count of [2, 3, 4, 5, 6, 8]) {
      if (goodsCount >= 72) continue;
      const total = cents * count;
      const price = money(cents / 100);
      const answer = money(total / 100);
      const cap = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      if (push({
        tag: "Arithmetic",
        band: 1,
        prompt: `${cap} cost ${price} each. How much do ${count} ${itemName} cost?`,
        choices: shuffled(answer, [total + cents, total - cents, cents * 2, total + 100].filter(n => n > 0).map(n => money(n / 100))),
        answer,
        why: `${count} × ${price} = ${answer}.`
      })) goodsCount++;
    }
  }
}

for (let start = 1; start <= 15; start++) {
  for (const step of [2, 3, 4, 5, 6, 7, 8, 9]) {
    const terms = [0, 1, 2, 3, 4].map(i => start + i * step);
    const next = start + 5 * step;
    push({
      tag: "Series",
      band: 1,
      prompt: `What number comes next?\n${terms.join(", ")}, ___`,
      choices: shuffled(String(next), [next + 1, next - 1, next + step, terms[4], next + 2].filter(n => n > 0 && n !== next).map(String)),
      answer: String(next),
      why: `Each term increases by ${step}. The next term is ${next}.`
    });
  }
}

for (let root = 1; root <= 10; root++) {
  const terms = [0, 1, 2, 3, 4].map(i => (root + i) ** 2);
  const next = (root + 5) ** 2;
  push({
    tag: "Series",
    band: 2,
    prompt: `What number comes next in the series of squares?\n${terms.join(", ")}, ___`,
    choices: shuffled(String(next), [next + 1, next - 1, next + root, terms[4] + 1, next + 2].filter(n => n !== next).map(String)),
    answer: String(next),
    why: `These are consecutive squares. The next square is ${next}.`
  });
}

const PAIRS = [["Nora", "Eli"], ["Maya", "Owen"], ["Lina", "Evan"], ["Sara", "Noah"], ["Rita", "Adam"], ["Vera", "Hugo"]];
for (const [olderName, youngerName] of PAIRS) {
  for (const r of [2, 3, 4]) {
    for (const younger of [6, 8, 9, 12, 14]) {
      const older = younger * r;
      const total = older + younger;
      const word = { 2: "twice", 3: "three times", 4: "four times" }[r];
      push({
        tag: "Arithmetic",
        band: 2,
        prompt: `${olderName} is ${word} as old as ${youngerName}. Their ages total ${total}. How old is ${olderName}?`,
        choices: shuffled(String(older), [younger, total, older + r, older - r, r].filter(n => n > 0 && n !== older).map(String)),
        answer: String(older),
        why: `${olderName} has ${r} shares and ${youngerName} has 1. ${total} / ${r + 1} × ${r} = ${older}.`
      });
    }
  }
}

for (const cost of [20, 40, 50, 60, 80, 100]) {
  for (const p of [10, 20, 25, 50]) {
    const profit = cost * p / 100;
    if (!Number.isInteger(profit)) continue;
    const sell = cost + profit;
    push({
      tag: "Arithmetic",
      band: 2,
      prompt: `A store buys an item for ${money(cost)} and sells it for ${money(sell)}. What is the profit percent on the cost?`,
      choices: shuffled(`${p}%`, [`${p + 5}%`, `${p - 5}%`, `${sell}%`, "15%", "35%"].filter(x => x !== `${p}%`)),
      answer: `${p}%`,
      why: `Profit is ${money(profit)} on a ${money(cost)} cost. ${profit} / ${cost} = ${p}%.`
    });
  }
}

for (const speed of [30, 40, 45, 48, 50, 60, 75]) {
  for (const minutes of [12, 15, 20, 30, 40]) {
    if ((speed * minutes) % 60 !== 0) continue;
    const miles = speed * minutes / 60;
    push({
      tag: "Rate",
      band: 2,
      prompt: `A train travels at ${speed} miles per hour. How many miles does it travel in ${minutes} minutes?`,
      choices: shuffled(String(miles), [speed, minutes, miles * 2, miles + 5, Math.max(1, miles - 5)].filter(n => n !== miles).map(String)),
      answer: String(miles),
      why: `${minutes} minutes is ${minutes}/60 of an hour. ${speed} × ${minutes}/60 = ${miles}.`
    });
  }
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

for (let a = 2; a <= 9; a++) {
  for (let b = a + 1; b <= 12; b++) {
    if (gcd(a, b) !== 1) continue;
    const num = a + b;
    const den = a * b;
    const answer = `${num}/${den}`;
    push({
      tag: "Arithmetic",
      band: 2,
      prompt: `What is the sum of 1/${a} and 1/${b}?`,
      choices: shuffled(answer, [`1/${a + b}`, `${b - a}/${den}`, `${num}/${a + b}`, `${a}/${b}`, `${num}/${den + 1}`]),
      answer,
      why: `1/${a} + 1/${b} = ${b}/${den} + ${a}/${den} = ${answer}.`
    });
  }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function addDays(name, n) {
  return DAYS[((DAYS.indexOf(name) + n) % 7 + 7) % 7];
}
let calendarCount = 0;
for (const month of ["March", "April", "May", "June", "July", "August"]) {
  const len = { March: 31, April: 30, May: 31, June: 30, July: 31, August: 31 }[month];
  for (const d1 of [1, 3, 5, 8]) {
    for (const gap of [4, 6, 9, 11, 13, 15]) {
      const d2 = d1 + gap;
      if (d2 > len) continue;
      for (const start of ["Monday", "Tuesday", "Thursday", "Saturday"]) {
        if (calendarCount >= 48) continue;
        const answer = addDays(start, gap);
        if (push({
          tag: "Calendar",
          band: 2,
          prompt: `${month} ${d1} is a ${start}. What day of the week is ${month} ${d2}?`,
          choices: shuffled(answer, DAYS.filter(day => day !== answer).slice(0, 4)),
          answer,
          why: `${month} ${d2} is ${gap} days later. ${gap} mod 7 is ${gap % 7}, so ${start} moves forward to ${answer}.`
        })) calendarCount++;
      }
    }
  }
}

let digitCount = 0;
for (let d = 0; d <= 9; d++) {
  for (const n of [20, 30, 40, 50, 60, 80, 100]) {
    let count = 0;
    for (let i = 1; i <= n; i++) {
      for (const ch of String(i)) if (ch === String(d)) count++;
    }
    if (count < 2 || digitCount >= 40) continue;
    if (push({
      tag: "Arithmetic",
      band: 3,
      prompt: `If you count continuously from 1 to ${n}, how many times will you encounter the digit ${d}?`,
      choices: shuffled(String(count), [count + 1, count - 1, count + 2, count + 10, Math.max(0, count - 10)].filter(v => v !== count && v >= 0).map(String)),
      answer: String(count),
      why: `From 1 through ${n}, the digit ${d} is written ${count} times. A repeated digit counts each time it is written.`
    })) digitCount++;
  }
}

let filler = 20;
while (items.length < 1000 && filler < 400) {
  const a = 10 + (filler % 40);
  const b = 3 + (filler % 9);
  const sum = a + b;
  push({
    tag: "Arithmetic",
    band: 1,
    prompt: `What is ${a} plus ${b}?`,
    choices: shuffled(String(sum), [sum + 1, sum - 1, a * b, sum + b, a - b].filter(n => n !== sum && n > 0).map(String)),
    answer: String(sum),
    why: `${a} + ${b} = ${sum}.`
  });
  filler++;
}

function dropUntil(limit, test) {
  for (let i = items.length - 1; i >= 0 && items.length > limit; i--) {
    if (test(items[i])) items.splice(i, 1);
  }
}
dropUntil(1000, q => /divided by \d| times \d/.test(q.prompt));
dropUntil(1000, q => /What number comes next\?\n/.test(q.prompt) && q.band === 1);
if (items.length > 1000) {
  console.error("still over", items.length);
  process.exit(1);
}

const bands = { 1: 0, 2: 0, 3: 0 };
for (const item of items) bands[item.band]++;
if (items.length !== 1000) {
  console.error("count", items.length, bands);
  process.exit(1);
}

const out = "const EXTRA = " + JSON.stringify(items, null, 2) + ";\n";
fs.writeFileSync(path.join(__dirname, "extra-1000.js"), out);
console.log("wrote", items.length, bands);
