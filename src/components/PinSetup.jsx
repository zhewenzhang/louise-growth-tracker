import React, { useState, useEffect } from 'react';
import { setPin } from '../utils/pinLock';

const PIN_LENGTH = 6;

const PinSetup = ({ onDone, onSkip, mode = 'setup' }) => {
  const [step, setStep] = useState(1);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  const current = step === 1 ? pin1 : pin2;
  const setCurrent = step === 1 ? setPin1 : setPin2;

  const handleInput = (digit) => {
    if (current.length >= PIN_LENGTH) return;
    setError('');
    setCurrent(prev => prev + digit);
  };

  const handleDelete = () => {
    setError('');
    setCurrent(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (step === 1 && pin1.length === PIN_LENGTH) {
      setTimeout(() => setStep(2), 200);
    }
  }, [pin1, step]);

  useEffect(() => {
    if (step === 2 && pin2.length === PIN_LENGTH) {
      if (pin1 === pin2) {
        (async () => {
          await setPin(pin1);
          onDone?.();
        })();
      } else {
        setError('兩次輸入不一致，請重新設定');
        setTimeout(() => { setPin1(''); setPin2(''); setStep(1); setError(''); }, 1500);
      }
    }
  }, [pin2, step, pin1, onDone]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < current.length);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>
          {step === 1 ? '🔐' : '🔁'}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '6px' }}>
          {mode === 'change' ? '修改 PIN' : '設定 PIN'}
        </h1>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', opacity: 0.6, marginBottom: '24px' }}>
          {step === 1 ? '輸入 6 位數字 PIN' : '再輸入一次確認'}
        </p>

        {error && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--accent)', marginBottom: '12px', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '32px' }}>
          {dots.map((filled, i) => (
            <div key={i} style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid var(--fg)',
              background: filled ? 'var(--fg)' : 'transparent',
              transition: 'all 0.15s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: '12px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handleInput(String(n))} className="pin-key"
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
                width: '72px', height: '72px', background: '#fff',
                border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
                boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
              }}>{n}</button>
          ))}
          <div />
          <button onClick={() => handleInput('0')} className="pin-key"
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-hard)', cursor: 'pointer', transition: 'all 0.1s ease',
            }}>0</button>
          <button onClick={handleDelete} className="pin-key"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '1.4rem',
              width: '72px', height: '72px', background: '#fff',
              border: '2px solid var(--fg)', borderRadius: 'var(--wobbly-sm)',
              boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              opacity: current.length > 0 ? 1 : 0.4, transition: 'all 0.1s ease',
            }}>⌫</button>
        </div>

        {mode === 'setup' && step === 1 && onSkip && (
          <button onClick={onSkip}
            style={{
              marginTop: '24px', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
              color: 'var(--fg)', opacity: 0.5, background: 'none',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}>
            暫時跳過，之後再設定
          </button>
        )}
      </div>
    </div>
  );
};

export default PinSetup;
