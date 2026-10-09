'use client';
import { useState } from 'react';
import type { Question } from '@/data/quizzes';

// Pick an answer: it locks, shows right or wrong, and explains. No timers, no animation.
export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const done = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, i) => p === questions[i].answer).length;
  return (
    <div className="card">
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h3>Quiz</h3>
        <span className="chip tnum" aria-live="polite">{done < questions.length ? `${done} of ${questions.length} answered` : `${right} of ${questions.length} right`}</span>
      </div>
      {questions.map((q, i) => (
        <fieldset key={i} className="q" style={{ border: 0, padding: 0 }}>
          <legend className="q-text">{i + 1}. {q.q}</legend>
          <div className="opts">
            {q.options.map((o, k) => {
              const p = picked[i];
              const cls = p === null ? '' : k === q.answer ? 'right' : k === p ? 'wrong' : '';
              return (
                <button key={k} type="button" className={`opt ${cls}`} disabled={p !== null}
                  aria-pressed={p === k} onClick={() => setPicked((s) => s.map((v, j) => (j === i ? k : v)))}>
                  {o}{p !== null && k === q.answer ? '  ✓' : ''}
                </button>
              );
            })}
          </div>
          {picked[i] !== null && <p className="why"><strong>{picked[i] === q.answer ? 'Right.' : 'Not quite.'}</strong> {q.why}</p>}
        </fieldset>
      ))}
      {done > 0 && <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => setPicked(questions.map(() => null))}>Start again</button>}
    </div>
  );
}
