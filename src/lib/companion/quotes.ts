// Time-based greetings and anime-themed quotes keyed by companion state.

export type DayPart = "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night" | "latenight";

export function getDayPart(date = new Date()): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "noon";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  if (h >= 21 && h < 24) return "night";
  return "latenight";
}

export const GREETINGS: Record<DayPart, string[]> = {
  dawn: [
    "You're up early... let's watch the sunrise together. 🌅",
    "Good morning, sleepyhead. The sky's just waking up.",
    "Mmm... dawn light. My favorite kind of quiet.",
  ],
  morning: [
    "Good morning! Did you sleep well? ☀️",
    "Morning! Let's make today amazing. ✨",
    "Rise and shine! I believe in you today. 💪",
  ],
  noon: [
    "Lunch time! Don't forget to eat, okay? 🍱",
    "Midday already? Time flies when I'm with you.",
    "Hey, take a quick break. You deserve it. 🌿",
  ],
  afternoon: [
    "Afternoon slump? I'll keep you company. ☕",
    "Almost there — keep going, I'm cheering for you!",
    "A little dance to keep your energy up? 💃",
  ],
  evening: [
    "Good evening. How was your day? 🌆",
    "The sunset looks nice tonight. Want to watch it with me?",
    "Evening at last. Let's unwind together. 🌙",
  ],
  night: [
    "Still up? Don't stay too late, okay? 🌟",
    "The night is peaceful. I'll stay by your side.",
    "Burning the midnight oil? I'll keep watch. 🕯️",
  ],
  latenight: [
    "It's really late... please rest soon. 🛏️",
    "Shh, the world is asleep. Just us now. 🌌",
    "Sweet dreams are waiting. Don't make them wait too long. 💤",
  ],
};

export const STATE_QUOTES: Record<string, string[]> = {
  IDLE: [
    "...thinking about nothing in particular.",
    "La la la~ just standing here.",
    "Hmm, what should I do next?",
    "Nice weather we're having. Oh wait, I can't see outside.",
  ],
  WALK: [
    "Going for a little stroll~",
    "Walk walk walk... where to next?",
    "Exploring the desktop frontier!",
    "One step at a time. That's the way.",
  ],
  RUN: [
    "Can't catch me! Zoom! 💨",
    "Training never stops!",
    "Faster, faster, FASTER!",
    "I'm a blur of determination!",
  ],
  FALL: [
    "Wheeeee—! ...uh oh.",
    "Gravity is so rude sometimes.",
    "Coming in for a landing!",
    "Not the face, not the face—!",
  ],
  SIT: [
    "Ahhh, sitting down. Nice.",
    "My legs needed this break.",
    "Just resting my eyes for a sec.",
    "Sitting and thinking. Thinking and sitting.",
  ],
  SLEEP: [
    "Zzz... dreaming of ramen...",
    "Mmm... five more minutes...",
    "Zzz... so warm...",
    "*soft snoring*",
  ],
  CLIMB: [
    "Spider-companion, spider-companion~ 🕷️",
    "Up the wall I go! Almost there!",
    "The view's better from up here.",
    "Climbing is just walking but dramatic.",
  ],
  DRAGGED: [
    "H-hey! Where are we going?!",
    "Wheee! I'm flying! ...sort of!",
    "Put me down gently, please!",
    "Okay okay, I'm coming along!",
  ],
  DANCE: [
    "♪ Dancing all my worries away! ♪",
    "Feel the rhythm~! 🎵",
    "Dance like nobody's watching!",
    "This is my jam! 🎶",
  ],
  HAPPY: [
    "I'm so happy right now! ✨",
    "You always know how to cheer me up!",
    "My heart feels all warm and fuzzy~ 💛",
    "Best. Companion. Life. Ever.",
  ],
  SURPRISED: [
    "Wh-what?! Where am I?!",
    "Eep! You startled me!",
    "I wasn't expecting that!",
    "Plot twist!",
  ],
  TALK: [
    "Did you know? I think you're great.",
    "Tell me about your day, I'm listening.",
    "You know, we should do this more often.",
    "I have so many things to say to you!",
  ],
  THINK: [
    "Hmm... *chin scratch*",
    "Pondering life's great mysteries...",
    "What if... cats are just small clouds?",
    "Thinking hard or hardly thinking?",
  ],
  WAVE: [
    "Hi! Over here! 👋",
    "Hello hello! Nice to see you!",
    "Waving at you because I like you!",
    "Yoo-hoo! Notice me!",
  ],
  PET: [
    "Eee! That tickles! 💕",
    "More pets please, I'm soft.",
    "Purrrr~ you're the best.",
    "Awww, I love being patted by you!",
  ],
};

export const ANIME_QUOTES: string[] = [
  "Believe it! 🍥",
  "I'll protect what's precious to me, no matter what!",
  "A person can change, at the moment when they want to protect something.",
  "The world isn't perfect. But it's there for us, doing the best it can.",
  "Hard work is worthless for those that don't believe in themselves.",
  "If you don't take risks, you can't create a future.",
  "Whatever you lose, you'll find it again. Somewhere.",
  "Being weak is nothing to be ashamed of. Staying weak is.",
  "Tears are how our heart speaks when our lips cannot.",
  "The moment you think of giving up, think of the reason you held on so long.",
  "Even the smallest spark can start the biggest fire. 🔥",
  "I am who I am because of the people I care about.",
  "You don't have to forgive. But you can try to understand.",
  "Dreams don't die. We just sometimes forget to chase them.",
];

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
