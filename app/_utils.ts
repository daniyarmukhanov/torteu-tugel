export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements array[i] and array[j]
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
};

export const getWordColor = (category: 1 | 2 | 3 | 4): string => {
  switch (category) {
    case 1:
      return "bg-yellow-300";
    case 2:
      return "bg-lime-500";
    case 3:
      return "bg-blue-300";
    case 4:
      return "bg-purple-400";
    default:
      return "bg-black";
  }
};

export const getPerfection = (mistakesRemaining: number) => {
  switch (mistakesRemaining) {
    case 4:
      return "Мінсіз өттіңіз!\n---------\nWolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?\n9 желтоқсанға дейін — 50% жеңілдік 😍";
    case 3:
      return "Керемет!\n---------\nWolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?\n9 желтоқсанға дейін — 50% жеңілдік 😍";
    case 2:
      return "Жақсы!\n---------\nWolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?\n9 желтоқсанға дейін — 50% жеңілдік 😍";
    default:
      return "Сәл-ақ қалды!\n---------\nWolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?\n9 желтоқсанға дейін — 50% жеңілдік 😍";
  }
};

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
