import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Skull, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-muted shadow-2xl">
        <Skull size={32} className="text-violet-soft" />
      </div>

      <div className="space-y-2">
        <span className="font-mono text-sm uppercase tracking-widest text-acid">
          Error 404 &bull; Entity Not Found
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-text">
          Lost in the Catacombs
        </h1>
        <blockquote className="font-epitaph text-2xl text-muted/80 max-w-md mx-auto pt-2">
          &ldquo;Here lies this page. It was conceived with grand ambition, but never reached the surface.&rdquo;
        </blockquote>
      </div>

      <div className="pt-4">
        <Button
          onClick={() => navigate('/vault')}
          className="bg-acid text-bg hover:bg-acid/90 font-mono text-xs font-bold px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(182,255,60,0.2)]"
        >
          <ArrowLeft size={16} className="mr-2" />
          Return to Necropolis Vault
        </Button>
      </div>
    </div>
  );
};
