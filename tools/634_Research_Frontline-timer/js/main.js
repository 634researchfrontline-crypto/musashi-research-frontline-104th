(() => {
    const presentationDuration = 394;
    const defaultMcDuration = 86;
    const dataUrl = '../../data/researches.json';

    const start = () => {
        const display = document.getElementById('timer-display');
        const progress = document.getElementById('progress-fill');
        const phaseLabel = document.getElementById('timer-phase-label');
        const subLabel = document.getElementById('timer-sub-label');
        const currentDayLabel = document.getElementById('current-day-label');
        const currentId = document.getElementById('current-id');
        const currentTitle = document.getElementById('current-title');
        const currentSubtitle = document.getElementById('current-subtitle');
        const currentPresenter = document.getElementById('current-presenter');
        const currentAffiliation = document.getElementById('current-affiliation');
        const nextId = document.getElementById('next-id');
        const nextTitle = document.getElementById('next-title');
        const nextSubtitle = document.getElementById('next-subtitle');
        const nextPresenter = document.getElementById('next-presenter');
        const stopBtn = document.getElementById('btn-stop');
        const resetBtn = document.getElementById('btn-reset');
        const forwardBtn = document.getElementById('btn-forward');
        const backBtn = document.getElementById('btn-back');
        const jumpPresentationSelect = document.getElementById('select-target-presentation');
        const jumpPresentationBtn = document.getElementById('btn-jump-presentation');
        const jumpSectionSelect = document.getElementById('select-target-section');
        const jumpSectionBtn = document.getElementById('btn-jump-section');
        const overlayEl = document.getElementById('overlay');
        const startBtn = document.getElementById('start-btn');

        if (!display || !progress || !phaseLabel || !subLabel || !currentDayLabel || !currentId || !currentTitle || !currentSubtitle || !currentPresenter || !currentAffiliation || !nextId || !nextTitle || !nextSubtitle || !nextPresenter || !stopBtn || !resetBtn || !forwardBtn || !backBtn || !jumpPresentationSelect || !jumpPresentationBtn || !jumpSectionSelect || !jumpSectionBtn || !overlayEl || !startBtn) {
            return;
        }

        const timer = new window.PresentationTimer({
            presentationDuration,
            defaultMcDuration,
            dataUrl,
            displayEl: display,
            progressEl: progress,
            phaseLabelEl: phaseLabel,
            subLabelEl: subLabel,
            currentDayLabelEl: currentDayLabel,
            currentIdEl: currentId,
            currentTitleEl: currentTitle,
            currentSubtitleEl: currentSubtitle,
            currentPresenterEl: currentPresenter,
            currentAffiliationEl: currentAffiliation,
            nextIdEl: nextId,
            nextTitleEl: nextTitle,
            nextSubtitleEl: nextSubtitle,
            nextPresenterEl: nextPresenter,
            stopBtn,
            resetBtn,
            forwardBtn,
            backBtn,
            jumpPresentationSelect,
            jumpPresentationBtn,
            jumpSectionSelect,
            jumpSectionBtn,
            overlayEl,
            startBtn,
            audio: window.AudioEngine,
        });

        timer.init();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();