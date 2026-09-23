"""
Boggle solver.

Name: <YOUR NAME HERE>
SID:  <YOUR SID HERE>

Given an NxN grid of letter tiles and a dictionary of words, find every
dictionary word that can be traced through adjacent tiles (including the four
diagonals) without reusing a tile within a single word.

Tiles may carry more than one letter ("Qu", "St", "Ie"); a multi-letter tile
contributes all of its letters to the word being built. Matching is
case-insensitive and words must be at least three letters long.

Uses only built-in types (list, dict, set, str) and no imported libraries.
"""

MIN_WORD_LENGTH = 3


class Boggle:
    """Finds every dictionary word contained in a Boggle grid."""

    def __init__(self, grid, dictionary):
        """Store the grid and dictionary and start with an empty solution."""
        self.grid = grid
        self.dictionary = dictionary
        self.solution = []

    def setGrid(self, grid):
        """Replace the current grid (a 2D list of tile strings)."""
        self.grid = grid

    def setDictionary(self, dictionary):
        """Replace the current dictionary (a list of words)."""
        self.dictionary = dictionary

    def getSolution(self):
        """Return the list of words found in the grid, or [] if none/invalid."""
        self.solution = []
        if not self._is_valid_grid() or not isinstance(self.dictionary, list):
            return self.solution

        # Map each normalized word to its original spelling, and gather every
        # prefix so the search can stop early on dead-end paths.
        words_by_normalized = {}
        prefixes = set()
        for word in self.dictionary:
            if not isinstance(word, str) or len(word) < MIN_WORD_LENGTH:
                continue
            normalized = word.lower()
            words_by_normalized.setdefault(normalized, word)
            for end in range(1, len(normalized) + 1):
                prefixes.add(normalized[:end])

        rows = len(self.grid)
        cols = len(self.grid[0])
        visited = [[False] * cols for _ in range(rows)]
        found = set()

        def search(row, col, prefix):
            """Depth-first search, extending the word along neighbor tiles."""
            candidate = prefix + self.grid[row][col].lower()

            # If no word starts with this path, it can never become a word.
            if candidate not in prefixes:
                return

            if len(candidate) >= MIN_WORD_LENGTH and candidate in words_by_normalized:
                found.add(words_by_normalized[candidate])

            visited[row][col] = True
            for next_row, next_col in self._neighbors(row, col, rows, cols):
                if not visited[next_row][next_col]:
                    search(next_row, next_col, candidate)
            visited[row][col] = False

        for row in range(rows):
            for col in range(cols):
                search(row, col, "")

        self.solution = sorted(found)
        return self.solution

    def _is_valid_grid(self):
        """Return True when the grid is a non-empty rectangle of strings."""
        grid = self.grid
        if not isinstance(grid, list) or len(grid) == 0:
            return False
        if not isinstance(grid[0], list) or len(grid[0]) == 0:
            return False
        cols = len(grid[0])
        for row in grid:
            if not isinstance(row, list) or len(row) != cols:
                return False
            for tile in row:
                if not isinstance(tile, str) or len(tile) == 0:
                    return False
        return True

    @staticmethod
    def _neighbors(row, col, rows, cols):
        """Yield in-bounds neighbor coordinates, diagonals included."""
        for d_row in (-1, 0, 1):
            for d_col in (-1, 0, 1):
                if d_row == 0 and d_col == 0:
                    continue
                next_row = row + d_row
                next_col = col + d_col
                if 0 <= next_row < rows and 0 <= next_col < cols:
                    yield (next_row, next_col)


def main():
    """Build a Boggle game from the sample input and print the solution."""
    grid = [
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["Ie", "J", "K", "L"],
        ["A", "B", "C", "D"],
    ]
    dictionary = ["ABEF", "AFJIEB", "DGKD", "DGKA"]
    mygame = Boggle(grid, dictionary)
    print(mygame.getSolution())


if __name__ == "__main__":
    main()
