import { DailyPuzzle, fetchCsvPuzzle, normalizeText } from "./_puzzle-data";

type FetchDailyPuzzleOptions = {
  forceRefresh?: boolean;
};

const normalizePuzzle = (puzzle: DailyPuzzle): DailyPuzzle => ({
  ...puzzle,
  categories: puzzle.categories.map((category) => ({
    ...category,
    category: normalizeText(category.category),
    items: category.items.map((item) => normalizeText(item)),
  })),
});

let cachedPuzzle: DailyPuzzle | null = null;
let pendingPuzzlePromise: Promise<DailyPuzzle> | null = null;

const requestPuzzleFromCsv = async (): Promise<DailyPuzzle> => {
  const puzzle = await fetchCsvPuzzle();

  return normalizePuzzle(puzzle);
};

export const fetchDailyPuzzle = async (
  options: FetchDailyPuzzleOptions = {}
): Promise<DailyPuzzle> => {
  const { forceRefresh = false } = options;

  if (pendingPuzzlePromise) {
    return pendingPuzzlePromise;
  }

  if (!forceRefresh && cachedPuzzle) {
    return cachedPuzzle;
  }

  const previousPuzzle = cachedPuzzle;

  if (forceRefresh) {
    cachedPuzzle = null;
  }

  const fetchPromise = requestPuzzleFromCsv()
    .then((puzzle) => {
      cachedPuzzle = puzzle;
      return puzzle;
    })
    .catch((error) => {
      if (forceRefresh) {
        cachedPuzzle = previousPuzzle;
      }
      throw error;
    })
    .finally(() => {
      pendingPuzzlePromise = null;
    });

  pendingPuzzlePromise = fetchPromise;

  return fetchPromise;
};
