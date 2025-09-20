import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "../_examples";
import { Category, SubmitResult, Word } from "../_types";
import { delay, shuffleArray } from "../_utils";

type StoredGameStatus = "in-progress" | "loss" | "win";

type StoredGameResult = {
  date: string;
  status: StoredGameStatus;
  clearedCategories: Category[];
  guessHistory: Word[][];
  mistakesRemaining: number;
  gameWords: Word[];
};

const STORAGE_KEY = "storedGameResult";
const ASTANA_TIME_ZONE = "Asia/Almaty";
const ASTANA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ASTANA_TIME_ZONE,
});
const ASTANA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ASTANA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const DEFAULT_MISTAKES_REMAINING = 4;

const getAstanaDate = () => ASTANA_DATE_FORMATTER.format(new Date());

const getMsUntilNextAstanaMidnight = () => {
  const now = new Date();
  const parts = ASTANA_DATE_TIME_FORMATTER.formatToParts(now);

  const getPartValue = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const year = getPartValue("year");
  const month = getPartValue("month");
  const day = getPartValue("day");
  const hour = getPartValue("hour");
  const minute = getPartValue("minute");
  const second = getPartValue("second");

  const astanaNowAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = astanaNowAsUtc - now.getTime();
  const nextMidnightAsUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  const midnightUtc = nextMidnightAsUtc - offset;

  return Math.max(midnightUtc - now.getTime(), 0);
};

const createShuffledGameWords = (): Word[] =>
  shuffleArray(
    categories
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

    const isValidStatus =
      status === "in-progress" || status === "win" || status === "loss";

    if (!isValidStatus || typeof date !== "string") {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      date,
      status,
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

  const initializeNewGame = useCallback(() => {
    setGameWords(createShuffledGameWords());
    setClearedCategories([]);
    setMistakesRemaning(DEFAULT_MISTAKES_REMAINING);
    setIsWon(false);
    setIsLost(false);
    guessHistoryRef.current = [];
  }, [setGameWords, setClearedCategories, setMistakesRemaning, setIsWon, setIsLost, guessHistoryRef]);

  useEffect(() => {
    const today = getAstanaDate();
    currentAstanaDateRef.current = today;

    const storedResult = readStoredGameResult();

    if (!storedResult) {
      initializeNewGame();
      return;
    }

    if (storedResult.date !== today) {
      clearStoredGameResult();
      initializeNewGame();
      return;
    }

    const storedGameWords = storedResult.gameWords;

    if (storedResult.status === "in-progress" && storedGameWords.length === 0) {
      clearStoredGameResult();
      initializeNewGame();
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
  }, [initializeNewGame, setGameWords, setClearedCategories, setMistakesRemaning, setIsWon, setIsLost]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleMidnightReset = () => {
      clearStoredGameResult();
      initializeNewGame();
      currentAstanaDateRef.current = getAstanaDate();
    };

    const scheduleMidnightReset = () => {
      const msUntilMidnight = getMsUntilNextAstanaMidnight();

      if (msUntilMidnight <= 0) {
        handleMidnightReset();
        scheduleMidnightReset();
        return;
      }

      midnightResetTimeoutRef.current = window.setTimeout(() => {
        handleMidnightReset();
        scheduleMidnightReset();
      }, msUntilMidnight);
    };

    scheduleMidnightReset();

    return () => {
      if (midnightResetTimeoutRef.current !== null) {
        window.clearTimeout(midnightResetTimeoutRef.current);
        midnightResetTimeoutRef.current = null;
      }
    };
  }, [initializeNewGame]);

  const persistGameState = (
    status: StoredGameStatus,
    overrides: Partial<Omit<StoredGameResult, "status" | "date">> = {}
  ) => {
    if (typeof window === "undefined") {
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
      // Only allow word to be selected if there are less than 4 selected words
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
      gameWords.map((item) => {
        return { ...item, selected: false };
      })
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

    const likenessCounts = categories.map((category) => {
      return selectedWords.filter((item) => category.items.includes(item.word))
        .length;
    });

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
