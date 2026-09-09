import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, RotateCcw, Heart, CheckCircle2, AlertCircle, Gamepad2 } from 'lucide-react';
import { MiniGameContent } from '../../types';
import { SoundEffects } from '../../utils/audioEngine';
import { TeddyMascot } from '../../components/TeddyMascot';
import { getMediaUrl } from '../../utils/mediaUrl';

interface MiniGamesProps {
  content: MiniGameContent;
  onComplete?: () => void;
  accentColor?: string;
}

export const MiniGames: React.FC<MiniGamesProps> = ({ content, onComplete, accentColor = '#b45309' }) => {
  const gameType = content.gameType || 'BALLOON_POP';

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#fffdfa] to-white border border-amber-200/80 shadow-sm relative overflow-hidden">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-[11px] font-bold tracking-wide uppercase mb-2">
          <Gamepad2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Birthday Game Challenge</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold font-playfair text-stone-800 tracking-tight">
          {content.title || 'Birthday Challenge'}
        </h3>
        {content.instructions && (
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-md mx-auto leading-relaxed">
            {content.instructions}
          </p>
        )}
      </div>

      {gameType === 'BALLOON_POP' && <BalloonPopGame content={content} onComplete={onComplete} accentColor={accentColor} />}
      {gameType === 'MEMORY_MATCH' && <MemoryMatchGame content={content} onComplete={onComplete} accentColor={accentColor} />}
      {gameType === 'BIRTHDAY_QUIZ' && <BirthdayQuizGame content={content} onComplete={onComplete} accentColor={accentColor} />}
      {gameType === 'CATCH_HEARTS' && <CatchHeartsGame content={content} onComplete={onComplete} accentColor={accentColor} />}
      {gameType === 'PUZZLE' && <PuzzleGame content={content} onComplete={onComplete} accentColor={accentColor} />}
    </div>
  );
};

