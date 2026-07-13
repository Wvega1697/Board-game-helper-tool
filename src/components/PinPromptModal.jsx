import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';

/**
 * Shared PIN prompt modal. Used wherever BGG credentials need to be decrypted.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {function} props.onSubmit - Called with the PIN string when user confirms
 * @param {function} props.onClose - Called when user cancels
 * @param {string} [props.error] - External error message (e.g. "Incorrect PIN")
 */
export default function PinPromptModal({ open, onSubmit, onClose, error }) {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!pin.trim()) {
      setLocalError(t('bggPinPlaceholder'));
      return;
    }
    setLocalError('');
    onSubmit(pin);
    setPin('');
  };

  const handleClose = () => {
    setPin('');
    setLocalError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-6 w-full max-w-xs space-y-4 animate-scale-in">
        <h3 className="font-heading text-lg font-bold text-text-primary">🔐 {t('bggPin')}</h3>
        <p className="text-text-secondary text-sm">{t('bggPinPromptDesc')}</p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('bggPinPlaceholder')}
          className="input w-full"
          autoFocus
          id="bgg-pin-input"
        />
        {(localError || error) && (
          <p className="text-danger text-sm">{localError || error}</p>
        )}
        <div className="flex gap-3">
          <button onClick={handleSubmit} className="btn btn-primary flex-1" id="btn-pin-confirm">
            {t('confirm')}
          </button>
          <button onClick={handleClose} className="btn btn-secondary" id="btn-pin-cancel">
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
