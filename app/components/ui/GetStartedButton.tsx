import { ChevronRight } from 'lucide-react';
import { showLoginDialog } from '~/lib/stores/auth';

export function GetStartedButton() {
  return (
    <button
      onClick={() => showLoginDialog.set(true)}
      className="group relative overflow-hidden inline-flex items-center justify-center h-9 px-4 rounded-md bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium tracking-wide transition-colors cursor-pointer"
    >
      <span className="mr-7 transition-opacity duration-500 group-hover:opacity-0">
        Get Started
      </span>
      <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/10 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
        <ChevronRight size={14} strokeWidth={2} aria-hidden="true" className="text-white" />
      </i>
    </button>
  );
}
