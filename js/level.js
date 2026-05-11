// text messages indexed by levels
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
  "parDeaths": 3,
  "parTime": 30,
  "width": 512,
  "height": 512,
  "spawn": {
    "x": 16,
    "y": 488
  },
  "goal": {
    "x": 56,
    "y": 488,
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
    },
    {
      "x": 320,
      "y": 480,
      "width": 40,
      "height": 32
    },
    {
      "x": 360,
      "y": 480,
      "width": 16,
      "height": 8
    },
    {
      "x": 352,
      "y": 424,
      "width": 8,
      "height": 8
    },
    {
      "x": 320,
      "y": 424,
      "width": 8,
      "height": 8
    },
    {
      "x": 304,
      "y": 408,
      "width": 16,
      "height": 48
    },
    {
      "x": 8,
      "y": 408,
      "width": 296,
      "height": 16
    },
    {
      "x": 0,
      "y": 408,
      "width": 8,
      "height": 88
    },
    {
      "x": 360,
      "y": 408,
      "width": 16,
      "height": 48
    },
    {
      "x": 360,
      "y": 456,
      "width": 8,
      "height": 8
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
    },
    {
      "x": 304,
      "y": 504,
      "width": 16,
      "height": 8
    },
    {
      "x": 360,
      "y": 504,
      "width": 152,
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
  ],
  "springs": [
    {
      "x": 336,
      "y": 472,
      "width": 8,
      "height": 8,
      "force": 300,
      "rotation": 0
    }
  ],
  "movingPlatforms": [
    {
      "x": 376,
      "y": 480,
      "width": 24,
      "height": 8,
      "speed": 30,
      "waypoints": [
        {
          "x": 376,
          "y": 480
        },
        {
          "x": 376,
          "y": 400
        },
        {
          "x": 360,
          "y": 400
        }
      ]
    }
  ],
  "airVents": [
    {
      "x": 192,
      "y": 480,
      "rotation": 0,
      "force": 200,
      "range": 40
    }
  ],
  "doors": [
    {
      "x": 368,
      "y": 464,
      "height": 16,
      "openTime": 3,
      "closeTime": 2
    }
  ],
  "hiddenSpikes": [
    {
      "x": 104,
      "y": 488,
      "triggerDistance": 20
    }
  ]
}
];
