// src/pages/Loading.tsx
import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bgColor">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="mt-4 text-secondary font-medium">Loading...</p>
    </div>
  );
};

export default Loading;