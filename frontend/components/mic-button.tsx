"use client"

import { Mic } from "lucide-react"

interface MicButtonProps {
  isRecording: boolean
  onMouseDown: () => void
  onMouseUp: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
}

export function MicButton({ isRecording, onMouseDown, onMouseUp, onTouchStart, onTouchEnd }: MicButtonProps) {
  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-colors font-serif ${
        isRecording
          ? "bg-red-500 border-red-600 text-white shadow-2xl"
          : "bg-primary border-primary text-white shadow-lg hover:shadow-2xl"
      }`}
      title="Press and hold to record your response"
    >
      <Mic size={56} />
    </button>
  )
}
