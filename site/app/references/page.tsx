import type { Metadata } from 'next';
import Em from '@/components/Em';
import Prose from '@/components/Prose';
import { references, renderMarkdown } from '@/lib/content';

export const metadata: Metadata = { title: 'References' };

export default function References() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="kicker">Every source</p>
        <h1><Em>References</Em>.</h1>
      </header>
      <Prose html={renderMarkdown(references())} />
    </div>
  );
}
