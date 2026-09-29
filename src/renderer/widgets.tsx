/**
 * Briques communes de l'interface : boîtes de dialogue, blocs du panneau et
 * contrôles de formulaire. Aucun état propre à une fonction de l'application,
 * rien que des pièces réutilisables.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StringKey } from '../shared/i18n';
import { homeTab, type InspectorBlockId, type InspectorTabId } from '../shared/types';
import { IconCheck, IconClose, IconInfo, IconWarning } from './icons';
import { api, useStore } from './store';
import { useT } from './useT';

export function AlertDialog() {
  const alert = useStore((s) => s.alert);
  const dismiss = useStore((s) => s.dismissAlert);
  const setEditing = useStore((s) => s.setEditing);
  const t = useT();

  useEffect(() => {
    if (!alert) return undefined;
    setEditing(true);
    const key = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') dismiss();
    };
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('keydown', key, true);
      setEditing(false);
    };
  }, [alert, dismiss, setEditing]);

  if (!alert) return null;

  return (
    <div className="modal-backdrop" onMouseDown={dismiss}>
      <div className="modal alert" onMouseDown={(e) => e.stopPropagation()} role="alertdialog">
        <p className="alert-text">{t(alert)}</p>
        <div className="modal-actions">
          <button type="button" className="push-btn primary" autoFocus
            onMouseDown={(e) => e.preventDefault()} onClick={dismiss}>
            {t('ok')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptDialog({ title, label, placeholder, secret = false, onCancel, onSubmit }: {
  title: string; label: string; placeholder: string; secret?: boolean;
  onCancel: () => void; onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const t = useT();
  const setEditing = useStore((s) => s.setEditing);
  useEffect(() => {
    setEditing(true);
    return () => setEditing(false);
  }, [setEditing]);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h4>{title}</h4>
        <label className="modal-label">{label}</label>
        <input
          className="modal-input"
          type={secret ? 'password' : 'text'}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSubmit(value);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-actions">
          <button type="button" className="push-btn" onMouseDown={(e) => e.preventDefault()} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="push-btn primary" disabled={!value.trim()}
            onMouseDown={(e) => e.preventDefault()} onClick={() => onSubmit(value)}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="color-field">
      <span className="color-hex">{value.toUpperCase()}</span>
      <span className="color-swatch" style={{ background: value }} />
      <input type="color" value={value} tabIndex={-1} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export interface BlockDnd {
  tab: InspectorTabId;
  order: InspectorBlockId[];
  dragId: InspectorBlockId | null;
  overId: InspectorBlockId | null;
  isDragging: () => boolean;
  onStart: (id: InspectorBlockId) => void;
  onOver: (id: InspectorBlockId) => void;
  onEnd: () => void;
  onDrop: (id: InspectorBlockId) => void;
}

/** Bloc de réglages : repliable, déplaçable par sa poignée (l'en-tête seul est
 *  draggable, pour ne pas gêner les curseurs et les champs qu'il contient). */
