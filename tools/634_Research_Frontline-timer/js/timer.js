(() => {
    class PresentationTimer {
        constructor(options) {
            this.presentationDuration = options.presentationDuration;
            this.defaultMcDuration = options.defaultMcDuration;
            this.timeLeft = options.defaultMcDuration;
            this.phase = 'mc';
            this.dataUrl = options.dataUrl;
            this.displayEl = options.displayEl;
            this.progressEl = options.progressEl;
            this.phaseLabelEl = options.phaseLabelEl;
            this.subLabelEl = options.subLabelEl;
            this.currentDayLabelEl = options.currentDayLabelEl;
            this.currentIdEl = options.currentIdEl;
            this.currentTitleEl = options.currentTitleEl;
            this.currentSubtitleEl = options.currentSubtitleEl;
            this.currentPresenterEl = options.currentPresenterEl;
            this.currentAffiliationEl = options.currentAffiliationEl;
            this.nextIdEl = options.nextIdEl;
            this.nextTitleEl = options.nextTitleEl;
            this.nextSubtitleEl = options.nextSubtitleEl;
            this.nextPresenterEl = options.nextPresenterEl;
            this.stopBtn = options.stopBtn;
            this.resetBtn = options.resetBtn;
            this.forwardBtn = options.forwardBtn;
            this.backBtn = options.backBtn;
            this.overlayEl = options.overlayEl;
            this.startBtn = options.startBtn;
            this.audio = options.audio;
            this.schedule = [];
            this.currentIndex = 0;
            this.timerId = null;
            this.oneMinuteAlertTimeoutId = null;
            this.isRunning = false;
            this.isLoaded = false;
        }

        async init() {
            this.bindEvents();
            this.renderLoadingState();
            try {
                await this.loadSchedule();
                this.isLoaded = true;
                this.setToInitialMc();
                this.render();
            } catch (error) {
                console.error(error);
                this.renderError('researches.json の読み込みに失敗しました');
            } finally {
                this.syncControls();
            }
        }

        bindEvents() {
            this.startBtn.addEventListener('click', () => {
                this.audio.initAudio();
                this.overlayEl.hidden = true;
                this.overlayEl.style.display = 'none';
                this.start();
            });

            this.stopBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            });

            this.resetBtn.addEventListener('click', () => {
                this.reset();
            });

            this.forwardBtn.addEventListener('click', () => {
                this.seek(-10);
            });

            this.backBtn.addEventListener('click', () => {
                this.seek(10);
            });
        }

        start() {
            if (!this.isLoaded || this.isRunning || this.schedule.length === 0) {
                this.syncControls();
                return;
            }

            this.isRunning = true;
            this.timerId = window.setInterval(() => this.tick(), 1000);
            this.render();
            this.syncControls();
        }

        pause() {
            if (this.timerId) {
                window.clearInterval(this.timerId);
                this.timerId = null;
            }
            this.isRunning = false;
            this.syncControls();
        }

        reset() {
            this.pause();
            this.currentIndex = 0;
            this.setToInitialMc();
            this.render();
        }

        setToInitialMc() {
            this.phase = 'mc';
            this.timeLeft = this.getCurrentMcDuration();
        }

        seek(delta) {
            if (!this.isLoaded) {
                return;
            }

            const phaseDuration = this.getPhaseDuration();
            this.timeLeft = Math.max(0, Math.min(phaseDuration, this.timeLeft + delta));
            this.displayTransitionHints();
            if (this.timeLeft === 0) {
                this.completePhase();
                return;
            }
            this.render();
        }

        tick() {
            if (!this.isRunning) {
                return;
            }

            this.timeLeft = Math.max(0, this.timeLeft - 1);
            this.displayTransitionHints();
            this.render();

            if (this.timeLeft === 0) {
                this.completePhase();
            }
        }

        displayTransitionHints() {
            if (this.phase === 'presentation' && this.timeLeft === 60) {
                this.triggerOneMinuteAlert();
            }

            if (this.phase === 'presentation' && this.timeLeft === 10) {
                this.audio.playTenSecondsSound();
            }
        }

        triggerOneMinuteAlert() {
            this.displayEl.classList.remove('one-minute-alert');

            if (this.oneMinuteAlertTimeoutId) {
                window.clearTimeout(this.oneMinuteAlertTimeoutId);
            }

            // Reflow to reliably restart the animation when re-triggered.
            void this.displayEl.offsetWidth;
            this.displayEl.classList.add('one-minute-alert');

            this.oneMinuteAlertTimeoutId = window.setTimeout(() => {
                this.displayEl.classList.remove('one-minute-alert');
                this.oneMinuteAlertTimeoutId = null;
            }, 900);
        }

        async loadSchedule() {
            const response = await fetch(this.dataUrl, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to load schedule: ${response.status}`);
            }

            const data = await response.json();
            const presentations = Array.isArray(data.presentations) ? data.presentations : [];
            this.schedule = presentations
                .slice()
                .sort((left, right) => {
                    const leftDay = Number(left.day) || 0;
                    const rightDay = Number(right.day) || 0;
                    if (leftDay !== rightDay) {
                        return leftDay - rightDay;
                    }

                    return String(left.time || '').localeCompare(String(right.time || ''));
                });
        }

        completePhase() {
            if (this.phase === 'presentation') {
                this.audio.playFinishSound();

                if (this.currentIndex >= this.schedule.length - 1) {
                    this.pause();
                    return;
                }

                // 発表終了直後のMCに入るタイミングで、表示対象を次の発表へ送る。
                this.currentIndex += 1;
                this.phase = 'mc';
                this.timeLeft = this.getCurrentMcDuration();
                this.render();
                return;
            }

            this.phase = 'presentation';
            this.timeLeft = this.presentationDuration;
            this.audio.playStartSound();
            this.render();
        }

        getPhaseDuration() {
            return this.phase === 'presentation' ? this.presentationDuration : this.getCurrentMcDuration();
        }

        parseDurationValue(value) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                return Math.max(1, Math.floor(value));
            }

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (/^\d+$/.test(trimmed)) {
                    return Math.max(1, Number.parseInt(trimmed, 10));
                }

                const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
                if (match) {
                    const minutes = Number.parseInt(match[1], 10);
                    const seconds = Number.parseInt(match[2], 10);
                    if (seconds >= 0 && seconds < 60) {
                        return minutes * 60 + seconds;
                    }
                }
            }

            return null;
        }

        getCurrentMcDuration() {
            const current = this.schedule[this.currentIndex];
            if (!current) {
                return this.defaultMcDuration;
            }

            const override =
                this.parseDurationValue(current.mcSecondsBefore)
                ?? this.parseDurationValue(current.mc_seconds_before)
                ?? this.parseDurationValue(current.mcBefore)
                ?? this.parseDurationValue(current.mc_before);

            return override ?? this.defaultMcDuration;
        }

        formatTime(value, duration) {
            const clamped = Math.max(0, Math.min(duration, value));
            const minutes = Math.floor(clamped / 60);
            const seconds = clamped % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        normalizeText(value) {
            if (value === null || value === undefined) {
                return '';
            }

            if (value === 'Comming soon...') {
                return value;
            }

            const text = String(value).trim();
            return text;
        }

        escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');
        }

        isTeacherGrade(grade) {
            return this.normalizeText(grade) === '教員';
        }

        isObGrade(grade) {
            return this.normalizeText(grade).toUpperCase() === 'OB';
        }

        buildRoleLabel(presentation) {
            const grade = this.normalizeText(presentation?.grade);
            const affiliation = this.normalizeText(presentation?.affiliation);

            if (this.isTeacherGrade(grade)) {
                return affiliation ? `${affiliation}教員` : '教員';
            }

            if (this.isObGrade(grade)) {
                return affiliation ? `${affiliation}OB` : 'OB';
            }

            return grade;
        }

        buildPresenterNameHtml(presentation) {
            const name = this.normalizeText(presentation?.presenter);
            if (!name) {
                return '';
            }

            const escapedName = this.escapeHtml(name);
            if (this.isTeacherGrade(presentation?.grade)) {
                return `${escapedName}<span class="name-honorific">先生</span>`;
            }

            if (this.isObGrade(presentation?.grade)) {
                return `${escapedName}<span class="name-honorific">さん</span>`;
            }

            return escapedName;
        }

        buildPresenterHtml(presentation) {
            const nameHtml = this.buildPresenterNameHtml(presentation);
            const roleLabel = this.buildRoleLabel(presentation);

            if (!nameHtml && !roleLabel) {
                return '';
            }

            if (!nameHtml) {
                return this.escapeHtml(roleLabel);
            }

            if (!roleLabel) {
                return nameHtml;
            }

            return `${nameHtml}／${this.escapeHtml(roleLabel)}`;
        }

        buildDisplayBlock(titleTarget, subtitleTarget, value) {
            const title = this.normalizeText(value?.title);
            const subtitle = this.normalizeText(value?.subtitle);

            titleTarget.textContent = title;
            subtitleTarget.textContent = subtitle;
            subtitleTarget.hidden = !subtitle;
        }

        renderLoadingState() {
            this.displayEl.textContent = this.formatTime(this.defaultMcDuration, this.defaultMcDuration);
            this.displayEl.dataset.text = this.formatTime(this.defaultMcDuration, this.defaultMcDuration);
            this.progressEl.style.width = '0%';
            this.phaseLabelEl.textContent = 'MC';
            this.subLabelEl.textContent = '次の発表まで';
            this.currentDayLabelEl.textContent = 'LOADING';
            this.currentIdEl.textContent = '...';
            this.currentTitleEl.textContent = 'researches.json 読み込み中';
            this.currentSubtitleEl.hidden = true;
            this.currentPresenterEl.textContent = '';
            this.currentAffiliationEl.textContent = '';
            this.nextIdEl.textContent = '...';
            this.nextTitleEl.textContent = '';
            this.nextSubtitleEl.hidden = true;
            this.nextPresenterEl.textContent = '';
        }

        renderPresentationCard(prefix, presentation, isNext = false) {
            const idEl = isNext ? this.nextIdEl : this.currentIdEl;
            const titleEl = isNext ? this.nextTitleEl : this.currentTitleEl;
            const subtitleEl = isNext ? this.nextSubtitleEl : this.currentSubtitleEl;
            const presenterEl = isNext ? this.nextPresenterEl : this.currentPresenterEl;

            if (!presentation) {
                idEl.textContent = '—';
                titleEl.textContent = '終了';
                subtitleEl.textContent = '';
                subtitleEl.hidden = true;
                presenterEl.textContent = '';
                if (!isNext) {
                    this.currentAffiliationEl.textContent = '';
                }
                return;
            }

            idEl.textContent = this.normalizeText(presentation.id);
            this.buildDisplayBlock(titleEl, subtitleEl, presentation);
            presenterEl.innerHTML = this.buildPresenterHtml(presentation);

            if (!isNext) {
                this.currentAffiliationEl.textContent = this.normalizeText(presentation.affiliation);
                const day = this.normalizeText(presentation.day);
                this.currentDayLabelEl.textContent = day ? `DAY ${day}` : 'DAY';
            }
        }

        render() {
            const phaseDuration = this.getPhaseDuration();
            const clockText = this.formatTime(this.timeLeft, phaseDuration);
            const percent = ((phaseDuration - this.timeLeft) / phaseDuration) * 100;
            const current = this.schedule[this.currentIndex];
            const next = this.schedule[this.currentIndex + 1];

            this.displayEl.textContent = clockText;
            this.displayEl.dataset.text = clockText;
            this.progressEl.style.width = `${percent}%`;
            this.displayEl.classList.toggle('emergency', this.timeLeft <= 10);

            if (this.phase === 'presentation') {
                this.phaseLabelEl.textContent = '発表中';
                this.subLabelEl.textContent = '発表残り';
            } else {
                this.phaseLabelEl.textContent = 'MC';
                this.subLabelEl.textContent = '次の発表まで';
            }

            this.renderPresentationCard('current', current, false);
            this.renderPresentationCard('next', next, true);
            this.syncControls();
        }

        syncControls() {
            const hasSchedule = this.schedule.length > 0;
            this.stopBtn.textContent = this.isRunning ? 'PAUSE' : 'RUN';
            this.startBtn.disabled = !hasSchedule;
            this.resetBtn.disabled = !hasSchedule;
            this.forwardBtn.disabled = !hasSchedule;
            this.backBtn.disabled = !hasSchedule;
        }

        renderError(message) {
            this.displayEl.textContent = '--:--';
            this.displayEl.dataset.text = '--:--';
            this.progressEl.style.width = '0%';
            this.phaseLabelEl.textContent = 'ERROR';
            this.subLabelEl.textContent = '読み込み失敗';
            this.currentDayLabelEl.textContent = 'ERROR';
            this.currentIdEl.textContent = '...';
            this.currentTitleEl.textContent = message;
            this.currentSubtitleEl.hidden = true;
            this.currentPresenterEl.textContent = '';
            this.currentAffiliationEl.textContent = '';
            this.nextIdEl.textContent = '...';
            this.nextTitleEl.textContent = '';
            this.nextSubtitleEl.hidden = true;
            this.nextPresenterEl.textContent = '';
        }

        pause() {
            if (this.timerId) {
                window.clearInterval(this.timerId);
                this.timerId = null;
            }
            this.isRunning = false;
            this.syncControls();
        }
    }

    window.PresentationTimer = PresentationTimer;
})();