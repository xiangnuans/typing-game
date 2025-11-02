import React, { useEffect, useState, useCallback } from "react";

import Confetti from "react-confetti";
import { Profile } from "@/types/profile";
import axios from "axios";
import { useWindowSize } from "react-use";

interface TypingGameProps {
  profile: Profile;
  onRefresh: () => void;
}

const words = [
  "hello",
  "world",
  "react",
  "typescript",
  "nextjs",
  "javascript",
  "Linux",
  "Azure",
  "GraphQL",
  "Express",
  "Restful",
  "Electron",
  "Service",
  "Docker",
];

const TypingGame: React.FC<TypingGameProps> = ({ profile, onRefresh }) => {
  const [inputText, setInputText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, endGame, score, profile]);

  const startNewGame = useCallback(() => {
    onRefresh();
    setTargetText(generateTargetText());
    setScore(0);
    setTimeLeft(60);
    setIsCorrect(null);
    setGameOver(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          endGame();
        }
        return prev - 1;
      });
    }, 1000);
  }, [onRefresh, generateTargetText, endGame]);

  const endGame = useCallback(async () => {
    setGameOver(true);
    if (score > profile.highscore) {
      const updatedProfile = { ...profile, highscore: score };
      await axios.post("/api/profile", updatedProfile);
    }
  }, [score, profile]);

  const generateTargetText = useCallback(() => {
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    if (value === targetText) {
      setIsCorrect(true);
      setScore((prev) => prev + 1);
      setTargetText(generateTargetText());
      setInputText("");
    } else {
      setIsCorrect(value.length > 0 ? false : null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      {gameOver && score > profile.highscore && (
        <Confetti width={width} height={height} />
      )}
      {gameOver ? (
        <div>
          <div className="text-2xl font-bold mb-4">
            Time&apos;s up! Your score: {score}
          </div>
          {score > profile.highscore ? (
            <div className="text-xl text-green-600">
              Congratulations! New high score!
            </div>
          ) : (
            <div className="text-xl text-red-600">
              Try again to beat your high score!
            </div>
          )}
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
            onClick={startNewGame}
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold mb-4">
            Type the following word:
          </div>
          <div className="text-4xl font-extrabold mb-8 animate-bounce text-indigo-600">
            {targetText}
          </div>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            className={`p-2 border-2 rounded-lg text-lg mb-2 focus:outline-none transition-all duration-300 ${
              isCorrect === null
                ? "border-indigo-600"
                : isCorrect
                ? "border-green-600 bg-green-50"
                : "border-red-600 bg-red-50"
            }`}
          />
          <div className="text-sm mb-4">
            {isCorrect === null
              ? "Start typing..."
              : isCorrect
              ? "Correct!"
              : "Incorrect, try again."}
          </div>
          <div className="text-lg mb-2">
            Time Left:{" "}
            <span className="font-bold text-red-600">{timeLeft}s</span>
          </div>
          <div className="text-lg">
            Score: <span className="font-bold text-green-600">{score}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default TypingGame;
