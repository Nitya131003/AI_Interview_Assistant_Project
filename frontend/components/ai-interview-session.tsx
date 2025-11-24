"use client"

import { useEffect, useRef, useState } from "react"
import { CameraFeed } from "./camera-feed"
import { VoiceAssistant } from "./voice-assistant"
import { MicButton } from "./mic-button"

export function AIInterviewSession() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [loading, setLoading] = useState(false)
  const [assistantText, setAssistantText] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || "http://127.0.0.1:5000"
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Helper: append a timestamp cache-buster to ensure fresh fetches
  const addCacheBuster = (url: string) => {
    const ts = Date.now()
    return url.includes("?") ? `${url}&t=${ts}` : `${url}?t=${ts}`
  }

  useEffect(() => {
    const setupAudioAnalyzer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyzer = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyzer)
        analyzerRef.current = analyzer

        // prefer an audio-only mime when available to ensure no video is recorded
        const audioMime1 = "audio/webm;codecs=opus"
        const audioMime2 = "audio/ogg;codecs=opus"
        const options: MediaRecorderOptions = {}
        if ((MediaRecorder as any).isTypeSupported) {
          if ((MediaRecorder as any).isTypeSupported(audioMime1)) options.mimeType = audioMime1
          else if ((MediaRecorder as any).isTypeSupported(audioMime2)) options.mimeType = audioMime2
        }
        const mediaRecorder = new MediaRecorder(stream, options)
        // store recorded chunks and wire handlers
        let chunks: Blob[] = []
        mediaRecorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data)
        }

        mediaRecorder.onstop = async () => {
          setLoading(true)
          setErrorMsg(null)
          setAssistantText(null)
          try {
            // force an audio/* type to avoid accidental video tracks in the saved file
            const preferredType = chunks[0]?.type && chunks[0].type.startsWith("audio/") ? chunks[0].type : (options.mimeType || "audio/webm")
            const blob = new Blob(chunks, { type: preferredType })
            chunks = []

            // create a File so Flask can see a filename
            const file = new File([blob], "voice.webm", { type: blob.type })

            const form = new FormData()
            form.append("audio", file)

            // send to backend (Flask runs on port 5000)
            const resp = await fetch(`${API_URL}/api/upload`, {
              method: "POST",
              body: form,
            })

            if (!resp.ok) {
              const err = await resp.json().catch(() => ({ message: "Unknown error" }))
              console.error("Upload failed:", resp.status, err)
              setErrorMsg(err?.message || `Upload failed (${resp.status})`)
              setLoading(false)
              return
            }

            const data = await resp.json()
            console.log("Upload response:", data)

            // if backend returned a TTS file path, play it (use cache-busting)
            if (data && data.tts_file) {
              const rawUrl = data.tts_file.startsWith("http") ? data.tts_file : `${API_URL}${data.tts_file}`
              const busted = addCacheBuster(rawUrl)
              try {
                const audio = new Audio(busted)
                audio.crossOrigin = "anonymous"
                await audio.play()
                setAssistantText(data.assistant_response || null)
                setAudioUrl(busted)
                setLoading(false)
                return
              } catch (e) {
                console.error("Failed to play TTS:", e)
                // fallthrough to show play button
                setAudioUrl(busted)
                setAssistantText(data.assistant_response || null)
                setErrorMsg("Playback blocked by browser. Tap Play to listen.")
              }
            }
          } catch (e) {
            console.error("Error processing recorded audio:", e)
            setErrorMsg((e as Error).message)
          } finally {
            setLoading(false)
          }
        }

        mediaRecorderRef.current = mediaRecorder
      } catch (error) {
        console.error("Error accessing microphone:", error)
      }
    }

    setupAudioAnalyzer()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const analyzeAudio = () => {
    if (!analyzerRef.current) return

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average / 255)

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
    }
  }

  const handleMicDown = () => {
    setIsRecording(true)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start()
    }
    analyzeAudio()
  }

  const handleMicUp = () => {
    setIsRecording(false)
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    setAudioLevel(0)
  }

  const playAssistantResponse = async () => {
    setErrorMsg(null)
    if (!audioUrl) {
      setErrorMsg("No assistant audio available to play.")
      return
    }
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
        audioRef.current.crossOrigin = "anonymous"
      } else {
        // Update src and reload to ensure we play the newest file
        audioRef.current.src = audioUrl
        audioRef.current.load()
      }
      await audioRef.current.play()
    } catch (e) {
      console.error("Play failed:", e)
      setErrorMsg("Playback failed. Check console for details.")
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* Header - Fixed at Top */}
      <div className="flex-shrink-0 border-b border-border bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Interviewer</h1>
            <p className="text-sm text-muted-foreground mt-1">Professional Interview Session</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500" : "bg-gray-400"}`} />
            <span className="text-sm font-medium text-foreground">{isRecording ? "Recording" : "Standby"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Static Layout */}
      <div className="flex-1 flex gap-0 bg-white overflow-hidden">
        {/* Left Section - Interview Question & History */}
        <div className="w-1/4 border-r border-border flex flex-col">
          <div className="p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Guidlines</h2>
              <div className="bg-muted border border-border rounded-lg p-6 min-h-32">
                <p className="text-sm text-foreground leading-relaxed">
                  Whenever you wish to speak and give response press and hold the mic.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Interview Info</h3>
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Candinate Name</p>
                  <p className="text-lg font-bold text-foreground mt-1">Nitya Jain</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Interview for Role</p>
                  <p className="text-lg font-bold text-foreground mt-1">Data Science</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Camera Feed */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <CameraFeed />
        </div>

        {/* Right Section - Voice Assistant & Mic */}
        <div className="w-1/3 border-l border-border flex flex-col">
          <div className="p-8 flex flex-col gap-6 h-full">
            <div>
              <h2 className="text-lg font-bold text-foreground text-center">Voice Assistant</h2>
              <p className="text-xs text-muted-foreground text-center mt-2">Press and hold to respond</p>
            </div>

            {/* Voice Visualizer */}
            <div className="flex-1 flex items-center justify-center min-h-40">
              <VoiceAssistant audioLevel={audioLevel} isRecording={isRecording} />
            </div>

            {/* Mic Button */}
            <div className="flex justify-center">
              <MicButton
                isRecording={isRecording}
                onMouseDown={handleMicDown}
                onMouseUp={handleMicUp}
                onTouchStart={handleMicDown}
                onTouchEnd={handleMicUp}
              />
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">
                {isRecording ? "Listening to your response..." : loading ? "Processing..." : "Ready for input"}
              </p>

              {assistantText && (
                <p className="mt-2 text-sm text-foreground">{assistantText}</p>
              )}

              {errorMsg && (
                <p className="mt-2 text-sm text-rose-600">{errorMsg}</p>
              )}

              {audioUrl && (
                <div className="mt-3 flex items-center justify-center">
                  <button
                    onClick={playAssistantResponse}
                    className="px-4 py-2 bg-primary text-white rounded-md shadow"
                  >
                    Play Response
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
