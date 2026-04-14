(() => {
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function getFmPreset(type) {
        switch (type) {
            case 'square':
                return { modRatio: 2.0, modIndex: 230, attack: 0.005, release: 0.24, harmonics: 0.22 };
            case 'triangle':
                return { modRatio: 1.5, modIndex: 140, attack: 0.03, release: 0.45, harmonics: 0.18 };
            case 'sawtooth':
                return { modRatio: 2.7, modIndex: 320, attack: 0.01, release: 0.9, harmonics: 0.35 };
            default:
                return { modRatio: 1.9, modIndex: 180, attack: 0.02, release: 0.35, harmonics: 0.2 };
        }
    }

    function playSound(freq = 440, type = 'sine', duration = 0.5) {
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const safeDuration = Math.max(0.08, duration);
        const preset = getFmPreset(type);

        const master = audioCtx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.22, now + preset.attack);
        master.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration + preset.release);

        const carrier = audioCtx.createOscillator();
        const mod = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();

        carrier.type = 'sine';
        mod.type = 'sine';

        carrier.frequency.setValueAtTime(freq, now);
        mod.frequency.setValueAtTime(freq * preset.modRatio, now);

        modGain.gain.setValueAtTime(preset.modIndex, now);
        modGain.gain.exponentialRampToValueAtTime(1, now + safeDuration * 0.9);

        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(freq / 2, now);
        subGain.gain.setValueAtTime(preset.harmonics, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration + preset.release);

        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(master);
        sub.connect(subGain);
        subGain.connect(master);
        master.connect(audioCtx.destination);

        mod.start(now);
        carrier.start(now);
        sub.start(now);

        const stopAt = now + safeDuration + preset.release;
        mod.stop(stopAt);
        carrier.stop(stopAt);
        sub.stop(stopAt);
    }

    function createSimpleReverbImpulse(context, duration = 0.7, decay = 2.2) {
        const sampleRate = context.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const impulse = context.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / length;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
            }
        }

        return impulse;
    }

    function playStartSound() {
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const duration = 0.5;

        const osc = audioCtx.createOscillator();
        const dryGain = audioCtx.createGain();
        const reverbSend = audioCtx.createGain();
        const convolver = audioCtx.createConvolver();
        const wetGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);

        dryGain.gain.setValueAtTime(0.0001, now);
        dryGain.gain.exponentialRampToValueAtTime(0.22, now + 0.06);
        dryGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.12);

        reverbSend.gain.setValueAtTime(0.2, now);
        convolver.buffer = createSimpleReverbImpulse(audioCtx, 0.75, 2.4);

        wetGain.gain.setValueAtTime(0.16, now);
        wetGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.5);

        osc.connect(dryGain);
        dryGain.connect(audioCtx.destination);

        osc.connect(reverbSend);
        reverbSend.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.55);
    }

    function playTenSecondsSound() {
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        // 木琴っぽい短い立ち上がりと急減衰
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
    }

    function playFinishSound() {
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const notes = [440, 554, 659];
        const master = audioCtx.createGain();

        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        master.connect(audioCtx.destination);

        notes.forEach((freq) => {
            const osc = audioCtx.createOscillator();
            const voice = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            voice.gain.setValueAtTime(0.0001, now);
            voice.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
            voice.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

            osc.connect(voice);
            voice.connect(master);

            osc.start(now);
            osc.stop(now + 2.05);
        });
    }

    window.AudioEngine = {
        initAudio,
        playSound,
        playStartSound,
        playTenSecondsSound,
        playFinishSound
    };
})();
