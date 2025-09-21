import { Category } from "./_types";

export const categories: Category[] = [
  {
    category: "Батыс қыпшақ тілдері",
    items: ["ҚАРАЙЫМ", "ҚҰМЫҚ", "ҰРЫМ", "ҚЫРЫМШАҚ"],
    level: 1,
  },
  {
    category: "Гарнир",
    items: ["ҚАРАҚҰМЫҚ", "КҮРІШ", "КАРТОП", "КИНОА"],
    level: 2,
  },
  {
    category: "Күйлер",
    items: ["НАУАИ", "МЕРЕКЕ", "АҚҚУ", "САРЫАРҚА"],
    level: 3,
  },
  {
    category: "Найман рулары",
    items: ["ҚАРАКЕРЕЙ", "САДЫР", "БУРА", "ҚАРАТАЙ"],
    level: 4,
  }
];

const buildPuzzleId = (data: Category[]): string =>
  data
    .map((category) =>
      [
        category.level,
        category.category,
        ...category.items,
      ].join(":")
    )
    .join("|");

export const puzzleId = buildPuzzleId(categories);
