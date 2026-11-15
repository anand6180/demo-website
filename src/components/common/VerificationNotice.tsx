import { Info } from 'lucide-react';

interface VerificationNoticeProps {
  message: string;
}

export function VerificationNotice({ message }: VerificationNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/90">
      <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