// 1. BALLOON POPPING GAME
const BalloonPopGame: React.FC<{ content: MiniGameContent; onComplete?: () => void; accentColor: string }> = ({
  content,
  onComplete,
}) => {
  const target = content.targetScore || 8;
  const [poppedCount, setPoppedCount] = useState(0);
  const [balloons, setBalloons] = useState<Array<{ id: number; x: number; color: string; speed: number }>>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const colors = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#a855f7', '#f97316'];

  useEffect(() => {
    // Generate initial wave
    const initialBalloons = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 4 + Math.random() * 3,
    }));
    setBalloons(initialBalloons);

    const interval = setInterval(() => {
      if (isCompleted) return;
      setBalloons((prev) => {
        if (prev.length >= 10) return prev;
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: 10 + Math.random() * 80,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: 4 + Math.random() * 3,
          },
        ];
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [isCompleted]);

  const popBalloon = (id: number) => {
    SoundEffects.playPop();
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    const next = poppedCount + 1;
    setPoppedCount(next);

    if (next >= target && !isCompleted) {
      setIsCompleted(true);
      SoundEffects.playCelebrationFanfare();
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-3 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 text-sm font-medium">
        <span>Balloons Popped: <strong>{poppedCount} / {target}</strong></span>
        {isCompleted && <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completed!</span>}
      </div>

      <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-amber-50 to-orange-50 border border-stone-200">
        <AnimatePresence>
          {balloons.map((b) => (
            <motion.div
              key={b.id}
              initial={{ y: 290, x: `${b.x}%`, opacity: 0 }}
              animate={{ y: -60, x: `${b.x}%`, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: b.speed, ease: 'linear' }}
              onAnimationComplete={() => setBalloons((prev) => prev.filter((item) => item.id !== b.id))}
              onClick={() => popBalloon(b.id)}
              className="absolute cursor-pointer flex flex-col items-center select-none transform -translate-x-1/2"
            >
              {/* Balloon */}
              <div
                className="w-12 h-15 rounded-full shadow-md flex items-center justify-center relative hover:scale-110 active:scale-95 transition-transform"
                style={{ backgroundColor: b.color }}
              >
                <div className="w-2.5 h-4 bg-white/40 rounded-full absolute top-2 left-2.5 rotate-[-20deg]" />
              </div>
              {/* String */}
              <div className="w-0.5 h-6 bg-stone-400 -mt-0.5" />
            </motion.div>
          ))}
        </AnimatePresence>

        {isCompleted && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20"
          >
            <TeddyMascot pose="celebrating" size="md" message="You popped all the balloons!" />
            <h4 className="text-xl font-bold font-playfair text-amber-900 mt-2">Challenge Accomplished!</h4>
            <p className="text-stone-600 text-sm mt-1 max-w-sm">{content.rewardMessage}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 2. MEMORY MATCH GAME
const MemoryMatchGame: React.FC<{ content: MiniGameContent; onComplete?: () => void; accentColor: string }> = ({
  content,
  onComplete,
}) => {
  const ICONS = ['🧸', '🎂', '🎁', '⭐', '🎈', '💌'];
  const [cards, setCards] = useState<Array<{ id: number; icon: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const initializeGame = () => {
    const deck = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, idx) => ({ id: idx, icon, isFlipped: false, isMatched: false }));
    setCards(deck);
    setFlippedIds([]);
    setIsCompleted(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    SoundEffects.playPop();
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const first = cards.find((c) => c.id === firstId);
      const second = cards.find((c) => c.id === secondId);

      if (first && second && first.icon === second.icon) {
        // Matched
        setTimeout(() => {
          SoundEffects.playSparkle();
          setCards((prev) => {
            const updated = prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c));
            if (updated.every((c) => c.isMatched)) {
              setIsCompleted(true);
              SoundEffects.playCelebrationFanfare();
              confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
              if (onComplete) onComplete();
            }
            return updated;
          });
          setFlippedIds([]);
        }, 500);
      } else {
        // Not matched
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c)));
          setFlippedIds([]);
        }, 900);
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-stone-700">Find the matching memory symbols:</span>
        <button
          onClick={initializeGame}
          className="text-xs flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`h-20 sm:h-24 rounded-2xl flex items-center justify-center text-3xl font-bold cursor-pointer transition-all duration-300 transform shadow-sm ${
              card.isMatched
                ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-800 scale-95 opacity-80'
                : card.isFlipped
                ? 'bg-white border-2 border-amber-400 shadow-md rotate-y-180'
                : 'bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/80 hover:bg-amber-200'
            }`}
          >
            {card.isFlipped || card.isMatched ? card.icon : '✨'}
          </div>
        ))}
      </div>

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center"
        >
          <p className="font-bold text-amber-900 font-playfair text-lg">Perfect Match! 🎉</p>
          <p className="text-sm text-stone-700 mt-1">{content.rewardMessage}</p>
        </motion.div>
      )}
    </div>
  );
};

// 3. BIRTHDAY TRIVIA QUIZ GAME
const BirthdayQuizGame: React.FC<{ content: MiniGameContent; onComplete?: () => void; accentColor: string }> = ({
  content,
  onComplete,
}) => {
  const questions = content.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  if (questions.length === 0) {
    return <div className="text-center py-6 text-stone-500">No quiz questions configured.</div>;
  }

  const currentQ = questions[currentIndex];

  const handleSelect = (index: number) => {
    if (showAnswer) return;
    setSelectedOption(index);
    setShowAnswer(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      SoundEffects.playSparkle();
    } else {
      SoundEffects.playPop();
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      setQuizDone(true);
      SoundEffects.playCelebrationFanfare();
      confetti({ particleCount: 70, spread: 70 });
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="space-y-4">
      {!quizDone ? (
        <div className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200">
          <div className="flex justify-between items-center text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>

          <h4 className="text-lg font-bold text-stone-800 mb-4">{currentQ.question}</h4>

          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              let btnStyle = 'bg-white border-stone-200 hover:border-amber-400 text-stone-800';
              if (showAnswer) {
                if (idx === currentQ.correctIndex) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 line-through';
                } else {
                  btnStyle = 'bg-stone-50 border-stone-200 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {showAnswer && idx === currentQ.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          {showAnswer && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 pt-4 border-t border-stone-200">
              <p className="text-xs text-stone-600 italic mb-3">💡 {currentQ.explanation}</p>
              <button
                onClick={nextQuestion}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition cursor-pointer"
              >
                {currentIndex + 1 < questions.length ? 'Next Question →' : 'See Results ✨'}
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <TeddyMascot pose="cheering" size="lg" message="You crushed the quiz!" />
          <h4 className="text-2xl font-bold font-playfair text-amber-900 mt-2">Quiz Complete!</h4>
          <p className="text-stone-700 font-medium mt-1">
            You scored {score} out of {questions.length} points!
          </p>
          <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto">{content.rewardMessage}</p>
        </div>
      )}
    </div>
  );
};

// 4. CATCH HEARTS GAME
const CatchHeartsGame: React.FC<{ content: MiniGameContent; onComplete?: () => void; accentColor: string }> = ({
  content,
  onComplete,
}) => {
  const [score, setScore] = useState(0);
  const target = content.targetScore || 10;
  const [items, setItems] = useState<Array<{ id: number; x: number; isGold?: boolean }>>([]);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isDone) return;
    const interval = setInterval(() => {
      setItems((prev) => [
        ...prev.slice(-8),
        {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80,
          isGold: Math.random() > 0.7,
        },
      ]);
    }, 800);
    return () => clearInterval(interval);
  }, [isDone]);

  const catchItem = (id: number, isGold?: boolean) => {
    SoundEffects.playSparkle();
    setItems((prev) => prev.filter((i) => i.id !== id));
    const add = isGold ? 2 : 1;
    const next = score + add;
    setScore(next);

    if (next >= target && !isDone) {
      setIsDone(true);
      SoundEffects.playCelebrationFanfare();
      confetti({ particleCount: 75, spread: 70 });
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-3 px-3 py-2 rounded-xl bg-rose-50 text-rose-900 text-sm font-medium">
        <span>Hearts Collected: <strong>{score} / {target}</strong></span>
        <span>Tap floating stars and hearts!</span>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-rose-100 via-amber-50 to-pink-50 border border-stone-200">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ y: -30, x: `${item.x}%`, opacity: 0 }}
              animate={{ y: 270, x: `${item.x}%`, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 3.5, ease: 'linear' }}
              onClick={() => catchItem(item.id, item.isGold)}
              className="absolute cursor-pointer select-none text-2xl filter drop-shadow-md hover:scale-125 transition-transform"
            >
              {item.isGold ? '⭐' : '💖'}
            </motion.div>
          ))}
        </AnimatePresence>

        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-6 text-center"
          >
            <TeddyMascot pose="holding_gift" size="md" message="Heart bucket full!" />
            <h4 className="text-xl font-bold font-playfair text-rose-900 mt-2">All Hearts Caught!</h4>
            <p className="text-xs text-stone-600 mt-1">{content.rewardMessage}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 5. PUZZLE TILE GAME
const PuzzleGame: React.FC<{ content: MiniGameContent; onComplete?: () => void; accentColor: string }> = ({
  content,
  onComplete,
}) => {
  const defaultImage = getMediaUrl(content.puzzleImageUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80');
  const [tiles, setTiles] = useState<number[]>([1, 2, 0, 4, 3, 5, 7, 6, 8]); // 3x3 grid
  const [solved, setSolved] = useState(false);

  const checkSolved = (currentTiles: number[]) => {
    return currentTiles.every((val, idx) => val === idx);
  };

  const swapTiles = (index: number) => {
    if (solved) return;
    SoundEffects.playPop();
    const zeroIndex = tiles.indexOf(0);
    // Check if adjacent in 3x3 grid
    const rowDiff = Math.abs(Math.floor(index / 3) - Math.floor(zeroIndex / 3));
    const colDiff = Math.abs((index % 3) - (zeroIndex % 3));

    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      const newTiles = [...tiles];
      newTiles[zeroIndex] = tiles[index];
      newTiles[index] = 0;
      setTiles(newTiles);

      if (checkSolved(newTiles)) {
        setSolved(true);
        SoundEffects.playCelebrationFanfare();
        confetti({ particleCount: 75, spread: 70 });
        if (onComplete) onComplete();
      }
    }
  };

  const autoSolve = () => {
    setTiles([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    setSolved(true);
    SoundEffects.playCelebrationFanfare();
    confetti({ particleCount: 75, spread: 70 });
    if (onComplete) onComplete();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-1.5 w-64 h-64 p-2 bg-stone-100 rounded-2xl border border-stone-300">
        {tiles.map((tileIndex, idx) => {
          if (tileIndex === 0 && !solved) {
            return (
              <div key={idx} className="bg-stone-200/50 rounded-xl border border-dashed border-stone-300" />
            );
          }
          // Coordinate of this piece in original image
          const origRow = Math.floor(tileIndex / 3);
          const origCol = tileIndex % 3;

          return (
            <div
              key={idx}
              onClick={() => swapTiles(idx)}
              className="relative rounded-xl overflow-hidden cursor-pointer shadow-xs border border-white hover:brightness-105 active:scale-95 transition"
              style={{
                backgroundImage: `url(${defaultImage})`,
                backgroundSize: '300% 300%',
                backgroundPosition: `${origCol * 50}% ${origRow * 50}%`,
              }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={autoSolve}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-medium hover:bg-amber-200 cursor-pointer"
        >
          Unscramble Instantly ✨
        </button>
      </div>

      {solved && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold"
        >
          {content.rewardMessage}
        </motion.div>
      )}
    </div>
  );
};
