// Piano with Original Colorful Design + Working Audio
class ColorfulPiano {
    constructor() {
        this.audioContext = null;
        this.oscillators = new Map();
        this.currentInstrument = 'piano';
        this.volume = 0.7;
        this.isAudioEnabled = false;
        
        // Keyboard mapping for 3 octaves
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

        // Instrument configurations
        this.instruments = {
            piano: {
                type: 'triangle',
                attack: 0.01,
                decay: 0.3,
                sustain: 0.4,
                release: 1.2,
                harmonics: [1, 0.5, 0.25]
            },
            bright: {
                type: 'square',
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 0.8,
                harmonics: [1, 0.7, 0.4]
            },
            electric: {
                type: 'sine',
                attack: 0.001,
                decay: 2,
                sustain: 0,
                release: 2,
                harmonics: [1, 0.4, 0.2, 0.1, 0.05]
            },
            organ: {
                type: 'sawtooth',
                attack: 0.01,
                decay: 0.1,
                sustain: 0.9,
                release: 0.1,
                harmonics: [1, 0.6, 0.4, 0.2]
            },
            bell: {
                type: 'triangle',
                attack: 0.001,
                decay: 1.5,
                sustain: 0.1,
                release: 0.5,
                harmonics: [1, 0.8, 0.3, 0.1]
            },
            synth: {
                type: 'sawtooth',
                attack: 0.005,
                decay: 0.3,
                sustain: 0.4,
                release: 1.2,
                harmonics: [1, 0.5, 0.25, 0.125]
            },
            guitar: {
                type: 'triangle',
                attack: 0.01,
                decay: 1,
                sustain: 0.1,
                release: 2,
                harmonics: [1, 0.6, 0.3, 0.1]
            },
            flute: {
                type: 'sine',
                attack: 0.1,
                decay: 0.2,
                sustain: 0.8,
                release: 0.3,
                harmonics: [1, 0.3, 0.1]
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
            console.log('Colorful Piano initialized successfully!');
            
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
            
            // ESC to stop all
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

    createComplexTone(frequency, instrument) {
        const config = this.instruments[instrument];
        const oscillators = [];
        const gainNodes = [];
        const masterGain = this.audioContext.createGain();

        // Create harmonics for richer sound
        config.harmonics.forEach((amplitude, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(frequency * (index + 1), this.audioContext.currentTime);
            oscillator.type = config.type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillators.push(oscillator);
            gainNodes.push({ node: gainNode, amplitude });
        });

        masterGain.connect(this.audioContext.destination);

        return { oscillators, gainNodes, masterGain, config };
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
            const { oscillators, gainNodes, masterGain, config } = this.createComplexTone(freq, this.currentInstrument);
            
            // Set master volume
            masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            masterGain.gain.linearRampToValueAtTime(
                this.volume * 0.3, 
                this.audioContext.currentTime + config.attack
            );

            // Start all oscillators and set their individual gains
            const currentTime = this.audioContext.currentTime;
            oscillators.forEach((oscillator, index) => {
                const gainNode = gainNodes[index];
                
                // Set harmonic volume
                gainNode.node.gain.setValueAtTime(0, currentTime);
                gainNode.node.gain.linearRampToValueAtTime(
                    gainNode.amplitude, 
                    currentTime + config.attack
                );
                
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
            const { oscillators, gainNodes, masterGain, config } = this.oscillators.get(note);
            
            // Fade out
            const currentTime = this.audioContext.currentTime;
            masterGain.gain.cancelScheduledValues(currentTime);
            masterGain.gain.setValueAtTime(masterGain.gain.value, currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.01, currentTime + config.release);
            
            // Stop all oscillators
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
                masterGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
                
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

// Initialize when page loads
let colorfulPiano;

window.addEventListener('load', () => {
    colorfulPiano = new ColorfulPiano();
    
    // Expose to global scope for debugging
    window.piano = colorfulPiano;
    
    console.log('🎹 Colorful Piano loaded!');
    console.log('Features: 3 octaves, 8 instruments, colorful xylophone design');
    console.log('Controls: Mouse/touch click keys, or use keyboard mapping');
    console.log('Keyboard: Q-U (octave 2), Z-M (octave 3), I-] (octave 4)');
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && colorfulPiano) {
        colorfulPiano.stopAllNotes();
    }
});