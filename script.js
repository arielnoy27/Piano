// Classic Piano with Warm, Natural Sound
class ClassicPiano {
    constructor() {
        this.audioContext = null;
        this.oscillators = new Map();
        this.currentInstrument = 'piano';
        this.volume = 0.7;
        this.isAudioEnabled = false;
        
        // Keyboard mapping
        this.keyboardMap = {
            // Octave 2 (Lower)
            'q': 'C2', '2': 'C#2', 'w': 'D2', '3': 'D#2', 'e': 'E2',
            'r': 'F2', '5': 'F#2', 't': 'G2', '6': 'G#2', 'y': 'A2', '7': 'A#2', 'u': 'B2',
            
            // Octave 3 (Middle)
            'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3',
            'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3', 'j': 'A#3', 'm': 'B3',
            
            // Octave 4 (Higher)
            'i': 'C4', '9': 'C#4', 'o': 'D4', '0': 'D#4', 'p': 'E4',
            '[': 'F4', '=': 'F#4', ']': 'G4', '\\': 'G#4'
        };

        // Classic instrument configurations - focused on traditional piano sound
        this.instruments = {
            piano: {
                oscillators: [
                    { type: 'triangle', detune: 0, gain: 0.6 },
                    { type: 'sine', detune: 0, gain: 0.3 },
                    { type: 'triangle', detune: 1200, gain: 0.15 } // octave higher, quieter
                ],
                attack: 0.02,
                decay: 0.3,
                sustain: 0.7,
                release: 1.2,
                filterFreq: 2800,
                filterType: 'lowpass'
            },
            bright: {
                oscillators: [
                    { type: 'triangle', detune: 0, gain: 0.5 },
                    { type: 'square', detune: 0, gain: 0.2 },
                    { type: 'sine', detune: 1200, gain: 0.2 }
                ],
                attack: 0.01,
                decay: 0.2,
                sustain: 0.5,
                release: 0.8,
                filterFreq: 3500,
                filterType: 'lowpass'
            },
            electric: {
                oscillators: [
                    { type: 'sine', detune: 0, gain: 0.8 },
                    { type: 'triangle', detune: 700, gain: 0.2 }
                ],
                attack: 0.01,
                decay: 1.5,
                sustain: 0.1,
                release: 2.0,
                filterFreq: 2200,
                filterType: 'lowpass'
            },
            organ: {
                oscillators: [
                    { type: 'sine', detune: 0, gain: 0.5 },
                    { type: 'sine', detune: 1200, gain: 0.3 },
                    { type: 'sine', detune: 1900, gain: 0.2 }
                ],
                attack: 0.05,
                decay: 0.1,
                sustain: 0.9,
                release: 0.2,
                filterFreq: 4000,
                filterType: 'lowpass'
            },
            bell: {
                oscillators: [
                    { type: 'sine', detune: 0, gain: 0.7 },
                    { type: 'sine', detune: 1700, gain: 0.3 }
                ],
                attack: 0.01,
                decay: 2.0,
                sustain: 0.1,
                release: 3.0,
                filterFreq: 5000,
                filterType: 'lowpass'
            },
            synth: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, gain: 0.6 },
                    { type: 'square', detune: -7, gain: 0.3 }
                ],
                attack: 0.02,
                decay: 0.3,
                sustain: 0.6,
                release: 1.0,
                filterFreq: 3000,
                filterType: 'lowpass'
            },
            guitar: {
                oscillators: [
                    { type: 'triangle', detune: 0, gain: 0.6 },
                    { type: 'sine', detune: 1200, gain: 0.25 },
                    { type: 'triangle', detune: -1200, gain: 0.15 }
                ],
                attack: 0.02,
                decay: 1.0,
                sustain: 0.3,
                release: 2.0,
                filterFreq: 2500,
                filterType: 'lowpass'
            },
            flute: {
                oscillators: [
                    { type: 'sine', detune: 0, gain: 0.8 },
                    { type: 'triangle', detune: 1200, gain: 0.15 }
                ],
                attack: 0.1,
                decay: 0.2,
                sustain: 0.8,
                release: 0.4,
                filterFreq: 3500,
                filterType: 'lowpass'
            }
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isAudioEnabled = true;
            this.updateAudioStatus();
            console.log('Classic Piano initialized successfully!');
            
            return true;
        } catch (error) {
            console.error('Audio Context Error:', error);
            return false;
        }
    }

    updateAudioStatus() {
        const statusElement = document.getElementById('audioStatus');
        if (statusElement) {
            if (this.isAudioEnabled) {
                statusElement.textContent = '🔊 Audio Ready - Start Playing!';
                statusElement.classList.add('enabled');
            } else {
                statusElement.textContent = '🔇 Click anywhere to enable audio';
                statusElement.classList.remove('enabled');
            }
        }
    }

    setupEventListeners() {
        // Instrument selector
        const instrumentSelect = document.getElementById('instrumentSelect');
        if (instrumentSelect) {
            instrumentSelect.addEventListener('change', (e) => {
                this.currentInstrument = e.target.value;
                console.log(`Instrument changed to: ${this.currentInstrument}`);
            });
        }

        // Piano keys - mouse events
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(e.target);
            });
            
            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.stopNote(e.target);
            });
            
            key.addEventListener('mouseleave', (e) => {
                this.stopNote(e.target);
            });

            // Touch events
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playNote(e.target);
            }, { passive: false });
            
            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopNote(e.target);
            }, { passive: false });
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            
            if (e.key === 'Escape') {
                this.stopAllNotes();
                return;
            }
            
            const note = this.keyboardMap[e.key.toLowerCase()];
            if (note && !this.oscillators.has(note)) {
                const keyElement = document.querySelector(`[data-note="${note}"]`);
                if (keyElement) {
                    this.playNote(keyElement);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const note = this.keyboardMap[e.key.toLowerCase()];
            if (note) {
                const keyElement = document.querySelector(`[data-note="${note}"]`);
                if (keyElement) {
                    this.stopNote(keyElement);
                }
            }
        });

        // Auto-enable audio on first interaction
        document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
        document.addEventListener('keydown', this.initAudioContext.bind(this), { once: true });
    }

    createClassicTone(frequency, instrument) {
        const config = this.instruments[instrument];
        const oscillators = [];
        const gainNodes = [];
        
        // Create master gain for this note
        const masterGain = this.audioContext.createGain();
        masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        
        // Create filter for warmer sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = config.filterType;
        filter.frequency.setValueAtTime(config.filterFreq, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        // Create oscillators based on configuration
        config.oscillators.forEach((oscConfig, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set frequency with detune
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.detune.setValueAtTime(oscConfig.detune, this.audioContext.currentTime);
            oscillator.type = oscConfig.type;
            
            // Set gain
            gainNode.gain.setValueAtTime(oscConfig.gain, this.audioContext.currentTime);
            
            // Connect: oscillator -> gainNode -> masterGain
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillators.push(oscillator);
            gainNodes.push(gainNode);
        });
        
        // Connect through filter to destination
        masterGain.connect(filter);
        filter.connect(this.audioContext.destination);
        
        return { oscillators, gainNodes, masterGain, filter, config };
    }

    async playNote(keyElement) {
        if (!keyElement) return;

        if (!this.audioContext) {
            const success = await this.initAudioContext();
            if (!success) return;
        }

        const note = keyElement.getAttribute('data-note');
        const freq = parseFloat(keyElement.getAttribute('data-freq'));
        
        if (!note || !freq) return;

        // Stop existing note if playing
        if (this.oscillators.has(note)) {
            this.stopNote(keyElement);
        }

        try {
            const { oscillators, gainNodes, masterGain, config } = this.createClassicTone(freq, this.currentInstrument);
            
            // Classic piano envelope
            const currentTime = this.audioContext.currentTime;
            const baseVolume = this.volume * 0.3;
            
            // Attack
            masterGain.gain.setValueAtTime(0, currentTime);
            masterGain.gain.linearRampToValueAtTime(baseVolume, currentTime + config.attack);
            
            // Decay to sustain
            masterGain.gain.exponentialRampToValueAtTime(
                baseVolume * config.sustain, 
                currentTime + config.attack + config.decay
            );
            
            // Start all oscillators
            oscillators.forEach(oscillator => {
                oscillator.start(currentTime);
            });
            
            // Store reference
            this.oscillators.set(note, { oscillators, gainNodes, masterGain, config });
            
            // Visual feedback
            keyElement.classList.add('pressed');
            
            console.log(`Playing ${note} (${freq}Hz) with ${this.currentInstrument}`);
            
        } catch (error) {
            console.error('Play Note Error:', error);
        }
    }

    stopNote(keyElement) {
        if (!keyElement) return;

        const note = keyElement.getAttribute('data-note');
        if (!note || !this.oscillators.has(note)) return;

        try {
            const { oscillators, masterGain, config } = this.oscillators.get(note);
            
            // Classic piano release
            const currentTime = this.audioContext.currentTime;
            
            masterGain.gain.cancelScheduledValues(currentTime);
            masterGain.gain.setValueAtTime(masterGain.gain.value, currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.001, currentTime + config.release);
            
            // Stop oscillators
            oscillators.forEach(oscillator => {
                oscillator.stop(currentTime + config.release);
            });
            
            // Clean up
            this.oscillators.delete(note);
            
            // Remove visual feedback
            keyElement.classList.remove('pressed');
            
        } catch (error) {
            console.error('Stop Note Error:', error);
        }
    }

    stopAllNotes() {
        this.oscillators.forEach((noteData, note) => {
            try {
                const { oscillators, masterGain } = noteData;
                const currentTime = this.audioContext.currentTime;
                
                masterGain.gain.cancelScheduledValues(currentTime);
                masterGain.gain.setValueAtTime(masterGain.gain.value, currentTime);
                masterGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
                
                oscillators.forEach(oscillator => {
                    oscillator.stop(currentTime + 0.1);
                });
            } catch (error) {
                console.error('Error stopping oscillator:', error);
            }
        });
        
        this.oscillators.clear();
        
        // Remove all visual feedback
        document.querySelectorAll('.key.pressed').forEach(key => {
            key.classList.remove('pressed');
        });
        
        console.log('All notes stopped');
    }
}

// Initialize the classic piano
let classicPiano;

window.addEventListener('load', () => {
    classicPiano = new ClassicPiano();
    
    // Expose to global scope
    window.piano = classicPiano;
    
    console.log('🎹 Classic Piano loaded!');
    console.log('Features: Warm, natural piano sound with classic envelope');
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && classicPiano) {
        classicPiano.stopAllNotes();
    }
});
