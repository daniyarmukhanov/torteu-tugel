"use client";

import { Word } from "@/app/_types";

type CellProps = {
  cellValue: Word;
  onClick: (word: Word) => void;
  animateGuess: boolean;
  animateWrongGuess: boolean;
};

export default function Cell(props: CellProps) {
  const bgColor = props.cellValue.selected ? "bg-slate-500" : "bg-slate-200";
  const textColor = props.cellValue.selected ? "text-stone-100" : "text-black";
  const wordLength = props.cellValue.word.length;

  const fontSizeClass = (() => {
    if (wordLength > 14) {
      return "text-[10px] md:text-base";
    }

    if (wordLength > 10) {
      return "text-xs md:text-lg";
    }

    if (wordLength > 7) {
      return "text-sm md:text-xl";
    }

    return "text-base md:text-2xl";
  })();

  const handleClick = () => {
    props.onClick(props.cellValue);
  };

  const guessAnimation = props.animateGuess ? "transform -translate-y-2" : "";
  const wrongGuessAnimation = props.animateWrongGuess
    ? "animate-horizontal-shake"
    : "";

  return (
    <button
      className={`${bgColor} py-6 rounded-md px-1 transition ease-in-out ${guessAnimation} ${wrongGuessAnimation}`}
      onClick={handleClick}
    >
      <h2 className={`${textColor} ${fontSizeClass} text-center font-bold whitespace-nowrap`}>
        {props.cellValue.word.toUpperCase()}
      </h2>
    </button>
  );
}
