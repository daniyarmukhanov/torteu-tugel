import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchDailyPuzzle } from "../_examples";
import { Category, SubmitResult, Word } from "../_types";
import { getAstanaDate, getMsUntilNextAstanaMidnight } from "../_time";
import { delay, shuffleArray } from "../_utils";

type StoredGameStatus = "in-progress" | "loss" | "win";

type StoredGameResult = {
  date: string;
  status: StoredGameStatus;
  clearedCategories: Category[];
  guessHistory: Word[][];
  mistakesRemaining: number;
  gameWords: Word[];
  puzzleId: string;
};

const STORAGE_KEY = "storedGameResult";
const DEFAULT_MISTAKES_REMAINING = 4;

const createShuffledGameWords = (categoryList: Category[]): Word[] =>
  shuffleArray(
    categoryList
      .map((category) =>
        category.items.map((word) => ({
          word,
          level: category.level,
          selected: false,
        }))
      )
      .flat()
  );

const readStoredGameResult = (): StoredGameResult | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredGameResult>;

    if (!parsed || typeof parsed !== "object") {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const status = parsed.status;
    const date = parsed.date;
    const storedPuzzleId =
      typeof parsed.puzzleId === "string" ? parsed.puzzleId : null;

    const isValidStatus =
      status === "in-progress" || status === "win" || status === "loss";

    if (!isValidStatus || typeof date !== "string" || !storedPuzzleId) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      date,
      status,
      puzzleId: storedPuzzleId,
      clearedCategories: Array.isArray(parsed.clearedCategories)
        ? (parsed.clearedCategories as Category[])
        : [],
      guessHistory: Array.isArray(parsed.guessHistory)
        ? (parsed.guessHistory as Word[][])
        : [],
      mistakesRemaining:
        typeof parsed.mistakesRemaining === "number"
          ? parsed.mistakesRemaining
          : DEFAULT_MISTAKES_REMAINING,
      gameWords: Array.isArray(parsed.gameWords)
        ? (parsed.gameWords as Word[])
        : [],
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const clearStoredGameResult = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

export default function useGameLogic() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(true);
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const selectedWords = useMemo(
    () => gameWords.filter((item) => item.selected),
    [gameWords]
  );
  const [clearedCategories, setClearedCategories] = useState<Category[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [mistakesRemaining, setMistakesRemaning] = useState(
    DEFAULT_MISTAKES_REMAINING
  );
  const guessHistoryRef = useRef<Word[][]>([]);
  const currentAstanaDateRef = useRef<string>(getAstanaDate());
  const midnightResetTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initializeNewGame = useCallback((categoryList: Category[]) => {
    const newGameWords =
      categoryList.length > 0 ? createShuffledGameWords(categoryList) : [];

    setGameWords(newGameWords);
    setClearedCategories([]);
    setMistakesRemaning(DEFAULT_MISTAKES_REMAINING);
    setIsWon(false);
    setIsLost(false);
    guessHistoryRef.current = [];
  }, []);

  const loadPuzzle = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsPuzzleLoading(true);

    try {
      const puzzle = await fetchDailyPuzzle();

      if (!isMountedRef.current) {
        return;
      }

      setCategories(puzzle.categories);
      setCurrentPuzzleId(puzzle.puzzleId);
    } catch (error) {
      console.error("Failed to load puzzle data", error);
      if (!isMountedRef.current) {
        return;
      }

      setCategories([]);
      setCurrentPuzzleId(null);
    } finally {
      if (isMountedRef.current) {
        setIsPuzzleLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (isPuzzleLoading) {
      return;
    }

    if (categories.length === 0 || !currentPuzzleId) {
      initializeNewGame([]);
      return;
    }

    const today = getAstanaDate();
    currentAstanaDateRef.current = today;

    const storedResult = readStoredGameResult();

    if (!storedResult) {
      initializeNewGame(categories);
      return;
    }

    if (storedResult.puzzleId !== currentPuzzleId) {
      clearStoredGameResult();
      initializeNewGame(categories);
      return;
    }

    if (storedResult.date !== today) {
      clearStoredGameResult();
      initializeNewGame(categories);
      return;
    }

    const storedGameWords = storedResult.gameWords;

    if (storedResult.status === "in-progress" && storedGameWords.length === 0) {
      clearStoredGameResult();
      initializeNewGame(categories);
      return;
    }

    const sanitizedGameWords = storedGameWords.map((word) => ({
      ...word,
      selected: Boolean(word.selected),
    }));

    setGameWords(sanitizedGameWords);
    setClearedCategories(storedResult.clearedCategories);
    setMistakesRemaning(storedResult.mistakesRemaining);
    guessHistoryRef.current = storedResult.guessHistory;

    if (storedResult.status === "win") {
      setIsWon(true);
    } else if (storedResult.status === "loss") {
      setIsLost(true);
    }
  }, [categories, currentPuzzleId, initializeNewGame, isPuzzleLoading]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleMidnightReset = async () => {
      clearStoredGameResult();
      initializeNewGame([]);
      currentAstanaDateRef.current = getAstanaDate();
      await loadPuzzle();
    };

    const scheduleMidnightReset = () => {
      const msUntilMidnight = getMsUntilNextAstanaMidnight();

      if (msUntilMidnight <= 0) {
        void handleMidnightReset().then(() => {
          scheduleMidnightReset();
        });
        return;
      }

      midnightResetTimeoutRef.current = window.setTimeout(() => {
        void handleMidnightReset().then(() => {
          scheduleMidnightReset();
        });
      }, msUntilMidnight);
    };

    scheduleMidnightReset();

    return () => {
      if (midnightResetTimeoutRef.current !== null) {
        window.clearTimeout(midnightResetTimeoutRef.current);
        midnightResetTimeoutRef.current = null;
      }
    };
  }, [initializeNewGame, loadPuzzle]);

  const persistGameState = (
    status: StoredGameStatus,
    overrides: Partial<Omit<StoredGameResult, "status" | "date" | "puzzleId">> = {}
  ) => {
    if (typeof window === "undefined" || !currentPuzzleId) {
      return;
    }

    const today = getAstanaDate();

    if (currentAstanaDateRef.current !== today) {
      currentAstanaDateRef.current = today;
      clearStoredGameResult();
    }

    const payload: StoredGameResult = {
      date: today,
      status,
      puzzleId: currentPuzzleId,
      clearedCategories:
        overrides.clearedCategories ?? clearedCategories,
      gameWords: overrides.gameWords ?? gameWords,
      guessHistory: overrides.guessHistory ?? guessHistoryRef.current,
      mistakesRemaining:
        overrides.mistakesRemaining ?? mistakesRemaining,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore write errors (e.g., storage disabled).
    }
  };

  const selectWord = (word: Word): void => {
    const newGameWords = gameWords.map((item) => {
      if (word.word === item.word) {
        return {
          ...item,
          selected: selectedWords.length < 4 ? !item.selected : false,
        };
      } else {
        return item;
      }
    });

    setGameWords(newGameWords);
  };

  const shuffleWords = () => {
    setGameWords([...shuffleArray(gameWords)]);
  };

  const deselectAllWords = () => {
    setGameWords(
      gameWords.map((item) => ({
        ...item,
        selected: false,
      }))
    );
  };

  const getSubmitResult = (): SubmitResult => {
    const sameGuess = guessHistoryRef.current.some((guess) =>
      guess.every((word) => selectedWords.includes(word))
    );

    if (sameGuess) {
      console.log("Same!");
      return { result: "same" };
    }

    guessHistoryRef.current.push(selectedWords);

    if (categories.length === 0) {
      return { result: "incorrect" };
    }

    const likenessCounts = categories.map((category) =>
      selectedWords.filter((item) => category.items.includes(item.word)).length
    );

    const maxLikeness = Math.max(...likenessCounts);
    const maxIndex = likenessCounts.indexOf(maxLikeness);

    if (maxLikeness === 4) {
      return getCorrectResult(categories[maxIndex]);
    } else {
      return getIncorrectResult(maxLikeness);
    }
  };

  const getCorrectResult = (category: Category): SubmitResult => {
    const updatedClearedCategories = [...clearedCategories, category];
    const updatedGameWords = gameWords.filter(
      (item) => !category.items.includes(item.word)
    );

    setClearedCategories(updatedClearedCategories);
    setGameWords(updatedGameWords);

    const hasWon = updatedClearedCategories.length === categories.length;

    persistGameState(hasWon ? "win" : "in-progress", {
      clearedCategories: updatedClearedCategories,
      gameWords: updatedGameWords,
    });

    if (hasWon) {
      return { result: "win" };
    } else {
      return { result: "correct" };
    }
  };

  const getIncorrectResult = (maxLikeness: number): SubmitResult => {
    const updatedMistakesRemaining = mistakesRemaining - 1;
    setMistakesRemaning(updatedMistakesRemaining);

    const didLose = updatedMistakesRemaining === 0;

    persistGameState(didLose ? "loss" : "in-progress", {
      mistakesRemaining: updatedMistakesRemaining,
      gameWords,
    });

    if (didLose) {
      return { result: "loss" };
    } else if (maxLikeness === 3) {
      return { result: "one-away" };
    } else {
      return { result: "incorrect" };
    }
  };

  const handleLoss = async () => {
    const remainingCategories = categories.filter(
      (category) => !clearedCategories.includes(category)
    );

    deselectAllWords();

    for (const category of remainingCategories) {
      await delay(1000);
      setClearedCategories((prevClearedCategories) => [
        ...prevClearedCategories,
        category,
      ]);
      setGameWords((prevGameWords) =>
        prevGameWords.filter((item) => !category.items.includes(item.word))
      );
    }

    await delay(1000);
    setIsLost(true);
  };

  const handleWin = async () => {
    await delay(1000);
    setIsWon(true);
  };

  return {
    gameWords,
    selectedWords,
    clearedCategories,
    mistakesRemaining,
    isWon,
    isLost,
    guessHistoryRef,
    selectWord,
    shuffleWords,
    deselectAllWords,
    getSubmitResult,
    handleLoss,
    handleWin,
  };
}
