"use client"

let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gain: GainNode | null = null
let vibrationInterval: number | null = null

function getAudioContext() {
  if (audioContext) return audioContext

  const AudioContextClass =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext
      }
    ).webkitAudioContext

  if (!AudioContextClass) return null

  audioContext = new AudioContextClass()
  return audioContext
}

export async function prepareWebTimerAlarm() {
  const context = getAudioContext()

  if (context?.state === "suspended") {
    try {
      await context.resume()
    } catch {
      // Alarm will still use vibration when available.
    }
  }
}

export async function startWebTimerAlarm() {
  stopWebTimerAlarm()

  const context = getAudioContext()

  if (context) {
    try {
      if (context.state === "suspended") {
        await context.resume()
      }

      oscillator = context.createOscillator()
      gain = context.createGain()

      oscillator.type = "square"
      oscillator.frequency.value = 880
      gain.gain.value = 0.08

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
    } catch {
      oscillator = null
      gain = null
    }
  }

  if ("vibrate" in navigator) {
    navigator.vibrate([500, 250, 500, 250, 1000])

    vibrationInterval = window.setInterval(() => {
      navigator.vibrate([500, 250, 500, 250, 1000])
    }, 3500)
  }
}

export function stopWebTimerAlarm() {
  if (oscillator) {
    try {
      oscillator.stop()
    } catch {
      // Already stopped.
    }

    oscillator.disconnect()
    oscillator = null
  }

  if (gain) {
    gain.disconnect()
    gain = null
  }

  if (vibrationInterval !== null) {
    window.clearInterval(vibrationInterval)
    vibrationInterval = null
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(0)
  }
}
