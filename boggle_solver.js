"use strict";

/**
 * Boggle solver and toolkit.
 *
 * Finds every dictionary word that can be traced on the board by stepping
 * between adjacent tiles (including the four diagonals) without reusing a
 * tile within a single word.
 *
 * Tiles may carry more than one letter ("Qu", "St", "Ie"); a tile's full text
 * is appended to the word being built, so a two-letter tile contributes two
 * letters. Matching is case-insensitive and words must be at least three
 * letters long.
 *
 * Public API:
 *   findAllSolutions(grid, dictionary) -> string[]       (assignment entry point)
 *   solve(grid, dictionary)            -> Match[]         (word + path + score)
 *   findWord(grid, word)               -> number[][]|null (path for one word)
 *   summarize(grid, dictionary)        -> Summary         (aggregate statistics)
 *   scoreWord(word)                    -> number          (official Boggle points)
 *   generateBoard(size, random)        -> string[][]      (random playable board)
 *
 * Uses only built-in types; no imported libraries.
 *
 * @typedef {Object} Match
 * @property {string} word - The dictionary word, original spelling.
 * @property {number[][]} path - Tile coordinates [row, col] used to form it.
 * @property {number} length - Word length in letters.
 * @property {number} score - Official Boggle points.
 *
 * @typedef {Object} Summary
 * @property {number} totalWords - Number of distinct words found.
 * @property {number} totalScore - Combined Boggle points.
 * @property {string[]} longestWords - The longest word(s) found.
 * @property {string[]} highestScoringWords - The top-scoring word(s).
 * @property {Object<number, number>} countByLength - How many words of each length.
 */

const MIN_WORD_LENGTH = 3;

// Official Boggle points by word length (in letters). Eight letters or more
// are always worth 11.
const SCORE_BY_LENGTH = { 3: 1, 4: 1, 5: 2, 6: 3, 7: 5 };
const SCORE_8_PLUS = 11;

// The classic 16 Boggle dice (one face per die is "Qu").
const BOGGLE_DICE = [
  ["A", "A", "E", "E", "G", "N"],
  ["A", "B", "B", "J", "O", "O"],
  ["A", "C", "H", "O", "P", "S"],
  ["A", "F", "F", "K", "P", "S"],
  ["A", "O", "O", "T", "T", "W"],
  ["C", "I", "M", "O", "T", "U"],
  ["D", "E", "I", "L", "R", "X"],
  ["D", "E", "L", "R", "V", "Y"],
  ["D", "I", "S", "T", "T", "Y"],
  ["E", "E", "G", "H", "N", "W"],
  ["E", "E", "I", "N", "S", "U"],
  ["E", "H", "R", "T", "V", "W"],
  ["E", "I", "O", "S", "S", "T"],
  ["E", "L", "R", "T", "T", "Y"],
  ["H", "I", "M", "N", "Qu", "U"],
  ["H", "L", "N", "N", "R", "Z"],
];

// Rough English letter frequencies for boards that are not 4x4.
const LETTER_BAG =
  "EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXZ";

/**
 * Points a word is worth under standard Boggle scoring.
 *
 * @param {string} word - The word to score.
 * @returns {number} Boggle points (0 for words shorter than three letters).
 */
function scoreWord(word) {
  if (typeof word !== "string") {
    return 0;
  }
  const length = word.length;
  if (length < MIN_WORD_LENGTH) {
    return 0;
  }
  if (length >= 8) {
    return SCORE_8_PLUS;
  }
  return SCORE_BY_LENGTH[length];
}
exports.scoreWord = scoreWord;

/**
 * Returns every dictionary word that can be formed on the grid.
 *
 * This is the assignment entry point and keeps its original contract: an array
 * of matching words (original spelling), or [] when the input is invalid or
 * nothing is found. Order is not guaranteed.
 *
 * @param {string[][]} grid - Rectangular grid of tile strings.
 * @param {string[]} dictionary - Words to search for.
 * @returns {string[]} Matching words.
 */
exports.findAllSolutions = function (grid, dictionary) {
  return collectMatches(grid, dictionary).map((match) => match.word);
};