export function Group({ id, title, children, dnd, info }: {
  id: InspectorBlockId; title: string; children: ReactNode; dnd: BlockDnd; info?: string;
}) {
  const t = useT();
  const key = `${dnd.tab}:${id}`;
  const collapsed = useStore((s) => s.settings.collapsedBlocks.includes(key));
  const [showInfo, setShowInfo] = useState(false);
  const dragging = dnd.dragId === id;
  const over = dnd.overId === id && dnd.dragId !== null && dnd.dragId !== id;
  const below = over && dnd.dragId !== null && dnd.order.indexOf(dnd.dragId) < dnd.order.indexOf(id);
  return (
    <section
      className={`group${collapsed ? ' collapsed' : ''}${dragging ? ' dragging' : ''}${over ? (below ? ' drag-below' : ' drag-above') : ''}`}
      onDragOver={(e) => {
        if (!dnd.isDragging()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dnd.onOver(id);
      }}
      onDrop={(e) => {
        if (!dnd.isDragging()) return;
        e.preventDefault();
        e.stopPropagation();
        dnd.onDrop(id);
      }}
    >
      <h3
        draggable
        title={t('dragToReorder')}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id);
          dnd.onStart(id);
        }}
        onDragEnd={dnd.onEnd}
      >
        <span className="drag-handle" aria-hidden>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="3" r="1.15" /><circle cx="7.5" cy="3" r="1.15" />
            <circle cx="2.5" cy="7" r="1.15" /><circle cx="7.5" cy="7" r="1.15" />
            <circle cx="2.5" cy="11" r="1.15" /><circle cx="7.5" cy="11" r="1.15" />
          </svg>
        </span>
        <span className="group-title">{title}</span>
        {info && (
          <button
            type="button" className={`icon-btn info-btn${showInfo ? ' on' : ''}`} title={t('blockInfo')}
            aria-label={t('blockInfo')} aria-pressed={showInfo} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }}
          >
            <IconInfo size={13} />
          </button>
        )}
        {/* Un bloc déplacé dans un autre onglet peut être renvoyé au sien */}
        {dnd.tab !== homeTab(id) && (
          <button
            type="button" className="icon-btn" title={t('removeBlock')} aria-label={t('removeBlock')} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); useStore.getState().moveBlockToTab(id, homeTab(id)); }}
          >
            <IconClose size={11} />
          </button>
        )}
        <button
          type="button" className="icon-btn block-chevron"
          title={collapsed ? t('expandBlock') : t('collapseBlock')}
          aria-label={collapsed ? t('expandBlock') : t('collapseBlock')}
          aria-expanded={!collapsed} tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => { e.stopPropagation(); useStore.getState().toggleBlockCollapsed(key); }}
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </h3>
      {info && showInfo && <p className="note block-info">{info}</p>}
      {!collapsed && <div className="group-card">{children}</div>}
    </section>
  );
}

export function Row({ label, children, disabled, stacked, indent }: {
  label: string; children: ReactNode; disabled?: boolean; stacked?: boolean; indent?: boolean;
}) {
  return (
    <div className={`row${disabled ? ' disabled' : ''}${stacked ? ' stacked' : ''}${indent ? ' indent' : ''}`}>
      <span className="row-label">{label}</span>
      <span className="row-value">{children}</span>
    </div>
  );
}

export function Slider({ min, max, step, value, onChange, left, right, onLeft, onRight, leftLabel, rightLabel }: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; left?: ReactNode; right?: ReactNode;
  onLeft?: () => void; onRight?: () => void; leftLabel?: string; rightLabel?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const end = (side: ReactNode, action?: () => void, label?: string) => (action
    ? (
      <button type="button" className="slider-end step" title={label} aria-label={label} tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()} onClick={action}>
        {side}
      </button>
    )
    : <span className="slider-end">{side}</span>);
  return (
    <div className="slider">
      {left && end(left, onLeft, leftLabel)}
      <input
        type="range" min={min} max={max} step={step} value={value} tabIndex={-1}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {right && end(right, onRight, rightLabel)}
    </div>
  );
}

/** Bouton de type « menu local » : ouvre un menu natif du système */
export function ChoiceButton({ value, options, onChange }: {
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <button
      type="button"
      className="choice-btn"
      title={current?.label}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={async (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const id = await api.choiceMenu(
          options.map((o) => ({ ...o, checked: o.id === value })),
          r.left,
          r.bottom + 2,
        );
        if (id !== null && id !== value) onChange(id);
      }}
    >
      <span className="choice-label">{current?.label}</span>
      <svg className="choice-chevron" width="9" height="12" viewBox="0 0 9 12" aria-hidden>
        <path d="M1.5 4.5 4.5 1.5 7.5 4.5M1.5 7.5 4.5 10.5 7.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle${checked ? ' on' : ''}`}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'on' : ''}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({ value, min, max, disabled, onChange }: {
  value: number; min: number; max: number; disabled?: boolean; onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const setEditing = useStore((s) => s.setEditing);
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), max));
    else setDraft(String(value));
  };
  return (
    <input
      className="number-field"
      type="text"
      inputMode="numeric"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
      onFocus={(e) => { setEditing(true); e.target.select(); }}
      onBlur={() => { setEditing(false); commit(); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}
