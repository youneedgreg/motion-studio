'use client';
import { useState } from 'react';
import type { Card } from '@/data/quizzes';

// One card at a time: press it to turn it over, then move on. The swap is instant (no flip animation).
export default function Flashcards({ cards }: { cards: Card[] }) {
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const go = (d: number) => { setI((v) => (v + d + cards.length) % cards.length); setBack(false); };
  const c = cards[i];
  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h3>Flashcards</h3>
        <span className="chip tnum">{i + 1} of {cards.length}</span>
      </div>
      <button type="button" className={`flash${back ? ' back' : ''}`} onClick={() => setBack((b) => !b)} aria-live="polite">
        <span className="side">{back ? 'Answer' : 'Question · press to turn over'}</span>
        <span className="face">{back ? c.back : c.front}</span>
      </button>
      <div className="flash-bar">
        <button type="button" className="btn" onClick={() => go(-1)}>← Previous</button>
        <button type="button" className="btn btn-primary" onClick={() => go(1)}>Next card →</button>
      </div>
    </div>
  );
}
