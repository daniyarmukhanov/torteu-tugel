import { Category } from "./_types";
import { getAstanaDayOfYear } from "./_time";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbFVnlcBrpSGHk8PSuGophCOSUl5N-U9HBI6G352dZPgGlZGK1AdA0xduUeqPSfSW-8Om7C8GV8rcb/pub?gid=1108981138&single=true&output=csv";

type PuzzleRow = {
  dayOfYear: number;
  categories: Category[];
};

export const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim().toLocaleUpperCase("kk-KZ");

const parseCategoryColumn = (
  value: string | undefined,
  level: 1 | 2 | 3 | 4
): Category | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const openParenIndex = trimmed.indexOf("(");
  const closeParenIndex = trimmed.lastIndexOf(")");

  if (openParenIndex === -1 || closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    return null;
  }

  const categoryName = trimmed.slice(0, openParenIndex).trim();
  const itemsSection = trimmed.slice(openParenIndex + 1, closeParenIndex).trim();

  if (!categoryName || !itemsSection) {
    return null;
  }

  const rawItems = itemsSection
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (rawItems.length < 4) {
    return null;
  }

  const normalizedCategory = normalizeText(categoryName);
  const items = rawItems.slice(0, 4).map((item) => normalizeText(item));

  return {
    category: normalizedCategory,
    items,
    level,
  };
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

export const parseCsv = (csvText: string): PuzzleRow[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const puzzles: PuzzleRow[] = [];

  for (const line of lines) {
    const cells = parseCsvLine(line);

    if (cells.length === 0) {
      continue;
    }

    const dayValue = Number(cells[0]?.trim());

    if (!Number.isInteger(dayValue) || dayValue < 1 || dayValue > 366) {
      continue;
    }

    const levelOne = parseCategoryColumn(cells[1], 1);
    const levelTwo = parseCategoryColumn(cells[2], 2);
    const levelThree = parseCategoryColumn(cells[3], 3);
    const levelFour = parseCategoryColumn(cells[4], 4);

    if (!levelOne || !levelTwo || !levelThree || !levelFour) {
      continue;
    }

    puzzles.push({
      dayOfYear: dayValue,
      categories: [levelOne, levelTwo, levelThree, levelFour],
    });
  }

  return puzzles;
};

const buildPuzzleId = (data: Category[]): string =>
  data
    .map((category) =>
      [category.level, category.category, ...category.items].join(":")
    )
    .join("|");

export type DailyPuzzle = {
  categories: Category[];
  puzzleId: string;
  dayOfYear: number;
};

const selectDailyPuzzle = (puzzles: PuzzleRow[]): PuzzleRow => {
  if (puzzles.length === 0) {
    throw new Error("No valid puzzle rows found in CSV");
  }

  const todayDayOfYear = getAstanaDayOfYear();
  const todaysPuzzle = puzzles.find((puzzle) => puzzle.dayOfYear === todayDayOfYear);

  return todaysPuzzle ?? puzzles[Math.floor(Math.random() * puzzles.length)];
};

export const fetchCsvPuzzle = async (): Promise<DailyPuzzle> => {
  const response = await fetch(CSV_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle data: ${response.status}`);
  }

  const csvText = await response.text();
  const puzzles = parseCsv(csvText);
  const selectedPuzzle = selectDailyPuzzle(puzzles);

  return {
    categories: selectedPuzzle.categories,
    puzzleId: buildPuzzleId(selectedPuzzle.categories),
    dayOfYear: selectedPuzzle.dayOfYear,
  };
};
