"use client"

import { useMemo } from "react"

interface VoiceAssistantProps {
  audioLevel: number
  isRecording: boolean
}

export function VoiceAssistant({ audioLevel, isRecording }: VoiceAssistantProps) {
  const bars = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const baseHeight = 20
      const animatedHeight = baseHeight + audioLevel * 60
      return {
        id: i,
        height: isRecording ? animatedHeight : baseHeight,
      }
    })
  }, [audioLevel, isRecording])

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full h-40 flex items-end justify-center gap-2 bg-muted rounded-lg p-6 border border-border">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="flex-1 bg-primary rounded-full transition-none"
            style={{
              height: `${bar.height}px`,
              opacity: isRecording ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500" : "bg-gray-300"}`} />
        <span className="text-sm font-medium text-muted-foreground">{isRecording ? "Listening..." : "Idle"}</span>
      </div>
    </div>
  )
}
