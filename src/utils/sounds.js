let _audioCtx = null

function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed')
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return _audioCtx
}

export function playSound(type) {
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    switch (type) {
      case 'card':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(660, t)
        gain.gain.setValueAtTime(0.07, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        osc.start(t); osc.stop(t + 0.12)
        break
      case 'move':
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(340, t)
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.18)
        gain.gain.setValueAtTime(0.1, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc.start(t); osc.stop(t + 0.22)
        break
      case 'trap':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(440, t)
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.5)
        gain.gain.setValueAtTime(0.1, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc.start(t); osc.stop(t + 0.5)
        break
      case 'safe':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(780, t)
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25)
        gain.gain.setValueAtTime(0.09, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.start(t); osc.stop(t + 0.35)
        break
      case 'win':
        osc.type = 'sine'
        ;[523, 659, 784, 1047].forEach((f, i) => osc.frequency.setValueAtTime(f, t + i * 0.16))
        gain.gain.setValueAtTime(0.15, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
        osc.start(t); osc.stop(t + 0.9)
        break
      case 'home':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, t)
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.25)
        gain.gain.setValueAtTime(0.08, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
        osc.start(t); osc.stop(t + 0.25)
        break
    }
  } catch (_) { /* ignore audio errors */ }
}
