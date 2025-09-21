import { DailyPuzzle, normalizeText } from "./_puzzle-data";

export const fetchDailyPuzzle = async (): Promise<DailyPuzzle> => {
  const response = await fetch("/api/puzzle", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle: ${response.status}`);
  }

  const puzzle = (await response.json()) as DailyPuzzle;

  return {
    ...puzzle,
    categories: puzzle.categories.map((category) => ({
      ...category,
      category: normalizeText(category.category),
      items: category.items.map((item) => normalizeText(item)),
    })),
  };
};