/**
 * Like findAllSolutions, but returns rich results: each word with the tile
 * path used to trace it and its Boggle score. Results are sorted by score
 * (descending), then length (descending), then alphabetically.
 *
 * @param {string[][]} grid - Rectangular grid of tile strings.
 * @param {string[]} dictionary - Words to search for.
 * @returns {Match[]} Detailed matches.
 */
exports.solve = function (grid, dictionary) {
  return collectMatches(grid, dictionary)
    .map((match) => ({
      word: match.word,
      path: match.path,
      length: match.word.length,
      score: scoreWord(match.word),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.length - a.length ||
        a.word.localeCompare(b.word),
    );
};

/**
 * Traces a single word on the grid and returns the tile path, or null when
 * the word cannot be formed.
 *
 * @param {string[][]} grid - Rectangular grid of tile strings.
 * @param {string} word - The word to trace.
 * @returns {number[][]|null} Coordinates [row, col] of each tile, or null.
 */
exports.findWord = function (grid, word) {
  if (typeof word !== "string") {
    return null;
  }
  const matches = collectMatches(grid, [word]);
  return matches.length > 0 ? matches[0].path : null;
};

/**
 * Computes aggregate statistics for everything found on the grid.
 *
 * @param {string[][]} grid - Rectangular grid of tile strings.
 * @param {string[]} dictionary - Words to search for.
 * @returns {Summary} Aggregate statistics.
 */
exports.summarize = function (grid, dictionary) {
  const solved = exports.solve(grid, dictionary);

  let totalScore = 0;
  let longest = 0;
  const countByLength = {};
  for (const match of solved) {
    totalScore += match.score;
    countByLength[match.length] = (countByLength[match.length] || 0) + 1;
    if (match.length > longest) {
      longest = match.length;
    }
  }

  const topScore = solved.length > 0 ? solved[0].score : 0;
  return {
    totalWords: solved.length,
    totalScore,
    longestWords: solved
      .filter((match) => match.length === longest)
      .map((match) => match.word),
    highestScoringWords: solved
      .filter((match) => match.score === topScore && match.score > 0)
      .map((match) => match.word),
    countByLength,
  };
};

/**
 * Builds a random, playable board. A 4x4 board uses the classic 16 Boggle
 * dice; other sizes draw from a frequency-weighted letter bag.
 *
 * @param {number} [size=4] - Side length of the square board.
 * @param {function():number} [random=Math.random] - RNG returning [0, 1);
 *   injectable so callers (and tests) can make generation deterministic.
 * @returns {string[][]} A size x size grid of tile strings, or [] if invalid.
 */
exports.generateBoard = function (size, random) {
  const side = size === undefined ? 4 : size;
  const rng = typeof random === "function" ? random : Math.random;
  if (!Number.isInteger(side) || side < 1) {
    return [];
  }
  if (side === 4) {
    return generateFromDice(BOGGLE_DICE, rng);
  }
  return generateFromFrequencies(side, rng);
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Core search: returns one Match (word + first path found) per distinct word.
 *
 * @param {string[][]} grid - Rectangular grid of tile strings.
 * @param {string[]} dictionary - Words to search for.
 * @returns {{word: string, path: number[][]}[]} Discovered words and paths.
 */
function collectMatches(grid, dictionary) {
  if (!isValidGrid(grid) || !Array.isArray(dictionary)) {
    return [];
  }

  const { wordsByNormalized, prefixes } = buildIndex(dictionary);
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  );
  const results = new Map();

  /**
   * Depth-first search, recording the tile path as it extends the word.
   *
   * @param {number} row - Current row.
   * @param {number} col - Current column.
   * @param {string} prefix - Word built so far from earlier tiles.
   * @param {number[][]} path - Coordinates visited so far.
   */
  function search(row, col, prefix, path) {
    const candidate = prefix + grid[row][col].toLowerCase();

    // If no dictionary word starts with this path, extending it cannot reach
    // a word, so stop here.
    if (!prefixes.has(candidate)) {
      return;
    }

    const nextPath = path.concat([[row, col]]);
    if (
      candidate.length >= MIN_WORD_LENGTH &&
      wordsByNormalized.has(candidate) &&
      !results.has(candidate)
    ) {
      results.set(candidate, {
        word: wordsByNormalized.get(candidate),
        path: nextPath,
      });
    }

    visited[row][col] = true;
    for (const [nextRow, nextCol] of neighbors(row, col, rows, cols)) {
      if (!visited[nextRow][nextCol]) {
        search(nextRow, nextCol, candidate, nextPath);
      }
    }
    visited[row][col] = false;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      search(row, col, "", []);
    }
  }

  return Array.from(results.values());
}

/**
 * Indexes a dictionary into a normalized-word map and a prefix set used to
 * prune dead-end search paths.
 *
 * @param {string[]} dictionary - Words to index.
 * @returns {{wordsByNormalized: Map<string, string>, prefixes: Set<string>}}
 */
function buildIndex(dictionary) {
  const wordsByNormalized = new Map();
  const prefixes = new Set();
  for (const word of dictionary) {
    if (typeof word !== "string" || word.length < MIN_WORD_LENGTH) {
      continue;
    }
    const normalized = word.toLowerCase();
    if (!wordsByNormalized.has(normalized)) {
      wordsByNormalized.set(normalized, word);
    }
    for (let end = 1; end <= normalized.length; end += 1) {
      prefixes.add(normalized.slice(0, end));
    }
  }
  return { wordsByNormalized, prefixes };
}

/**
 * Checks that the grid is a non-empty, rectangular array of non-empty tile
 * strings.
 *
 * @param {*} grid - Value to validate.
 * @returns {boolean} True when the grid is usable.
 */
function isValidGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) {
    return false;
  }
  const cols = Array.isArray(grid[0]) ? grid[0].length : -1;
  if (cols <= 0) {
    return false;
  }
  return grid.every(
    (row) =>
      Array.isArray(row) &&
      row.length === cols &&
      row.every((tile) => typeof tile === "string" && tile.length > 0),
  );
}

