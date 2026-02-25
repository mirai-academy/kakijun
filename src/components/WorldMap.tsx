import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { HERO_EMOJI, MONSTER_EMOJIS } from '../constants';

interface Position {
  x: number;
  y: number;
}

interface MapMonster {
  id: number;
  pos: Position;
  emoji: string;
}

interface WorldMapProps {
  level: number;
  onEncounter: (isBoss?: boolean) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ level, onEncounter }) => {
  const [heroPos, setHeroPos] = useState<Position>({ x: 50, y: 50 });
  const [monsters, setMonsters] = useState<MapMonster[]>([]);
  const MAP_SIZE = 400;
  const STEP = 8;
  const HERO_SIZE = 40;
  const MONSTER_SIZE = 40;

  // Theme configuration
  const getTheme = () => {
    switch (level) {
      case 2: // Sea
        return {
          bg: '#bde0fe',
          border: '#457b9d',
          texture: 'https://www.transparenttextures.com/patterns/wave-cut.png',
          decor: ['🏝️', '⛵', '🌊', '🐚'],
          name: '蒼き海原 (あおき うなばら)'
        };
      case 3: // Forest
        return {
          bg: '#2d6a4f',
          border: '#1b4332',
          texture: 'https://www.transparenttextures.com/patterns/dark-matter.png',
          decor: ['🌲', '🌲', '🏰', '🍄'],
          name: '魔王の森 (まおうの もり)'
        };
      default: // Desert / Parchment
        return {
          bg: '#f4e4bc',
          border: '#8b5e3c',
          texture: 'https://www.transparenttextures.com/patterns/parchment.png',
          decor: ['⛰️', '🌵', '💀', '🏜️'],
          name: '黄金の砂漠 (おうごんの さばく)'
        };
    }
  };

  const theme = getTheme();

  // Initialize monsters
  useEffect(() => {
    const initialMonsters = Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      pos: {
        x: 50 + Math.random() * (MAP_SIZE - 100),
        y: 50 + Math.random() * (MAP_SIZE - 100),
      },
      emoji: MONSTER_EMOJIS[Math.floor(Math.random() * MONSTER_EMOJIS.length)],
    }));
    setMonsters(initialMonsters);
  }, [level]);

  const moveHero = useCallback((dx: number, dy: number) => {
    setHeroPos(prev => ({
      x: Math.max(0, Math.min(MAP_SIZE - HERO_SIZE, prev.x + dx)),
      y: Math.max(0, Math.min(MAP_SIZE - HERO_SIZE, prev.y + dy)),
    }));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': moveHero(0, -STEP); break;
        case 'ArrowDown': moveHero(0, STEP); break;
        case 'ArrowLeft': moveHero(-STEP, 0); break;
        case 'ArrowRight': moveHero(STEP, 0); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHero]);

  // Collision detection
  useEffect(() => {
    // Check monster collisions
    const collidingMonster = monsters.find(m => {
      const dx = Math.abs(heroPos.x - m.pos.x);
      const dy = Math.abs(heroPos.y - m.pos.y);
      return dx < (HERO_SIZE + MONSTER_SIZE) / 2 && dy < (HERO_SIZE + MONSTER_SIZE) / 2;
    });

    if (collidingMonster) {
      onEncounter(false);
      setMonsters(prev => prev.filter(m => m.id !== collidingMonster.id));
      return;
    }

    // Check Castle collision in level 3
    if (level === 3 && monsters.length === 0) {
      const castleX = MAP_SIZE / 2 - HERO_SIZE / 2;
      const castleY = MAP_SIZE / 2 - HERO_SIZE / 2;
      const dx = Math.abs(heroPos.x - castleX);
      const dy = Math.abs(heroPos.y - castleY);
      
      if (dx < HERO_SIZE && dy < HERO_SIZE) {
        onEncounter(true);
      }
    }
  }, [heroPos, monsters, onEncounter, level]);

  const handleMapClick = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const targetX = clientX - rect.left - HERO_SIZE / 2;
    const targetY = clientY - rect.top - HERO_SIZE / 2;

    setHeroPos({
      x: Math.max(0, Math.min(MAP_SIZE - HERO_SIZE, targetX)),
      y: Math.max(0, Math.min(MAP_SIZE - HERO_SIZE, targetY)),
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2 drop-shadow-lg">{theme.name}</h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
          レベル {level} - のこりの てき: {monsters.length}
        </p>
        {level === 3 && monsters.length === 0 && (
          <p className="text-rose-400 text-xs font-black animate-pulse mt-1">
            城（しろ）に 大まおうが あらわれた！
          </p>
        )}
      </div>

      <div 
        className="relative rounded-sm shadow-2xl overflow-hidden cursor-pointer transition-colors duration-1000"
        style={{ 
          width: MAP_SIZE, 
          height: MAP_SIZE,
          backgroundColor: theme.bg,
          border: `12px solid ${theme.border}`,
          backgroundImage: `url("${theme.texture}")`,
          boxShadow: `inset 0 0 100px ${theme.border}44, 0 20px 50px rgba(0,0,0,0.5)`
        }}
        onClick={handleMapClick}
      >
        {/* Map Grid / Compass Rose (Decorative) */}
        <div className="absolute top-4 right-4 opacity-20 pointer-events-none text-4xl">🧭</div>
        
        {/* Decorative Elements */}
        {level === 3 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-60 pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            🏰
          </div>
        )}
        
        <div className="absolute top-10 left-20 opacity-30 pointer-events-none text-2xl">{theme.decor[0]}</div>
        <div className="absolute top-40 left-10 opacity-30 pointer-events-none text-2xl">{theme.decor[1]}</div>
        <div className="absolute bottom-20 right-10 opacity-30 pointer-events-none text-2xl">{theme.decor[2]}</div>
        <div className="absolute bottom-10 right-32 opacity-30 pointer-events-none text-2xl">{theme.decor[3]}</div>

        {/* Monsters */}
        {monsters.map(m => (
          <motion.div
            key={m.id}
            className="absolute text-3xl select-none drop-shadow-md"
            style={{ left: m.pos.x, top: m.pos.y }}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {m.emoji}
          </motion.div>
        ))}

        {/* Hero */}
        <motion.div
          className="absolute text-4xl select-none z-10 drop-shadow-xl"
          animate={{ x: heroPos.x, y: heroPos.y }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {HERO_EMOJI}
        </motion.div>

        {/* Vignette effect */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]" />
      </div>

      <div className="grid grid-cols-3 gap-3 md:hidden">
        <div />
        <button onClick={() => moveHero(0, -STEP * 4)} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-md active:bg-indigo-600 text-2xl">⬆️</button>
        <div />
        <button onClick={() => moveHero(-STEP * 4, 0)} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-md active:bg-indigo-600 text-2xl">⬅️</button>
        <button onClick={() => moveHero(0, STEP * 4)} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-md active:bg-indigo-600 text-2xl">⬇️</button>
        <button onClick={() => moveHero(STEP * 4, 0)} className="p-4 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-md active:bg-indigo-600 text-2xl">➡️</button>
      </div>
    </div>
  );
};
