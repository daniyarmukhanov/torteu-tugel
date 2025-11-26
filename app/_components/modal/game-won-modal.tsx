import { Word } from "@/app/_types";
import ControlButton from "../button/control-button";
import GuessHistory from "../guess-history";
import GameModal from "./game-modal";

type GameWonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  guessHistory: Word[][];
  perfection: string;
};

export default function GameWonModal(props: GameWonModalProps) {
  const handleShare = async () => {
    const levelToEmoji: { [key: number]: string } = {
      1: "🟨", // Yellow
      2: "🟩", // Green
      3: "🟦", // Blue
      4: "🟪", // Purple
    };

    let historyEmojiString = "";
    props.guessHistory.forEach((categoryWords) => {
      if (categoryWords.length > 0) {
        const row = categoryWords
          .map((word) => levelToEmoji[word.level] || "❔")
          .join("");
        historyEmojiString += row + "\n";
      }
    });

    const shareText = ` ${props.perfection}
Wolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?
9 желтоқсанға дейін — 50% жеңілдік 😍


${historyEmojiString}
${window.location.href}`;

    try {
      await navigator.clipboard.writeText(shareText.trim());
      // Optionally, show a success message to the user
    } catch (err) {
      console.error("Failed to copy text: ", err);
      // Optionally, show an error message to the user
    }
    props.onClose();
  };

  const handleGoToSozdilge = () => {
    window.open("https://wordle.kz/", "_blank", "noopener,noreferrer");
  };

  return (
    <GameModal isOpen={props.isOpen} onClose={props.onClose}>
      <div className="flex flex-col items-center justify-center px-12">
        <h1 className="text-black text-4xl font-black my-4 ml-4">
          {props.perfection}
        </h1>
        <hr className="mb-2 md:mb-4 w-full"></hr>
        <h2 className="text-black mb-8 text-center">
          Wolt Сәлемдемелер арқылы сізге кубок жіберсек пе екен?
          <br />
          9 желтоқсанға дейін — 50% жеңілдік 😍
        </h2>
        <GuessHistory guessHistory={props.guessHistory} />
        <div className="mt-6 flex items-center justify-center gap-4">
          <ControlButton text="Бөлісу" onClick={handleShare} />
          <ControlButton
            text="Сөзділге көшу"
            onClick={handleGoToSozdilge}
          />
        </div>
      </div>
    </GameModal>
  );
}
