"use strict";

const {
  findAllSolutions,
  solve,
  findWord,
  summarize,
  scoreWord,
  generateBoard,
} = require("./boggle_solver");

/**
 * Compares two word lists while ignoring order, since the solver makes no
 * promise about the sequence in which it returns matches.
 *
 * @param {string[]} actual - Words returned by the solver.
 * @param {string[]} expected - Words the test expects.
 */
function expectSameWords(actual, expected) {
  expect([...actual].sort()).toEqual([...expected].sort());
}

describe("findAllSolutions", () => {
  describe("specification examples", () => {
    test("finds the single word on a 2x2 board", () => {
      const grid = [
        ["A", "B"],
        ["C", "D"],
      ];
      const dictionary = ["A", "B", "AC", "ACA", "ACB", "DE"];
      expectSameWords(findAllSolutions(grid, dictionary), ["ACB"]);
    });

    test("handles a 4x4 board containing a multi-letter tile", () => {
      const grid = [
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["Ie", "J", "K", "L"],
        ["A", "B", "C", "D"],
      ];
      const dictionary = ["ABEF", "AFJIEB", "DGKD", "DGKA"];
      expectSameWords(findAllSolutions(grid, dictionary), [
        "ABEF",
        "AFJIEB",
        "DGKD",
      ]);
    });
  });

  describe("Boggle rules on the sample board", () => {
    const grid = [
      ["T", "W", "Y", "R"],
      ["E", "N", "P", "H"],
      ["G", "St", "Qu", "R"],
      ["O", "N", "T", "A"],
    ];

    test("finds ordinary words traced along adjacent tiles", () => {
      const dictionary = ["art", "ego", "gent", "newt", "prat", "tarp"];
      expectSameWords(findAllSolutions(grid, dictionary), dictionary);
    });

    test("expands multi-letter tiles (St, Qu) inside words", () => {
      const dictionary = ["qua", "quart", "stont", "stqura"];
      expectSameWords(findAllSolutions(grid, dictionary), dictionary);
    });

    test("rejects a word that requires a non-adjacent jump", () => {
      // "not" needs n -> o -> t, but no single tile sits beside both an O
      // and a following T.
      expect(findAllSolutions(grid, ["not"])).toEqual([]);
    });

    test("rejects words shorter than three letters", () => {
      // "we", "go", and "en" are all traceable but too short to count.
      expect(findAllSolutions(grid, ["we", "go", "en"])).toEqual([]);
    });
  });

  describe("tile-reuse rule", () => {
    test("never visits the same tile twice within one word", () => {
      const grid = [
        ["A", "B"],
        ["C", "D"],
      ];
      // "ABA" would require returning to the only A tile.
      expect(findAllSolutions(grid, ["ABA"])).toEqual([]);
    });

    test("allows a repeated letter that lives on two different tiles", () => {
      const grid = [
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["Ie", "J", "K", "L"],
        ["A", "B", "C", "D"],
      ];
      // Two distinct D tiles make DGKD legal.
      expectSameWords(findAllSolutions(grid, ["DGKD"]), ["DGKD"]);
    });
  });

  describe("matching behavior", () => {
    const grid = [
      ["A", "B"],
      ["C", "D"],
    ];

    test("matches regardless of letter case", () => {
      // Grid tiles are uppercase; the dictionary word is lowercase.
      expectSameWords(findAllSolutions(grid, ["acb"]), ["acb"]);
    });

    test("returns an empty list when no word is present", () => {
      expect(findAllSolutions(grid, ["XYZ", "WORD"])).toEqual([]);
    });

    test("reports each found word only once", () => {
      expect(findAllSolutions(grid, ["ACB", "ACB"])).toEqual(["ACB"]);
    });
  });

  describe("invalid input", () => {
    const grid = [
      ["A", "B"],
      ["C", "D"],
    ];

    test("returns [] for an empty grid", () => {
      expect(findAllSolutions([], ["ABC"])).toEqual([]);
    });

    test("returns [] for a non-rectangular grid", () => {
      expect(findAllSolutions([["A", "B"], ["C"]], ["AB"])).toEqual([]);
    });

    test("returns [] for an empty dictionary", () => {
      expect(findAllSolutions(grid, [])).toEqual([]);
    });

    test("returns [] when arguments are missing", () => {
      expect(findAllSolutions()).toEqual([]);
      expect(findAllSolutions(null, null)).toEqual([]);
    });
  });
});

