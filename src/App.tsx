/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Trophy, Star, RefreshCw, ChevronRight, BookOpen, User } from 'lucide-react';
import { KANJI_DATA, MONSTER_EMOJIS, BOSS_EMOJI, HERO_EMOJI } from './constants';
import { GameState, UserStats, Monster } from './types';
import { CanvasBoard } from './components/CanvasBoard';
import { WorldMap } from './components/WorldMap';

const XP_PER_LEVEL = 100;
const MONSTERS_BEFORE_BOSS = 3;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [grade, setGrade] = useState<number>(1);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('kanji_quest_stats');
    return saved ? JSON.parse(saved) : {
      level: 1,
      xp: 0,
      totalDefeated: 0,
      accuracyHistory: [],
      currentMapLevel: 1
    };
  });
  const [monster, setMonster] = useState<Monster | null>(null);
  const [monstersDefeatedInLevel, setMonstersDefeatedInLevel] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [combo, setCombo] = useState(0);

  const MONSTERS_PER_MAP = 4;

  // Save stats to local storage
  useEffect(() => {
    localStorage.setItem('kanji_quest_stats', JSON.stringify(stats));
  }, [stats]);

  const spawnMonster = useCallback((isBoss = false) => {
    const kanjiList = KANJI_DATA[grade];
    const randomKanji = kanjiList[Math.floor(Math.random() * kanjiList.length)];
    const emoji = isBoss ? BOSS_EMOJI : MONSTER_EMOJIS[Math.floor(Math.random() * MONSTER_EMOJIS.length)];
    
    setMonster({
      kanji: randomKanji,
      hp: isBoss ? 200 : 100,
      maxHp: isBoss ? 200 : 100,
      emoji,
      isBoss
    });
    setGameState(isBoss ? 'BOSS_BATTLE' : 'BATTLE');
  }, [grade]);

  const startGame = (selectedGrade: number) => {
    setGrade(selectedGrade);
    setMonstersDefeatedInLevel(0);
    setCombo(0);
    setGameState('MAP');
  };

  const handleEncounter = (isBoss?: boolean) => {
    spawnMonster(isBoss || false);
  };

  const handleTracingComplete = (accuracy: number) => {
    if (!monster) return;

    let damage = 0;
    let message = "";
    let color = "";

    if (accuracy >= 85) {
      damage = 100;
      message = "かいしんの一げき！！";
      color = "text-yellow-400";
      setCombo(prev => prev + 1);
    } else if (accuracy >= 60) {
      damage = 100;
      message = "大せいこう！";
      color = "text-cyan-400";
      setCombo(prev => prev + 1);
    } else {
      damage = 10;
      message = "ミス！ もういちど";
      color = "text-rose-500";
      setCombo(0);
    }

    setFeedback({ text: message, color });
    setTimeout(() => setFeedback(null), 2000);

    const newHp = Math.max(0, monster.hp - damage);
    setMonster(prev => prev ? { ...prev, hp: newHp } : null);

    if (newHp === 0) {
      handleMonsterDefeat(monster.isBoss);
    }
  };

  const handleMonsterDefeat = () => {
    const xpGained = 30;
    let newXp = stats.xp + xpGained;
    let newLevel = stats.level;

    if (newXp >= XP_PER_LEVEL) {
      newLevel += 1;
      newXp -= XP_PER_LEVEL;
    }

    setStats(prev => ({
      ...prev,
      level: newLevel,
      xp: newXp,
      totalDefeated: prev.totalDefeated + 1,
      accuracyHistory: [...prev.accuracyHistory, 100]
    }));

    const nextDefeatedCount = monstersDefeatedInLevel + 1;
    setMonstersDefeatedInLevel(nextDefeatedCount);

    setTimeout(() => {
      if (monster?.isBoss) {
        setGameState('RESULT');
      } else if (nextDefeatedCount >= MONSTERS_PER_MAP) {
        setGameState('LEVEL_CLEAR');
      } else {
        setGameState('MAP');
      }
    }, 1500);
  };

  const nextLevel = () => {
    if (stats.currentMapLevel < 3) {
      setStats(prev => ({ ...prev, currentMapLevel: prev.currentMapLevel + 1 }));
      setMonstersDefeatedInLevel(0);
      setGameState('MAP');
    } else {
      setGameState('RESULT');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100 p-4 md:p-8 selection:bg-indigo-500/30">
      <div className="max-w-2xl mx-auto">
        
        {/* Header / Stats */}
        <header className="flex justify-between items-center mb-8 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <User size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">レベル {stats.level}</div>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.xp / XP_PER_LEVEL) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">たおした数</div>
              <div className="text-xl font-black text-slate-200">{stats.totalDefeated}</div>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Trophy className="text-yellow-500" size={24} />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-12">
                <motion.h1 
                  animate={{ textShadow: ["0 0 20px rgba(99,102,241,0)", "0 0 20px rgba(99,102,241,0.5)", "0 0 20px rgba(99,102,241,0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tighter"
                >
                  書き順クエスト
                </motion.h1>
                <span className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-black uppercase tracking-[0.3em]">
                  勇者と魔王の漢字修行
                </span>
              </div>
              
              <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-slate-800 shadow-2xl mb-8">
                <p className="text-slate-400 mb-8 font-bold tracking-wide">
                  修行（しゅぎょう）する 学年を えらべ！
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      onClick={() => startGame(g)}
                      className="group relative bg-slate-800/50 hover:bg-indigo-600 hover:text-white p-6 rounded-2xl transition-all duration-300 border border-slate-700 hover:border-indigo-400 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] active:scale-95"
                    >
                      <div className="text-3xl font-black mb-1">{g}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100">Grade</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-12 text-slate-500">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-widest">120 Kanji</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sword size={18} className="text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-widest">RPG Battle</span>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'MAP' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
            >
              <WorldMap level={stats.currentMapLevel} onEncounter={handleEncounter} />
              
              <button
                onClick={() => setGameState('START')}
                className="w-full mt-12 py-4 text-slate-500 font-black hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
              >
                <RefreshCw size={14} />
                タイトルにもどる
              </button>
            </motion.div>
          )}

          {(gameState === 'BATTLE' || gameState === 'BOSS_BATTLE') && monster && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Battle Scene */}
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border-2 border-slate-800 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                
                <div className="flex justify-between items-end relative z-10 mb-12">
                  {/* Hero */}
                  <div className="text-center">
                    <motion.div 
                      animate={{ y: [0, -8, 0], filter: ["drop-shadow(0 0 0px rgba(99,102,241,0))", "drop-shadow(0 0 15px rgba(99,102,241,0.5))", "drop-shadow(0 0 0px rgba(99,102,241,0))"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-7xl mb-4"
                    >
                      {HERO_EMOJI}
                    </motion.div>
                    <div className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/40">ゆうしゃ</div>
                  </div>

                  {/* VS */}
                  <div className="pb-6">
                    <div className="text-slate-800 font-black text-5xl italic tracking-tighter opacity-50">VS</div>
                  </div>

                  {/* Monster */}
                  <div className="text-center">
                    <AnimatePresence>
                      {monster.hp > 0 ? (
                        <motion.div
                          key="monster-alive"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, x: [0, 4, -4, 0] }}
                          exit={{ scale: 0, rotate: 45, opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="relative"
                        >
                          <div className="text-8xl mb-4 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">{monster.emoji}</div>
                          <div className="absolute -top-6 -right-6 bg-slate-800 border-2 border-indigo-500 rounded-2xl w-16 h-16 flex items-center justify-center text-3xl font-black shadow-2xl text-white">
                            {monster.kanji}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          className="text-8xl mb-4"
                        >
                          💥
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="w-32 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden border border-slate-700 shadow-inner">
                      <motion.div 
                        className={`h-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${monster.isBoss ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-[0.3em]">
                      {monster.isBoss ? '大まおう' : 'てき'}
                    </div>
                  </div>
                </div>

                {/* Feedback Overlay */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none font-black text-5xl text-center px-4 ${feedback.color} drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] italic tracking-tighter`}
                    >
                      {feedback.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Combo Display */}
                {combo > 1 && (
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute top-6 left-6 bg-yellow-500 text-slate-900 px-4 py-1 rounded-full font-black text-xs shadow-xl shadow-yellow-900/20 uppercase tracking-widest"
                  >
                    {combo} コンボ！
                  </motion.div>
                )}

                {/* Canvas Area */}
                <div className="mt-8 bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800">
                  <div className="text-center mb-6">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">
                      封印（ふういん）を なぞって 解け！
                    </span>
                  </div>
                  <CanvasBoard 
                    kanji={monster.kanji} 
                    onComplete={handleTracingComplete}
                    disabled={monster.hp === 0}
                  />
                </div>
              </div>

              <button
                onClick={() => setGameState('MAP')}
                className="w-full py-4 text-slate-600 font-black hover:text-rose-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-xs"
              >
                <RefreshCw size={14} />
                にげる
              </button>
            </motion.div>
          )}

          {gameState === 'LEVEL_CLEAR' && (
            <motion.div
              key="level-clear"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-slate-900/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl border-4 border-emerald-500/30">
                <div className="text-7xl mb-8">✨</div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">エリアクリア！</h2>
                <p className="text-slate-500 mb-12 font-bold tracking-widest uppercase text-xs">この地を せいあつしたぞ！</p>
                
                <button
                  onClick={nextLevel}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 text-xl tracking-tighter"
                >
                  {stats.currentMapLevel < 3 ? 'つぎのエリアへ' : 'さいしゅう結果へ'}
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'RESULT' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-slate-900/80 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl border-4 border-yellow-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
                
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-8"
                >
                  🏆
                </motion.div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">クエストクリア！</h2>
                <p className="text-slate-500 mb-12 font-bold tracking-widest uppercase text-xs">大まおうを たおし、平和が もどった！</p>
                
                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">たおした数</div>
                    <div className="text-3xl font-black text-indigo-400">{stats.totalDefeated}</div>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">最大コンボ</div>
                    <div className="text-3xl font-black text-yellow-500">{combo}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStats(prev => ({ ...prev, currentMapLevel: 1 }));
                    setGameState('START');
                  }}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-50 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 text-xl tracking-tighter"
                >
                  新しい冒険へ
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Instructions */}
      <footer className="mt-16 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] max-w-md mx-auto">
        <p className="mb-2">正しい書き順で 封印（ふういん）を 解け！</p>
        <p className="opacity-30">© 2026 書き順クエスト製作委員会</p>
      </footer>
    </div>
  );
}
