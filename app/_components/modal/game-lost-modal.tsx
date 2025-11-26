import { Word } from "@/app/_types";
import ControlButton from "../button/control-button";
import GuessHistory from "../guess-history";
import GameModal from "./game-modal";

type GameLostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  guessHistory: Word[][];
};

export default function GameLostModal(props: GameLostModalProps) {
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

    const shareText = ` Қап!
—————————
Wolt Сәлемдемелер арқылы досыңыздан сөздік ала тұрсаңыз қайтеді?
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
        <h1 className="text-black text-3xl font-black my-4 ml-4">
          {"Ертең жаңа сұрақ болады!"}
        </h1>
        <hr className="mb-2 md:mb-4 w-full"></hr>
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
