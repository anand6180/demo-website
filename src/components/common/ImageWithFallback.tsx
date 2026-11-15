import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaAssets';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function ImageWithFallback({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (failed || !resolved) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#121826] via-[#0E131D] to-[#090B10] text-slate-400 p-6 text-center"
      >
        <Gamepad2 className="w-7 h-7 text-cyan-400/70" aria-hidden="true" />
        <span className="text-xs text-slate-400 max-w-[22ch]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
