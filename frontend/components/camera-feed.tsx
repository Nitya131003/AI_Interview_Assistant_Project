"use client"

import { useEffect, useRef } from "react"

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-gray-100 border border-border rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 px-6 py-4">
        <p className="text-base font-semibold text-white">Candidate Camera</p>
        <p className="text-xs text-white/90">Live Feed</p>
      </div>
    </div>
  )
}
