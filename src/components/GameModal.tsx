import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Localized } from '../shared/i18n/Localized';

interface GameModalProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  tone?: 'default' | 'danger';
}

export function GameModal({ eyebrow, title, children, actions, onClose, tone = 'default' }: GameModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, []);

  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <Localized>{(
    <div className="game-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`game-modal game-modal-${tone}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} onKeyDown={trapFocus}>
        <button className="game-modal-close" onClick={onClose} aria-label="대화상자 닫기">×</button>
        <div className="game-modal-crest" aria-hidden="true"><span>♜</span></div>
        <header><span className="eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></header>
        <div className="game-modal-content">{children}</div>
        <footer className="game-modal-actions">{actions}</footer>
      </section>
    </div>
  )}</Localized>;
}
