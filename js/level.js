// Text messages indexed by levels
export const LEVEL_TEXTS = [
  "WELCOME TO CSIWP",
  "JUMP OVER THIS GAP",
  "WATCH OUT FOR SPIKES!",
  "USE THE CONVEYOR OR DONT",
  "DONT FALL!",
  "YOURE DEFINITELY GETTING THERE",
  "JUST KIDDING YOURE NOT",
  "GOOD LUCK!",
];

// taken from the level editor

export const levels = [
{
  "width": 512,
  "height": 512,
  "spawn": {
    "x": 16,
    "y": 488
  },
  "goal": {
    "x": 376,
    "y": 96,
    "width": 8,
    "height": 8
  },
  "platforms": [
    {
      "x": 0,
      "y": 496,
      "width": 152,
      "height": 16
    },
    {
      "x": 184,
      "y": 488,
      "width": 120,
      "height": 24
    }
  ],
  "hazards": [
    {
      "x": 152,
      "y": 504,
      "width": 32,
      "height": 8
    },
    {
      "x": 232,
      "y": 480,
      "width": 32,
      "height": 8
    }
  ],
  "conveyors": [],
  "texts": [
    {
      "x": 40,
      "y": 456,
      "textIndex": 0,
      "scale": 0.25
    },
    {
      "x": 144,
      "y": 464,
      "textIndex": 1,
      "scale": 0.25
    },
    {
      "x": 240,
      "y": 448,
      "textIndex": 2,
      "scale": 0.25
    }
  ]
}
];
