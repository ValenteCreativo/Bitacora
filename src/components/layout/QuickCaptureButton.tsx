"use client";

import { useState } from "react";
import QuickCapture from "@/components/blocks/QuickCapture";

export default function QuickCaptureButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-24 md:bottom-8 z-40 flex items-center justify-center w-12 h-12 bg-[#2c2416] text-[#f5f0e8] rounded-full shadow-lg hover:bg-[#3d3424] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c2416] focus:ring-offset-2"
        aria-label="Quick Capture"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Quick Capture Modal — the real functional one */}
      <QuickCapture
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onBlockCreated={() => {
          // Trigger a page refresh to show the new block
          window.location.reload();
        }}
      />
    </>
  );
}