describe("scoreWord", () => {
  test("awards points by word length", () => {
    expect(scoreWord("cat")).toBe(1); // 3 letters
    expect(scoreWord("cats")).toBe(1); // 4 letters
    expect(scoreWord("score")).toBe(2); // 5 letters
    expect(scoreWord("scorer")).toBe(3); // 6 letters
    expect(scoreWord("scoring")).toBe(5); // 7 letters
    expect(scoreWord("scorings")).toBe(11); // 8 letters
    expect(scoreWord("notebooks")).toBe(11); // 9 letters
  });

  test("scores anything shorter than three letters as zero", () => {
    expect(scoreWord("at")).toBe(0);
    expect(scoreWord("")).toBe(0);
  });
});

describe("solve", () => {
  const grid = [
    ["A", "B", "C", "D"],
    ["E", "F", "G", "H"],
    ["Ie", "J", "K", "L"],
    ["A", "B", "C", "D"],
  ];
  const dictionary = ["ABEF", "AFJIEB", "DGKD", "DGKA"];

  test("orders matches by score, then length, then alphabetically", () => {
    const words = solve(grid, dictionary).map((match) => match.word);
    expect(words).toEqual(["AFJIEB", "ABEF", "DGKD"]);
  });

  test("attaches a Boggle score and a tile path to each match", () => {
    const afjieb = solve(grid, dictionary).find(
      (match) => match.word === "AFJIEB",
    );
    expect(afjieb.score).toBe(3); // six letters
    expect(afjieb.path).toHaveLength(5); // five tiles (Ie supplies two letters)
  });

  test("returns an empty array for invalid input", () => {
    expect(solve([], dictionary)).toEqual([]);
  });
});

describe("findWord", () => {
  const grid = [
    ["A", "B"],
    ["C", "D"],
  ];

  test("returns the tile path for a word that is present", () => {
    expect(findWord(grid, "ACB")).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
  });

  test("returns null for a word that cannot be traced", () => {
    expect(findWord(grid, "ABA")).toBeNull();
  });
});

describe("summarize", () => {
  const grid = [
    ["A", "B", "C", "D"],
    ["E", "F", "G", "H"],
    ["Ie", "J", "K", "L"],
    ["A", "B", "C", "D"],
  ];
  const dictionary = ["ABEF", "AFJIEB", "DGKD", "DGKA"];

  test("aggregates words, score, extremes, and length counts", () => {
    const summary = summarize(grid, dictionary);
    expect(summary.totalWords).toBe(3);
    expect(summary.totalScore).toBe(5); // 1 + 3 + 1
    expect(summary.longestWords).toEqual(["AFJIEB"]);
    expect(summary.highestScoringWords).toEqual(["AFJIEB"]);
    expect(summary.countByLength).toEqual({ 4: 2, 6: 1 });
  });

  test("reports zeros for an empty result", () => {
    const summary = summarize(grid, ["ZZZ"]);
    expect(summary.totalWords).toBe(0);
    expect(summary.totalScore).toBe(0);
    expect(summary.longestWords).toEqual([]);
    expect(summary.highestScoringWords).toEqual([]);
  });
});

describe("generateBoard", () => {
  test("produces a 4x4 grid of non-empty tile strings", () => {
    const board = generateBoard(4, () => 0);
    expect(board).toHaveLength(4);
    for (const row of board) {
      expect(row).toHaveLength(4);
      for (const tile of row) {
        expect(typeof tile).toBe("string");
        expect(tile.length).toBeGreaterThan(0);
      }
    }
  });

  test("produces a grid of the requested size for non-standard sizes", () => {
    const board = generateBoard(3, () => 0);
    expect(board).toHaveLength(3);
    expect(board[0]).toHaveLength(3);
  });

  test("returns [] for an invalid size", () => {
    expect(generateBoard(0)).toEqual([]);
    expect(generateBoard(-2)).toEqual([]);
  });

  test("yields a board the solver can trace words on", () => {
    const board = generateBoard(4, () => 0);
    // Three tiles across the top row are mutually adjacent, so their combined
    // letters always form a traceable word.
    const word = board[0][0] + board[0][1] + board[0][2];
    expect(findWord(board, word)).not.toBeNull();
  });
});
