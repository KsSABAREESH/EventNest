import type { CardSticker, CardTheme } from '@/lib/api/card-design';

const stickerDetails: Record<CardSticker, { emoji: string; label: string }> = {
  sparkles: { emoji: '✨', label: 'Sparkles' },
  'music-notes': { emoji: '🎵', label: 'Music notes' },
  confetti: { emoji: '🎊', label: 'Confetti' },
  heart: { emoji: '💛', label: 'Heart' },
  star: { emoji: '⭐', label: 'Star' },
};

const surfaces: Record<CardTheme, string> = {
  paper: 'border-[#eee3d6] bg-[#fffaf2] text-[#29283f]',
  sunset: 'border-[#ec796e]/40 bg-gradient-to-br from-[#ff785f] via-[#e95760] to-[#75427d] text-white',
  midnight: 'border-[#39356f] bg-gradient-to-br from-[#252463] via-[#211d4a] to-[#12132f] text-white',
};

export function cardSurfaceClass(theme: CardTheme) {
  return surfaces[theme];
}

export function cardMutedTextClass(theme?: CardTheme) {
  return theme === 'sunset' || theme === 'midnight' ? 'text-white/75' : 'text-[#6e6d82]';
}

export function CardStickerOverlay({ stickers }: { stickers: CardSticker[] }) {
  if (stickers.length === 0) return null;
  return (
    <div className="absolute bottom-3 right-3 flex gap-1.5" aria-label="Your card stickers">
      {stickers.map((sticker) => (
        <span key={sticker} title={stickerDetails[sticker].label} aria-label={stickerDetails[sticker].label} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-lg shadow-md backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:rotate-3">
          {stickerDetails[sticker].emoji}
        </span>
      ))}
    </div>
  );
}
