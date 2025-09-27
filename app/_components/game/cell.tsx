"use client";

import { useEffect, useRef } from "react";

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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const heading = headingRef.current;

    if (!button || !heading) {
      return;
    }

    const adjustFontSize = () => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const maxFontSize = isDesktop ? 24 : 16;
      const minFontSize = 10;

      const headingStyles = window.getComputedStyle(heading);
      const headingPaddingLeft = parseFloat(headingStyles.paddingLeft) || 0;
      const headingPaddingRight = parseFloat(headingStyles.paddingRight) || 0;
      const headingHorizontalPadding = headingPaddingLeft + headingPaddingRight;

      const buttonStyles = window.getComputedStyle(button);
      const buttonPaddingLeft = parseFloat(buttonStyles.paddingLeft) || 0;
      const buttonPaddingRight = parseFloat(buttonStyles.paddingRight) || 0;
      const buttonHorizontalPadding = buttonPaddingLeft + buttonPaddingRight;

      const getContentWidth = () => heading.scrollWidth - headingHorizontalPadding;
      const availableWidth = Math.max(
        0,
        button.clientWidth - buttonHorizontalPadding
      );

      heading.style.fontSize = `${maxFontSize}px`;

      while (
        getContentWidth() > availableWidth &&
        parseFloat(heading.style.fontSize) > minFontSize
      ) {
        const nextSize = Math.max(minFontSize, parseFloat(heading.style.fontSize) - 1);
        heading.style.fontSize = `${nextSize}px`;
      }
    };

    adjustFontSize();

    const handleResize = () => adjustFontSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
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
      <h2
        ref={headingRef}
        className={`${textColor} block min-w-0 max-w-full whitespace-nowrap px-2 text-center font-bold`}
      >
        {props.cellValue.word.toUpperCase()}
      </h2>
    </button>
  );
}
