import React, { useState, useEffect } from 'react';
import { verifyPin, unlock } from '../utils/pinLock';

const PIN_LENGTH = 6;

const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleInput = (digit) => {
    setError(false);
    setPin(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      return prev + digit;
    });
  };

  const handleDelete = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleInput(e.key);
      else if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    (async () => {
      const ok = await verifyPin(pin);
      if (ok) {
        unlock();
        setTimeout(() => onUnlock(), 300);
      } else {
        setError(true);
        setShaking(true);
        setTimeout(() => {
          setShaking(false);
          setPin('');
        }, 500);
      }
    })();
  }, [pin, onUnlock]);

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

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
      <div className={shaking ? 'pin-shake' : ''} style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '5rem',
          marginBottom: '12px',
          animation: pin.length === PIN_LENGTH && !error ? 'pin-success 0.5s ease-out' : 'pin-bounce 2s ease-in-out infinite',
        }}>
          {error ? '😢' : pin.length === PIN_LENGTH ? '🎉' : '👶'}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          color: 'var(--fg)', marginBottom: '8px',
        }}>
          {error ? 'PIN 錯誤' : '輸入 PIN'}
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.95rem',
          color: 'var(--fg)', opacity: 0.6, marginBottom: '32px',
        }}>
          {error ? '再試一次吧' : '這是 Louise 的私人空間 ✨'}
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '40px' }}>
          {dots.map((filled, i) => (
            <div key={i} style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid var(--fg)',
              background: filled ? (error ? 'var(--accent)' : 'var(--fg)') : 'transparent',
              transition: 'all 0.15s ease',
              boxShadow: filled ? '2px 2px 0px 0px rgba(45,45,45,0.3)' : 'none',
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
              opacity: pin.length > 0 ? 1 : 0.4, transition: 'all 0.1s ease',
            }}>⌫</button>
        </div>

        <p style={{ marginTop: '32px', fontFamily: 'var(--font-body)', fontSize: '0.7rem', opacity: 0.4 }}>
          忘記 PIN？清除瀏覽器資料即可重置
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
