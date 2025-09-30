"use client";

import { useEffect, useRef } from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const heading = headingRef.current;

    if (!button || !heading) {
      return undefined;
    }

    const adjustFontSize = () => {
      const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
      const maxFontSize = isDesktop ? 24 : 16;
      const minFontSize = 4;

      const buttonStyles = window.getComputedStyle(button);
      const buttonPaddingLeft = parseFloat(buttonStyles.paddingLeft) || 0;
      const buttonPaddingRight = parseFloat(buttonStyles.paddingRight) || 0;
      const availableWidth = Math.max(
        0,
        button.clientWidth - (buttonPaddingLeft + buttonPaddingRight)
      );

      heading.style.fontSize = `${maxFontSize}px`;

      const headingWidth = heading.scrollWidth;

      if (headingWidth <= availableWidth || availableWidth === 0) {
        return;
      }

      const ratio = availableWidth / headingWidth;
      const nextSize = Math.max(
        minFontSize,
        Math.min(maxFontSize, Math.floor(maxFontSize * ratio))
      );

      heading.style.fontSize = `${nextSize}px`;
    };

    adjustFontSize();

    const resizeObserver = new ResizeObserver(() => {
      adjustFontSize();
    });

    resizeObserver.observe(button);

    return () => {
      resizeObserver.disconnect();
    };
  }, [props.cellValue.word]);

  const handleClick = () => {
    props.onClick(props.cellValue);
  };

  const guessAnimation = props.animateGuess ? "transform -translate-y-2" : "";
  const wrongGuessAnimation = props.animateWrongGuess
    ? "animate-horizontal-shake"
    : "";

  return (
    <button
      ref={buttonRef}
      className={`${bgColor} flex items-center justify-center rounded-md px-3 py-6 transition ease-in-out ${guessAnimation} ${wrongGuessAnimation}`}
      onClick={handleClick}
    >
      <h2 className={`${textColor} flex w-full justify-center text-center font-bold`}>
        <span
          ref={headingRef}
          className="inline-block min-w-0 max-w-full whitespace-nowrap px-2"
        >
          {props.cellValue.word.toUpperCase()}
        </span>
      </h2>
    </button>
  );
}
