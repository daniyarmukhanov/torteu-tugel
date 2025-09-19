import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories } from "../_examples";
import { Category, SubmitResult, Word } from "../_types";
import { delay, shuffleArray } from "../_utils";

type StoredGameResult = {
  dateKey: string;
  status: "win" | "loss";
  clearedCategories: Category[];
  guessHistory: Word[][];
  mistakesRemaining: number;
};

const STORAGE_KEY = "torteu-tugel-game-result";
const ASTANA_UTC_OFFSET_HOURS = 5;

const getAstanaDateKey = (date = new Date()): string => {
  const astanaDate = new Date(
    date.getTime() + ASTANA_UTC_OFFSET_HOURS * 60 * 60 * 1000
  );

  return astanaDate.toISOString().split("T")[0];
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
  const [mistakesRemaining, setMistakesRemaning] = useState(4);
  const guessHistoryRef = useRef<Word[][]>([]);

  useEffect(() => {
    const words: Word[] = categories
      .map((category) =>
        category.items.map((word) => ({ word: word, level: category.level }))
      )
      .flat();

    const shuffledWords = shuffleArray(words);

    if (typeof window === "undefined") {
      setGameWords(shuffledWords);
      return;
    }

    const storedResultRaw = window.localStorage.getItem(STORAGE_KEY);

    if (!storedResultRaw) {
      setGameWords(shuffledWords);
      return;
    }

    try {
      const storedResult: StoredGameResult = JSON.parse(storedResultRaw);
      const todayKey = getAstanaDateKey();

      if (storedResult.dateKey !== todayKey) {
        window.localStorage.removeItem(STORAGE_KEY);
        setGameWords(shuffledWords);
        return;
      }

      if (storedResult.status === "win" || storedResult.status === "loss") {
        setClearedCategories(storedResult.clearedCategories ?? []);
        setMistakesRemaning(
          typeof storedResult.mistakesRemaining === "number"
            ? storedResult.mistakesRemaining
            : 0
        );

        const sanitizedGuessHistory = Array.isArray(storedResult.guessHistory)
          ? storedResult.guessHistory.map((guess) =>
              Array.isArray(guess)
                ? guess.map((word) => ({
                    word: word.word,
                    level: word.level,
                  }))
                : []
            )
          : [];

        guessHistoryRef.current = sanitizedGuessHistory;
        setGameWords([]);

        if (storedResult.status === "win") {
          setIsWon(true);
        } else {
          setIsLost(true);
        }
        return;
      }

      setGameWords(shuffledWords);
    } catch (error) {
      console.error("Failed to parse stored game result", error);
      window.localStorage.removeItem(STORAGE_KEY);
      setGameWords(shuffledWords);
    }
  }, []);

  const saveResult = useCallback(
    (status: "win" | "loss") => {
      if (typeof window === "undefined") {
        return;
      }

      const sanitizedGuessHistory = guessHistoryRef.current.map((guess) =>
        guess.map((word) => ({ word: word.word, level: word.level }))
      );

      const payload: StoredGameResult = {
        dateKey: getAstanaDateKey(),
        status,
        clearedCategories,
        guessHistory: sanitizedGuessHistory,
        mistakesRemaining,
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.error("Failed to store game result", error);
      }
    },
    [clearedCategories, guessHistoryRef, mistakesRemaining]
  );

  useEffect(() => {
    if (isWon) {
      saveResult("win");
    } else if (isLost) {
      saveResult("loss");
    }
  }, [isWon, isLost, saveResult]);

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
    setClearedCategories([...clearedCategories, category]);
    setGameWords(
      gameWords.filter((item) => !category.items.includes(item.word))
    );

    if (clearedCategories.length === 3) {
      return { result: "win" };
    } else {
      return { result: "correct" };
    }
  };

  const getIncorrectResult = (maxLikeness: number): SubmitResult => {
    setMistakesRemaning(mistakesRemaining - 1);

    if (mistakesRemaining === 1) {
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
