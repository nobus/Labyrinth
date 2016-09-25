'use strict';

module.exports = {
  "ranges": {
    "static": {
      "halfBlock": [0, 499],
      "block": [500, 999]
    },
    "dynamic": {
      "block": [1000, 1999],
      "halfBlock": [2000, 2999],
      "entrances": [3000, 3099],
      "exits": [3100, 3199],
      "noBlock": [3200, NaN]
    }
  },
  "static": {
    "halfBlock": [
      {"name": "water0"}
      ,{"name": "lava0"}
      ,{"name": "morass0"}
    ],
    "block": [
      {"name": "rock0"}
    ]
  },
  "dynamic": {
    "block": [
      {"name": "tree0"}
      ,{"name": "tree1"}
    ],
    "halfBlock": [
      {"name": "stone0"}
      ,{"name": "stump0"}
      ,{"name": "stump1"}
      ,{"name": "stump2"}
    ],
    "entrances": [
      {"name": "dungeon_entrance0"}
    ],
    "exits": [
      {"name": "dungeon_exit0"}
      ,{"name": "dungeon_exit1"}
    ],
    "noBlock": [
      {"name": "flower0"}
      ,{"name": "berry0"}
      ,{"name": "berry1"}
      ,{"name": "mushroom0"}
      ,{"name": "grass0"}
      ,{"name": "ground0"}
      ,{"name": "swamp0"}
    ]
  }
};