/**
 * Lists the coordinates of every tile touching (row, col), diagonals
 * included, that stays inside the grid.
 *
 * @param {number} row - Current row.
 * @param {number} col - Current column.
 * @param {number} rows - Total rows.
 * @param {number} cols - Total columns.
 * @returns {number[][]} Neighbor coordinates as [row, col] pairs.
 */
function neighbors(row, col, rows, cols) {
  const result = [];
  for (let dRow = -1; dRow <= 1; dRow += 1) {
    for (let dCol = -1; dCol <= 1; dCol += 1) {
      if (dRow === 0 && dCol === 0) {
        continue;
      }
      const nextRow = row + dRow;
      const nextCol = col + dCol;
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
        result.push([nextRow, nextCol]);
      }
    }
  }
  return result;
}

/**
 * Fills a 4x4 board by shuffling the dice and rolling a random face on each.
 *
 * @param {string[][]} dice - The dice, each an array of six faces.
 * @param {function():number} random - RNG returning [0, 1).
 * @returns {string[][]} A 4x4 grid of tile strings.
 */
function generateFromDice(dice, random) {
  const shuffled = dice.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = swap;
  }

  const board = [];
  let index = 0;
  for (let row = 0; row < 4; row += 1) {
    const cells = [];
    for (let col = 0; col < 4; col += 1) {
      const die = shuffled[index];
      index += 1;
      cells.push(die[Math.floor(random() * die.length)]);
    }
    board.push(cells);
  }
  return board;
}

/**
 * Fills a board of arbitrary size from a frequency-weighted letter bag, with a
 * small chance of a "Qu" tile.
 *
 * @param {number} size - Side length.
 * @param {function():number} random - RNG returning [0, 1).
 * @returns {string[][]} A size x size grid of tile strings.
 */
function generateFromFrequencies(size, random) {
  const board = [];
  for (let row = 0; row < size; row += 1) {
    const cells = [];
    for (let col = 0; col < size; col += 1) {
      if (random() < 0.04) {
        cells.push("Qu");
      } else {
        cells.push(LETTER_BAG[Math.floor(random() * LETTER_BAG.length)]);
      }
    }
    board.push(cells);
  }
  return board;
}
