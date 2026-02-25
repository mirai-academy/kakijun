import React, { useRef, useEffect, useState } from 'react';

interface CanvasBoardProps {
  kanji: string;
  onComplete: (accuracy: number) => void;
  disabled?: boolean;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ kanji, onComplete, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [lastStrokeValid, setLastStrokeValid] = useState<boolean | null>(null);
  const [currentStrokeStart, setCurrentStrokeStart] = useState<{ x: number; y: number } | null>(null);

  const CANVAS_SIZE = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    if (!canvas || !hiddenCanvas) return;

    const ctx = canvas.getContext('2d');
    const hCtx = hiddenCanvas.getContext('2d');
    if (!ctx || !hCtx) return;

    // Clear and setup
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    hCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background grid
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0); ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.moveTo(0, CANVAS_SIZE / 2); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Kanji Guide
    const fontSize = CANVAS_SIZE * 0.8;
    ctx.font = `${fontSize}px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillText(kanji, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + fontSize * 0.05);

    // Draw Kanji to hidden canvas for accuracy check
    hCtx.font = `${fontSize}px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillStyle = 'black';
    hCtx.fillText(kanji, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + fontSize * 0.05);

    setStrokeCount(0);
    setLastStrokeValid(null);
  }, [kanji]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    setCurrentStrokeStart({ x, y });
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#6366f1';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Simplified Stroke Order/Direction Check
    // Most Kanji strokes go Top-to-Bottom or Left-to-Right
    const { x: endX, y: endY } = getCoordinates(e);
    if (currentStrokeStart) {
      const dx = endX - currentStrokeStart.x;
      const dy = endY - currentStrokeStart.y;
      
      // A "valid" stroke should generally move down or right
      // We allow some tolerance
      const isDown = dy > -10;
      const isRight = dx > -10;
      
      const isValid = isDown || isRight;
      setLastStrokeValid(isValid);
      setStrokeCount(prev => prev + 1);
    }
  };

  const calculateAccuracy = () => {
    const hCtx = hiddenCanvasRef.current?.getContext('2d');
    if (!hCtx) return;

    const kanjiData = hCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_SIZE;
    tempCanvas.height = CANVAS_SIZE;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    tCtx.drawImage(canvas, 0, 0);
    
    const userData = tCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    
    let kanjiPixels = 0;
    let coveredPixels = 0;

    for (let i = 0; i < kanjiData.length; i += 4) {
      const isKanji = kanjiData[i + 3] > 0;
      if (isKanji) {
        kanjiPixels++;
        if (userData[i + 3] > 0) {
          coveredPixels++;
        }
      }
    }

    let accuracy = (coveredPixels / kanjiPixels) * 100;
    
    // Penalty for incorrect stroke direction
    if (lastStrokeValid === false) {
      accuracy *= 0.8;
    }

    onComplete(Math.min(accuracy, 100));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0); ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.moveTo(0, CANVAS_SIZE / 2); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const fontSize = CANVAS_SIZE * 0.8;
    ctx.font = `${fontSize}px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillText(kanji, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + fontSize * 0.05);
    
    setStrokeCount(0);
    setLastStrokeValid(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-between w-full px-2">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">画数</div>
          <div className="text-xl font-black text-indigo-400">{strokeCount}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">判定</div>
          <div className={`text-xs font-black uppercase tracking-widest ${lastStrokeValid === false ? 'text-rose-500' : lastStrokeValid === true ? 'text-emerald-500' : 'text-slate-700'}`}>
            {lastStrokeValid === false ? 'ちがうよ' : lastStrokeValid === true ? 'せいかい' : 'まってるよ'}
          </div>
        </div>
      </div>

      <div className="relative bg-slate-950 border-4 border-slate-800 rounded-[2rem] shadow-inner overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair"
        />
        <canvas
          ref={hiddenCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="hidden"
        />
      </div>
      
      <div className="flex gap-4 w-full">
        <button
          onClick={clearCanvas}
          className="flex-1 py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
        >
          リセット
        </button>
        <button
          onClick={calculateAccuracy}
          disabled={disabled}
          className="flex-[2] py-4 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          けってい
        </button>
      </div>
    </div>
  );
};
