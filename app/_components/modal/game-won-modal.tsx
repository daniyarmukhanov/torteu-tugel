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
        const level = categoryWords[0].level;
        const emoji = levelToEmoji[level] || "❔";
        historyEmojiString += emoji.repeat(4) + "\n";
      }
    });

    const shareText = ` ${props.perfection}
Бүгінгі ойын жеңіспен аяқталды


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

  return (
    <GameModal isOpen={props.isOpen} onClose={props.onClose}>
      <div className="flex flex-col items-center justify-center px-12">
        <h1 className="text-black text-4xl font-black my-4 ml-4">
          {props.perfection}
        </h1>
        <hr className="mb-2 md:mb-4 w-full"></hr>
        <h2 className="text-black mb-8">{"Бүгінгі ойын жеңіспен аяқталды"}</h2>
        <GuessHistory guessHistory={props.guessHistory} />
        <ControlButton text="Бөлісу" onClick={handleShare} />
      </div>
    </GameModal>
  );
}
