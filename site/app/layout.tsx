import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Compass from '@/components/Compass';
import Em from '@/components/Em';
import { REPO } from '@/lib/content';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'motion-studio: motion graphics made as programs', template: '%s · motion-studio' },
  description: 'Every frame a pure function of time, rendered by a headless browser, scored in code and checked by numbers. Eight lessons, four films, every check explained.',
};
export const viewport: Viewport = { themeColor: '#f6f1e7', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand"><span className="brand-tile"><Compass /></span>motion-studio</Link>
            <Nav />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <div className="foot-grid">
              <div>
                <h3>Made as <Em>programs</Em>.</h3>
                <p className="small" style={{ margin: 0, maxWidth: '42ch', color: 'rgba(246,241,231,0.8)' }}>
                  Every page here is built from the repo: the course, the check reports, the films and the git history.
                </p>
              </div>
              <div>
                <h3>Read</h3>
                <ul>
                  <li><Link href="/lessons/">Lessons</Link></li>
                  <li><Link href="/references/">References</Link></li>
                  <li><Link href="/how-to/">How-to</Link></li>
                </ul>
              </div>
              <div>
                <h3>Source</h3>
                <ul>
                  <li><a href={REPO}>Repository</a></li>
                  <li><a href={`${REPO}/blob/main/LICENSE`}>MIT licence</a></li>
                  <li><a href={`${REPO}/blob/main/NOTICE.md`}>Fonts (SIL OFL)</a></li>
                </ul>
              </div>
            </div>
            <p className="foot-note">Inter and Fraunces are under the SIL Open Font License. The films show fictional data only.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
