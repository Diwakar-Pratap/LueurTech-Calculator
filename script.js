/* ========================================
   LueurTech Calculator — Core Engine
   ======================================== */

(function () {
    'use strict';

    // ---- State ----
    const state = {
        current: '0',
        previous: '',
        operator: null,
        shouldReset: false,
        history: JSON.parse(localStorage.getItem('lueur_history') || '[]'),
        soundEnabled: JSON.parse(localStorage.getItem('lueur_sound') ?? 'true'),
        theme: localStorage.getItem('lueur_theme') || 'dark',
    };

    // ---- DOM Refs ----
    const $ = (sel) => document.querySelector(sel);
    const resultValue = $('#resultValue');
    const expressionLine = $('#expressionLine');
    const themeToggle = $('#themeToggle');
    const soundToggle = $('#soundToggle');
    const historyToggle = $('#historyToggle');
    const historyPanel = $('#historyPanel');
    const historyOverlay = $('#historyOverlay');
    const historyList = $('#historyList');
    const historyCloseBtn = $('#historyCloseBtn');
    const historyClearBtn = $('#historyClearBtn');
    const copyBtn = $('#copyBtn');
    const toast = $('#toast');

    // ---- Audio Context (lazy) ----
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playTone(freq, duration, type = 'sine', vol = 0.08) {
        if (!state.soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (_) {}
    }

    function playClick() { playTone(800, 0.06, 'sine', 0.06); }
    function playOp() { playTone(600, 0.08, 'triangle', 0.07); }
    function playEquals() { playTone(1000, 0.12, 'sine', 0.08); }
    function playClear() { playTone(400, 0.15, 'triangle', 0.06); }

    // ---- Haptic ----
    function haptic(ms = 10) {
        if (navigator.vibrate) navigator.vibrate(ms);
    }

    // ---- Theme ----
    function applyTheme(theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('lueur_theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme === 'dark' ? '#0a0a0f' : '#f0eef6';
    }

    function toggleTheme() {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        haptic(15);
        playTone(state.theme === 'light' ? 880 : 440, 0.12, 'sine', 0.06);
    }

    // ---- Sound ----
    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('lueur_sound', JSON.stringify(state.soundEnabled));
        soundToggle.classList.toggle('sound-off-state', !state.soundEnabled);
        haptic(10);
    }

    // ---- Display Update ----
    function formatNumber(n) {
        if (n === 'Error') return 'Error';
        const str = String(n);
        if (str.includes('e')) return str;
        const parts = str.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    function updateDisplay(animate = true) {
        const formatted = formatNumber(state.current);
        resultValue.textContent = formatted;

        if (animate) {
            resultValue.classList.remove('animate-morph', 'animate-slide');
            void resultValue.offsetWidth; // reflow
            resultValue.classList.add('animate-morph');
        }

        // Auto-size font
        const len = state.current.replace(/[^0-9.]/g, '').length;
        if (len > 12) resultValue.style.fontSize = 'clamp(24px, 6vw, 32px)';
        else if (len > 9) resultValue.style.fontSize = 'clamp(28px, 7vw, 40px)';
        else resultValue.style.fontSize = '';
    }

    function updateExpression() {
        if (state.previous && state.operator) {
            expressionLine.textContent = `${formatNumber(state.previous)} ${state.operator}`;
        } else {
            expressionLine.textContent = '';
        }
    }

    // ---- Ripple ----
    function createRipple(btn, e) {
        const rippleContainer = btn.querySelector('.btn-ripple');
        if (!rippleContainer) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top - size / 2;

        const circle = document.createElement('span');
        circle.classList.add('ripple-circle');
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
        rippleContainer.appendChild(circle);
        circle.addEventListener('animationend', () => circle.remove());
    }

    // ---- Calculator Logic ----
    function inputNumber(num) {
        if (state.current === 'Error') state.current = '0';
        if (state.shouldReset) {
            state.current = num;
            state.shouldReset = false;
        } else {
            if (state.current === '0' && num !== '.') {
                state.current = num;
            } else {
                if (state.current.replace(/[^0-9]/g, '').length >= 15) return;
                state.current += num;
            }
        }
        updateDisplay();
        playClick();
        haptic();
    }

    function inputDecimal() {
        if (state.current === 'Error') state.current = '0';
        if (state.shouldReset) {
            state.current = '0.';
            state.shouldReset = false;
            updateDisplay();
            playClick();
            haptic();
            return;
        }
        if (!state.current.includes('.')) {
            state.current += '.';
            updateDisplay();
            playClick();
            haptic();
        }
    }

    function inputOperator(op) {
        if (state.current === 'Error') return;
        if (state.operator && !state.shouldReset) {
            calculate(false);
        }
        state.previous = state.current;
        state.operator = op;
        state.shouldReset = true;
        updateExpression();
        highlightActiveOp(op);
        playOp();
        haptic(12);
    }

    function calculate(addToHistory = true) {
        if (!state.operator || !state.previous) return;
        const prev = parseFloat(state.previous);
        const curr = parseFloat(state.current);
        let result;

        switch (state.operator) {
            case '+': result = prev + curr; break;
            case '−': case '-': result = prev - curr; break;
            case '×': case '*': result = prev * curr; break;
            case '÷': case '/':
                if (curr === 0) { result = 'Error'; break; }
                result = prev / curr;
                break;
            default: return;
        }

        const expression = `${formatNumber(state.previous)} ${state.operator} ${formatNumber(state.current)}`;

        if (result !== 'Error') {
            // Round to avoid floating point weirdness
            result = Math.round(result * 1e12) / 1e12;
        }

        state.current = String(result);
        state.previous = '';
        state.operator = null;
        state.shouldReset = true;

        updateExpression();
        updateDisplay(true);
        clearActiveOp();

        if (addToHistory) {
            addHistory(expression, state.current);
            playEquals();
            haptic(15);
        }
    }

    function inputPercent() {
        if (state.current === 'Error') return;
        const val = parseFloat(state.current);
        state.current = String(Math.round((val / 100) * 1e12) / 1e12);
        updateDisplay();
        playOp();
        haptic();
    }

    function clearAll() {
        state.current = '0';
        state.previous = '';
        state.operator = null;
        state.shouldReset = false;
        updateDisplay(false);
        updateExpression();
        clearActiveOp();
        resultValue.style.fontSize = '';
        playClear();
        haptic(20);
    }

    function backspace() {
        if (state.current === 'Error' || state.shouldReset) {
            clearAll();
            return;
        }
        if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
            state.current = '0';
        } else {
            state.current = state.current.slice(0, -1);
        }
        updateDisplay();
        playClick();
        haptic();
    }

    // ---- Operator Highlight ----
    function highlightActiveOp(op) {
        clearActiveOp();
        const opMap = { '+': 'btnAdd', '−': 'btnSubtract', '-': 'btnSubtract', '×': 'btnMultiply', '*': 'btnMultiply', '÷': 'btnDivide', '/': 'btnDivide' };
        const el = document.getElementById(opMap[op]);
        if (el) el.classList.add('active');
    }

    function clearActiveOp() {
        document.querySelectorAll('.op-btn.active').forEach(b => b.classList.remove('active'));
    }

    // ---- History ----
    function addHistory(expression, result) {
        state.history.unshift({ expression, result, time: Date.now() });
        if (state.history.length > 50) state.history.pop();
        localStorage.setItem('lueur_history', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No calculations yet</p>
                </div>`;
            return;
        }

        historyList.innerHTML = state.history.map((item, i) => `
            <div class="history-item" data-index="${i}" style="animation-delay: ${i * 0.04}s">
                <div class="hist-expression">${item.expression} =</div>
                <div class="hist-result">${formatNumber(item.result)}</div>
            </div>
        `).join('');

        historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                state.current = state.history[idx].result;
                state.shouldReset = true;
                updateDisplay();
                closeHistory();
                haptic();
                playClick();
            });
        });
    }

    function openHistory() {
        historyPanel.classList.add('open');
        historyOverlay.classList.add('open');
        renderHistory();
    }

    function closeHistory() {
        historyPanel.classList.remove('open');
        historyOverlay.classList.remove('open');
    }

    function clearHistory() {
        state.history = [];
        localStorage.removeItem('lueur_history');
        renderHistory();
        haptic(15);
        playClear();
    }

    // ---- Copy ----
    function copyResult() {
        const text = state.current === 'Error' ? '' : state.current;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.classList.add('copied');
            showToast('Copied to clipboard');
            haptic(12);
            playTone(1200, 0.08, 'sine', 0.05);
            setTimeout(() => copyBtn.classList.remove('copied'), 1500);
        }).catch(() => {});
    }

    // ---- Toast ----
    let toastTimer;
    function showToast(msg) {
        toast.querySelector('.toast-text').textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // ---- Button Handler ----
    function handleButton(btn, e) {
        const action = btn.dataset.action;
        const value = btn.dataset.value;
        createRipple(btn, e);

        switch (action) {
            case 'number': inputNumber(value); break;
            case 'decimal': inputDecimal(); break;
            case 'operator': inputOperator(value); break;
            case 'equals': calculate(); break;
            case 'clear': clearAll(); break;
            case 'backspace': backspace(); break;
            case 'percent': inputPercent(); break;
        }
    }

    // ---- Keyboard Support ----
    function handleKeyboard(e) {
        const key = e.key;
        if (key >= '0' && key <= '9') { e.preventDefault(); inputNumber(key); pulseBtn(`btn${key}`); }
        else if (key === '.') { e.preventDefault(); inputDecimal(); pulseBtn('btnDecimal'); }
        else if (key === '+') { e.preventDefault(); inputOperator('+'); pulseBtn('btnAdd'); }
        else if (key === '-') { e.preventDefault(); inputOperator('−'); pulseBtn('btnSubtract'); }
        else if (key === '*') { e.preventDefault(); inputOperator('×'); pulseBtn('btnMultiply'); }
        else if (key === '/') { e.preventDefault(); inputOperator('÷'); pulseBtn('btnDivide'); }
        else if (key === '%') { e.preventDefault(); inputPercent(); pulseBtn('btnPercent'); }
        else if (key === 'Enter' || key === '=') { e.preventDefault(); calculate(); pulseBtn('btnEquals'); }
        else if (key === 'Backspace') { e.preventDefault(); backspace(); pulseBtn('btnBackspace'); }
        else if (key === 'Escape' || key === 'Delete') { e.preventDefault(); clearAll(); pulseBtn('btnClear'); }
    }

    function pulseBtn(id) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => { btn.style.transform = ''; }, 120);
    }

    // ---- Init ----
    function init() {
        // Apply saved theme
        applyTheme(state.theme);

        // Sound state
        soundToggle.classList.toggle('sound-off-state', !state.soundEnabled);

        // Display
        updateDisplay(false);

        // Button events
        document.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleButton(btn, e));
            btn.addEventListener('touchstart', () => {}, { passive: true }); // iOS fast-tap
        });

        // Top bar
        themeToggle.addEventListener('click', toggleTheme);
        soundToggle.addEventListener('click', toggleSound);
        historyToggle.addEventListener('click', openHistory);
        historyCloseBtn.addEventListener('click', closeHistory);
        historyClearBtn.addEventListener('click', clearHistory);
        historyOverlay.addEventListener('click', closeHistory);
        copyBtn.addEventListener('click', copyResult);

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Prevent pull-to-refresh on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.history-list')) return;
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
