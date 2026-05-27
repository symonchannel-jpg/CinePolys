export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime)
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch {}
}
