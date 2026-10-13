import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Eventos que contam como "interação do usuário" e liberam o som no navegador
const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'click'];

export default function BackgroundMusic({ musicUrl }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!musicUrl || !audio) return undefined;

    const removeUnlock = () =>
      UNLOCK_EVENTS.forEach((e) => document.removeEventListener(e, unlock));

    // Primeira interação: o navegador bloqueou o autoplay, então tocamos agora
    function unlock() {
      audio.play().then(removeUnlock).catch(() => {});
    }

    audio.src = musicUrl;
    audio.play().catch(() => {
      UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, unlock));
    });

    return removeUnlock;
  }, [musicUrl]);

  // Botão: alterna entre tocar e pausar, de acordo com o estado real do áudio
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  if (!musicUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        loop
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#FF6B6B]/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
      >
        {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>
    </>
  );
}
