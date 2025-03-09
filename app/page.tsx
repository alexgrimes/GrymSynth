'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleNavigateToGenerate = () => {
    router.push('/generate');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#462A5A] via-[#32648C] to-[#1EA078] mb-8">
        GrymSynth
      </h1>
      <p className="text-xl mb-8 max-w-2xl text-center">
        A powerful text-to-audio synthesis platform with interactive visualization, MIDI generation capabilities, and touch gesture manipulation.
      </p>
      <button
        onClick={handleNavigateToGenerate}
        className="px-6 py-3 bg-gradient-to-r from-[#462A5A] via-[#32648C] to-[#1EA078] rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
      >
        Launch Text-to-Audio Generator
      </button>
    </div>
  );
}
