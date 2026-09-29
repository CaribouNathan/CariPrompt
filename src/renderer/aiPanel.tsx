/**
 * Rédaction assistée : traduction et adaptation à l'oral, avec la clé du lecteur.
 */
import { useEffect, useState } from 'react';
import { AI_DEFAULT_MODELS, AI_PROVIDERS, AI_TARGETS, type AiProvider, type AiTask } from '../shared/types';
import { IconSpeak, IconTranslate, IconWarning } from './icons';
import { AI_PROVIDER_NAMES, api, useStore } from './store';
import { useT } from './useT';
import { ChoiceButton, PromptDialog, Row } from './widgets';

// MARK: - Rédaction IA

export function AiPanel() {
  const settings = useStore((s) => s.settings);
  const keys = useStore((s) => s.aiKeys);
  const modelList = useStore((s) => s.aiModelList);
  const modelError = useStore((s) => s.aiModelError);
  const job = useStore((s) => s.aiJob);
  const noCredit = useStore((s) => s.aiNoCredit);
  const cur = useStore((s) => s.current());
  const st = useStore.getState();
  const t = useT();
  const [keyPrompt, setKeyPrompt] = useState(false);

  const provider = settings.aiProvider;
  const providerName = AI_PROVIDER_NAMES[provider];
  const hasKey = !!keys?.[provider];
  const list = modelList[provider];
  const listError = modelError[provider];

  useEffect(() => {
    useStore.getState().loadAiKeys().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (hasKey && !list && !listError) useStore.getState().loadAiModels(provider).catch(() => undefined);
  }, [hasKey, provider, list, listError]);

  const chosen = settings.aiModels[provider] || AI_DEFAULT_MODELS[provider];
  const modelOptions = list?.length
    ? list.map((m) => ({ id: m.id, label: m.label }))
    : [{ id: chosen, label: hasKey && !listError ? t('aiLoading') : chosen }];
  if (list?.length && !list.some((m) => m.id === chosen)) modelOptions.unshift({ id: chosen, label: chosen });

  const lang = settings.language;
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([lang], { type: 'language' }); } catch { names = null; }
  const targetOptions = AI_TARGETS.map((code) => {
    const n = names?.of(code) ?? code;
    return { id: code, label: n.charAt(0).toLocaleUpperCase(lang) + n.slice(1) };
  });

  const busy = !!job;
  const disabled = !hasKey || busy || !cur;
  const run = (task: AiTask) => { st.runAi(task).catch(() => undefined); };

  return (
    <>
      <Row label={t('aiProvider')}>
        <ChoiceButton
          value={provider}
          options={AI_PROVIDERS.map((p) => ({ id: p, label: AI_PROVIDER_NAMES[p] }))}
          onChange={(v) => !busy && st.setSetting('aiProvider', v as AiProvider)}
        />
      </Row>
      <Row label={t('aiKey')}>
        <span className="ai-key">
          <span className={hasKey ? 'ai-key-ok' : 'ai-key-missing'}>
            {hasKey ? t('aiKeySet') : t('aiKeyMissing')}
          </span>
          <button type="button" className="link-btn" tabIndex={-1} disabled={busy}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (hasKey ? st.setAiKey(provider, '') : setKeyPrompt(true))}>
            {hasKey ? t('aiRemoveKey') : t('aiEnterKey')}
          </button>
        </span>
      </Row>
      {hasKey && (
        <Row label={t('aiModel')}>
          <ChoiceButton
            value={chosen}
            options={modelOptions}
            onChange={(v) => st.setSetting('aiModels', { ...settings.aiModels, [provider]: v })}
          />
        </Row>
      )}
      {listError && <p className="note warn"><IconWarning size={13} />{listError}</p>}
      {noCredit === provider && (
        <div className="note warn ai-credit">
          <IconWarning size={13} />
          <span>
            {t('aiErrNoCredit', { provider: providerName })}{' '}
            <button type="button" className="link-btn" tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} onClick={() => api.aiOpenBilling(provider)}>
              {t('aiOpenBilling')}
            </button>
          </span>
        </div>
      )}

      <Row label={t('aiTranslateTo')}>
        <ChoiceButton
          value={settings.aiTarget}
          options={targetOptions}
          onChange={(v) => st.setSetting('aiTarget', v)}
        />
      </Row>
      <div className="ai-actions">
        <button type="button" className="push-btn" tabIndex={-1} disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run({ kind: 'translate', target: settings.aiTarget })}>
          <IconTranslate size={14} />{t('aiTranslate')}
        </button>
        <button type="button" className="push-btn" tabIndex={-1} disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run({ kind: 'oral' })}>
          <IconSpeak size={14} />{t('aiOral')}
        </button>
      </div>

      {job && (
        <div className="ai-progress">
          <div className="ai-progress-row">
            <span>{t(job.kind === 'translate' ? 'aiTranslating' : 'aiAdapting', { done: job.done, total: job.total })}</span>
            <button type="button" className="link-btn" tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()} onClick={() => st.cancelAi()}>
              {t('cancel')}
            </button>
          </div>
          <div className="ai-bar">
            <div className={`ai-bar-fill${job.done === 0 ? ' indeterminate' : ''}`}
              style={{ width: job.done === 0 ? undefined : `${(job.done / Math.max(job.total, 1)) * 100}%` }} />
          </div>
        </div>
      )}

      <p className="note">{t('aiNote')}</p>
      {keys && !keys.encrypted && <p className="note warn"><IconWarning size={13} />{t('aiKeyPlain')}</p>}

      {keyPrompt && (
        <PromptDialog
          title={t('aiKeyTitle', { provider: providerName })}
          label={t('aiKeyLabel', { provider: providerName })}
          placeholder={provider === 'anthropic' ? 'sk-ant-…' : 'sk-…'}
          secret
          onCancel={() => setKeyPrompt(false)}
          onSubmit={(v) => {
            setKeyPrompt(false);
            st.setAiKey(provider, v).catch(() => undefined);
          }}
        />
      )}
    </>
  );
}

/**
 * Message bloquant à un seul bouton. La saisie est gelée pendant l'affichage
 * pour que les raccourcis du prompteur ne passent pas au travers.
 */
