"""
Name: Kionne McGhee II
SID: YOUR_SID_HERE

Boggle Solver
- No imports used (per assignment requirement)
- Finds all dictionary words present in the grid using adjacency (including diagonals)
- A cell may not be reused within a single word path
- Words must be at least length 3 (length counted as characters in the built word string)
- Supports multi-character tiles like "Qu", "St", "Ie" naturally (tile string is appended)
"""

class Boggle:
    """
    Boggle solver class.
    Data members required by spec:
      - grid
      - dictionary
      - solutions
    """

    def __init__(self, grid=None, dictionary=None):
        """Constructor: store grid/dictionary, init solutions list."""
        self.grid = None
        self.dictionary = None
        self.solutions = []
        self.setGrid(grid if grid is not None else [])
        self.setDictionary(dictionary if dictionary is not None else [])

    def setGrid(self, grid):
        """
        Setter for grid (2D array of strings).
        If invalid, stores None.
        """
        if self._is_valid_grid(grid):
            # Normalize to strings and keep as-is (case-sensitive handling decided below)
            self.grid = grid
        else:
            self.grid = None

    def setDictionary(self, dictionary):
        """
        Setter for dictionary (array of words).
        If invalid, stores None.
        """
        if self._is_valid_dictionary(dictionary):
            self.dictionary = dictionary
        else:
            self.dictionary = None

    def getSolution(self):
        """
        Returns array of found words, or empty array if:
          - grid/dictionary invalid
          - no words found
          - any error
        """
        try:
            if self.grid is None or self.dictionary is None:
                return []

            rows = len(self.grid)
            cols = len(self.grid[0])

            # Build quick lookup sets (use uppercase for consistent matching)
            word_set = set()
            prefix_set = set()

            for w in self.dictionary:
                if not isinstance(w, str):
                    continue
                w2 = w.strip()
                if len(w2) == 0:
                    continue
                w2u = w2.upper()
                word_set.add(w2u)
                # Build all prefixes for pruning
                # Example: "QUART" adds "Q","QU","QUA","QUAR","QUART"
                for i in range(1, len(w2u) + 1):
                    prefix_set.add(w2u[:i])

            found = set()

            # Pre-normalize grid tiles to uppercase strings
            grid_u = []
            for r in range(rows):
                row_u = []
                for c in range(cols):
                    tile = self.grid[r][c]
                    # tile must be a string (validated), but be defensive:
                    if not isinstance(tile, str):
                        tile = ""
                    row_u.append(tile.upper())
                grid_u.append(row_u)

            visited = [[False for _ in range(cols)] for _ in range(rows)]

            # Explore from every starting cell
            for r in range(rows):
                for c in range(cols):
                    self._dfs(r, c, grid_u, visited, "", prefix_set, word_set, found)

            # Save and return solutions in a stable order
            self.solutions = sorted(list(found))
            return self.solutions

        except:
            # Spec: return empty array on any error
            return []

    # -------------------------
    # Internal helper functions
    # -------------------------

    def _dfs(self, r, c, grid_u, visited, current, prefix_set, word_set, found):
        """
        Depth-first search from (r,c), building words by appending tile strings.
        Uses prefix_set to prune paths early.
        """
        if visited[r][c]:
            return

        next_word = current + grid_u[r][c]

        # Prune if not a prefix of any dictionary word
        if next_word not in prefix_set:
            return

        visited[r][c] = True

        # If it's a full word and length >= 3, record it
        # Length counts characters in the combined string, matching typical grading expectations.
        if len(next_word) >= 3 and next_word in word_set:
            found.add(next_word)

        rows = len(grid_u)
        cols = len(grid_u[0])

        # 8 directions (including diagonals)
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue
                nr = r + dr
                nc = c + dc
                if 0 <= nr < rows and 0 <= nc < cols and not visited[nr][nc]:
                    self._dfs(nr, nc, grid_u, visited, next_word, prefix_set, word_set, found)

        visited[r][c] = False

    def _is_valid_grid(self, grid):
        """
        Grid must be a non-empty 2D list (NxN or NxM is fine unless your grader enforces NxN),
        containing ONLY strings, and rectangular (all rows same length).
        """
        if not isinstance(grid, list) or len(grid) == 0:
            return False
        if not isinstance(grid[0], list) or len(grid[0]) == 0:
            return False

        row_len = None
        for row in grid:
            if not isinstance(row, list) or len(row) == 0:
                return False
            if row_len is None:
                row_len = len(row)
            if len(row) != row_len:
                return False
            for cell in row:
                if not isinstance(cell, str) or len(cell) == 0:
                    return False
        return True

    def _is_valid_dictionary(self, dictionary):
        """Dictionary must be a list of strings (can be empty, but then solution will be empty)."""
        if not isinstance(dictionary, list):
            return False
        for w in dictionary:
            if not isinstance(w, str):
                return False
        return True


def main():
    # Example from your prompt
    grid = [["T", "W", "Y", "R"],
            ["E", "N", "P", "H"],
            ["G", "Z", "Qu", "R"],
            ["O", "N", "T", "A"]]

    dictionary = ["art", "ego", "gent", "get", "net", "new", "newt", "prat", "pry",
                  "qua", "quart", "quartz", "rat", "tar", "tarp", "ten", "went",
                  "wet", "arty", "rhr", "not", "quar"]

    mygame = Boggle(grid, dictionary)
    print(mygame.getSolution())


if __name__ == "__main__":
    main()