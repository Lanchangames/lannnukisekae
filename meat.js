(() => {
    const MEAT_MAX_TOTAL = 15000;
    const MEAT_STAMP_STEP = 1000;
    const MEAT_COOLDOWN_MS = 15 * 60 * 1000;
    const MEAT_STAMP_IMAGE = 'meat_stamp.png';
    let meatTimerInterval = null;

    // 肉スタンプラリー報酬。
    // items.js 側には同じ id / name / file / type で meatRewardOnly: true を付けて追加する。
    // 報酬は到達した報告では保留になり、次の通常報告でも条件を満たしている場合に解放する。
    const MEAT_STAMP_REWARDS = [
        { amount: 3000,  itemId: 'meat3000',  name: '肉集め隊の腕章',     file: 'meat_3000.png',  type: 'acc',   icon: '🎗️' },
        { amount: 6000,  itemId: 'meat6000',  name: '肉集めキャンプ',     file: 'meat_6000.png',  type: 'bg',    icon: '🏕️' },
        { amount: 9000,  itemId: 'meat9000',  name: '肉集め遠征服',       file: 'meat_9000.png',  type: 'setup', icon: '🥾' },
        { amount: 12000, itemId: 'meat12000', name: '肉マスターの勲章',   file: 'meat_12000.png', type: 'acc',   icon: '🏅' },
        { amount: 15000, itemId: 'meat15000', name: '伝説の肉集め騎士',   file: 'meat_15000.png', type: 'setup', icon: '👑' }
    ];

    const MEAT_REPORT_LINES = [
        { img: 'lancelot_1.png', msg: '肉集めお疲れさま、団長。着実に増えているな。' },
        { img: 'lancelot_1.png', msg: '報告ありがとう。次も無理のない範囲で頑張ろう。' },
        { img: 'lancelot_5.png', msg: 'それにしても、これだけの肉をどこに置いているんだ……？' },
        { img: 'lancelot_6.png', msg: 'いい調子だな！団長の働きぶりにはいつも驚かされるよ。' },
        { img: 'lancelot_1.png', msg: '少しずつスタンプが埋まってきたな。俺も楽しみになってきたぞ。' },
        { img: 'lancelot_8.png', msg: '休憩も忘れるなよ。甘いものでも食べて一息つこう。' },
        { img: 'lancelot_1.png', msg: '肉の数を数えるのも、なかなか大変そうだな。報告は俺に任せてくれ。' },
        { img: 'lancelot_5.png', msg: '団長は肉集めが好きなのか？……いや、仕事だからやっているんだよな。' },
        { img: 'lancelot_6.png', msg: 'これだけ集めれば、戦いの準備もかなり進んだんじゃないか？' },
        { img: 'lancelot_1.png', msg: '今日もよく頑張っているな。俺も団長を見習わないと。' },
        { img: 'lancelot_5.png', msg: '肉、肉、肉……見ているだけで少し腹が減ってきたな。' },
        { img: 'lancelot_1.png', msg: '報告を待っていたぞ、団長。順調そうで安心した。' },
        { img: 'lancelot_4.png', msg: 'かなり集めたな……。無理をしていないか？少し休んでくれよ。' },
        { img: 'lancelot_6.png', msg: 'この調子なら最後のスタンプまで届きそうだな！' },
        { img: 'lancelot_1.png', msg: 'ひとつずつ埋まっていくのを見ると、なんだか達成感があるな。' },
        { img: 'lancelot_5.png', msg: '団長、この肉は全部本当に必要なんだよな……？' },
        { img: 'lancelot_8.png', msg: '周回のしすぎで眠くなっていないか？俺は少し眠いぞ……。' },
        { img: 'lancelot_1.png', msg: 'よし、今回の分も記録しておいたぞ。次の報告も待っている。' },
        { img: 'lancelot_6.png', msg: 'またスタンプに近づいたな。報酬アイテムまであと少しだ！' },
        { img: 'lancelot_1.png', msg: '団長とこうして進捗を確認するのも、古戦場の楽しみのひとつかもしれないな。' }
    ];

    function ensureMeatState() {
        if (!Number.isSafeInteger(state.meatTotal) || state.meatTotal < 0) state.meatTotal = 0;
        if (!Number.isSafeInteger(state.highestMeatTotal) || state.highestMeatTotal < 0) state.highestMeatTotal = state.meatTotal;
        if (!Number.isSafeInteger(state.meatReportCount) || state.meatReportCount < 0) state.meatReportCount = 0;
        if (!state.meatRewardReceived || typeof state.meatRewardReceived !== 'object' || Array.isArray(state.meatRewardReceived)) state.meatRewardReceived = {};
        if (!state.meatPendingRewards || typeof state.meatPendingRewards !== 'object' || Array.isArray(state.meatPendingRewards)) state.meatPendingRewards = {};
        if (!Number.isSafeInteger(state.meatLastReportTime) || state.meatLastReportTime < 0) state.meatLastReportTime = 0;

        // 旧版の肉箱・拾いものデータは互換性のため消さない。
        if (!state.meatCollection || typeof state.meatCollection !== 'object' || Array.isArray(state.meatCollection)) state.meatCollection = {};
        if (!Number.isSafeInteger(state.meatGiftCount) || state.meatGiftCount < 0) state.meatGiftCount = 0;
        if (!Number.isSafeInteger(state.meatBoxProgress) || state.meatBoxProgress < 0) state.meatBoxProgress = 0;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function findItemById(id) {
        if (typeof ITEM_DB === 'undefined') return null;
        for (const category of ['setup', 'tops', 'bottoms', 'acc', 'bg']) {
            if (!ITEM_DB[category]) continue;
            const found = ITEM_DB[category].find(item => item.id === id);
            if (found) return found;
        }
        return null;
    }

    function ensureMeatThemeStyle() {
        if (document.getElementById('meat-mode-theme-style')) return;

        const style = document.createElement('style');
        style.id = 'meat-mode-theme-style';

        style.textContent = `
            body.meat-mode-page {
                background-color: #ffe4eb !important;
            }

            #game-container.mode-top.meat-mode-active {
                background-color: #ffe4eb !important;
            }

            #game-container.mode-top.meat-mode-active #content-wrapper,
            #game-container.mode-top.meat-mode-active #ui-area,
            #game-container.mode-top.meat-mode-active #section-top {
                background-color: #ffe4eb !important;
            }

            .meat-rally-card {
                background: rgba(255,255,255,0.88);
                border: 1px solid #e8a9b7;
                border-radius: 12px;
                padding: 12px;
                box-sizing: border-box;
            }

            .meat-progress-bar {
                width: 100%;
                height: 12px;
                background: #f1d5dc;
                border-radius: 999px;
                overflow: hidden;
                margin-top: 8px;
            }

            .meat-progress-fill {
                height: 100%;
                background: #c0392b;
                border-radius: 999px;
                transition: width .2s ease;
            }

            .meat-next-reward {
                border: 2px solid #c0392b;
                background: #fff4f5;
                box-shadow: 0 2px 8px rgba(192,57,43,.12);
            }

            .meat-stamp-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 7px;
            }

            .meat-stamp-cell {
                min-width: 0;
                min-height: 58px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 2px;
                box-sizing: border-box;
                font-weight: bold;
                position: relative;
            }

            .meat-stamp-cell.done {
                border: 2px solid #56a66a;
                background: #eef9f0;
                color: #26723b;
            }

            .meat-stamp-cell.next {
                border: 3px solid #c0392b;
                background: #fff0f2;
                color: #9f2f29;
                box-shadow: 0 0 0 3px rgba(192,57,43,.08);
            }

            .meat-stamp-cell.locked {
                border: 2px solid #d8dee5;
                background: #f8fafc;
                color: #94a3b8;
            }

            .meat-stamp-cell.reward-point::after {
                content: '🎁';
                position: absolute;
                top: -7px;
                right: -5px;
                font-size: 14px;
            }

            .meat-stamp-cell.pending {
                border: 3px solid #e68a19;
                background: #fff7e8;
                color: #9a5b0a;
                box-shadow: 0 0 0 3px rgba(230,138,25,.10);
            }

            .meat-stamp-image {
                width: 30px;
                height: 30px;
                object-fit: contain;
                display: block;
                pointer-events: none;
                user-select: none;
            }

            .meat-stamp-cell.done .meat-stamp-image {
                opacity: 1;
                filter: none;
            }

            .meat-stamp-cell.pending .meat-stamp-image {
                opacity: .72;
                filter: none;
            }

            .meat-stamp-cell.next .meat-stamp-image {
                opacity: .38;
                filter: none;
            }

            .meat-stamp-cell.locked .meat-stamp-image {
                opacity: .16;
                filter: grayscale(1);
            }

            .meat-stamp-fallback {
                display: none;
                font-size: 18px;
                line-height: 1;
            }

            .meat-stamp-next-tag {
                position: absolute;
                top: -9px;
                left: 50%;
                transform: translateX(-50%);
                background: #c0392b;
                color: white;
                font-size: 8px;
                line-height: 1;
                padding: 3px 5px;
                border-radius: 999px;
                letter-spacing: .04em;
            }

            .meat-reward-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .meat-reward-item {
                display: grid;
                grid-template-columns: 42px 1fr auto;
                align-items: center;
                gap: 9px;
                border-radius: 10px;
                padding: 10px;
                border: 1px solid #d8dee5;
                background: #f8fafc;
                box-sizing: border-box;
            }

            .meat-reward-item.done {
                border-color: #86c694;
                background: #effaf1;
            }

            .meat-reward-item.next {
                border: 2px solid #c0392b;
                background: #fff1f3;
                box-shadow: 0 2px 8px rgba(192,57,43,.10);
            }

            .meat-reward-item.pending {
                border: 2px solid #e68a19;
                background: #fff8eb;
                box-shadow: 0 2px 8px rgba(230,138,25,.10);
            }

            .meat-pending-notice {
                border: 2px solid #e68a19;
                background: #fff8eb;
                color: #7a4a0b;
            }

            .meat-reward-icon {
                width: 40px;
                height: 40px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,.9);
                font-size: 22px;
                border: 1px solid rgba(0,0,0,.07);
            }

            .meat-reward-status {
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                text-align: right;
            }

            @media (max-width: 768px) {
                .meat-reward-item {
                    grid-template-columns: 36px 1fr;
                }

                .meat-reward-status {
                    grid-column: 2;
                    text-align: left;
                }

                .meat-reward-icon {
                    width: 34px;
                    height: 34px;
                    font-size: 19px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function isMeatPanelOpen() {
        const panel = document.getElementById('meat-mode-panel');
        return !!panel && panel.style.display !== 'none';
    }

    function applyMeatTheme(active) {
        ensureMeatThemeStyle();

        const gc = document.getElementById('game-container');

        if (active) {
            document.body.classList.add('meat-mode-page');

            if (gc) {
                gc.classList.add('meat-mode-active');
            }
        } else {
            document.body.classList.remove('meat-mode-page');

            if (gc) {
                gc.classList.remove('meat-mode-active');
            }
        }
    }

    function getMeatCooldownRemaining() {
        if (!state.meatLastReportTime) {
            return 0;
        }

        return Math.max(
            0,
            MEAT_COOLDOWN_MS - (Date.now() - state.meatLastReportTime)
        );
    }

    function updateMeatCooldownUI() {
        const button = document.getElementById('btn-meat-report');
        const text = document.getElementById('meat-cooldown-text');

        if (!button || !text) {
            return;
        }

        const remaining = getMeatCooldownRemaining();

        if (remaining <= 0) {
            button.disabled = false;
            text.innerText = '肉を報告できるぞ！';

            if (meatTimerInterval) {
                clearInterval(meatTimerInterval);
                meatTimerInterval = null;
            }

            return;
        }

        const min = Math.floor(remaining / 1000 / 60);
        const sec = Math.floor((remaining / 1000) % 60);

        button.disabled = true;
        text.innerText = `次の肉報告まで: ${min}分 ${sec}秒`;
    }

    function startMeatCooldownTimer() {
        if (meatTimerInterval) {
            clearInterval(meatTimerInterval);
            meatTimerInterval = null;
        }

        updateMeatCooldownUI();

        if (getMeatCooldownRemaining() > 0) {
            meatTimerInterval = setInterval(
                updateMeatCooldownUI,
                1000
            );
        }
    }

    function stopMeatCooldownTimer() {
        if (meatTimerInterval) {
            clearInterval(meatTimerInterval);
            meatTimerInterval = null;
        }
    }

    function setMeatLancelotMessage(msg, img = 'lancelot_1.png') {
        currentLancelotImg = img;
        setLancelotMessage(msg);
        updateLancelotImage();
    }

    function getRandomReportLine() {
        return MEAT_REPORT_LINES[
            Math.floor(Math.random() * MEAT_REPORT_LINES.length)
        ];
    }

    function getProgressTotal() {
        return Math.min(
            state.meatTotal,
            MEAT_MAX_TOTAL
        );
    }

    function getStampCount() {
        return Math.min(
            15,
            Math.floor(getProgressTotal() / MEAT_STAMP_STEP)
        );
    }

    function getRewardTypeLabel(type) {
        const labels = {
            setup: 'セットアップ',
            tops: 'トップス',
            bottoms: 'ボトムス',
            acc: 'アクセサリー',
            bg: '背景'
        };

        return labels[type] || type;
    }

    function getPendingRewards() {
        return MEAT_STAMP_REWARDS.filter(reward => {
            const key = `stamp_${reward.amount}`;

            return (
                !!state.meatPendingRewards[key] &&
                !state.meatRewardReceived[key]
            );
        });
    }

    function getNextReward() {
        return MEAT_STAMP_REWARDS.find(reward => {
            const key = `stamp_${reward.amount}`;

            return (
                !state.meatRewardReceived[key] &&
                !state.meatPendingRewards[key] &&
                state.meatTotal < reward.amount
            );
        }) || null;
    }

    function hasPendingRewards() {
        return getPendingRewards().length > 0;
    }

    function getRewardItemDefinitionState(reward) {
        const item = findItemById(reward.itemId);

        if (!item) {
            return {
                item: null,
                valid: false
            };
        }

        const valid = (
            item.name === reward.name &&
            item.file === reward.file &&
            item.type === reward.type
        );

        return {
            item,
            valid
        };
    }

    function syncExistingRewardState() {
        let changed = false;

        MEAT_STAMP_REWARDS.forEach(reward => {
            const key = `stamp_${reward.amount}`;

            if (state.meatRewardReceived[key]) {
                if (state.meatPendingRewards[key]) {
                    delete state.meatPendingRewards[key];
                    changed = true;
                }

                return;
            }

            // 旧版ですでにクローゼットへ解放済みなら、取得済みとして引き継ぐ。
            if (
                state.unlocked &&
                state.unlocked[reward.itemId]
            ) {
                state.meatRewardReceived[key] = true;
                delete state.meatPendingRewards[key];
                changed = true;
                return;
            }

            // 旧版からの移行時、
            // すでに到達済みなら「次の報告で解放」状態にする。
            if (
                state.meatTotal >= reward.amount &&
                !state.meatPendingRewards[key]
            ) {
                state.meatPendingRewards[key] = true;
                changed = true;
            }
        });

        return changed;
    }

    function confirmPendingRewards(
        reportTotal,
        includeResultLines = true
    ) {
        const result = {
            changed: false,
            unlockedSomething: false,
            lines: []
        };

        MEAT_STAMP_REWARDS.forEach(reward => {
            const key = `stamp_${reward.amount}`;

            if (
                !state.meatPendingRewards[key] ||
                state.meatRewardReceived[key]
            ) {
                return;
            }

            if (reportTotal < reward.amount) {
                return;
            }

            const definition =
                getRewardItemDefinitionState(reward);

            if (!definition.item) {
                if (includeResultLines) {
                    result.lines.push(
                        `${reward.amount.toLocaleString()}個の報酬「${reward.name}」は items.js への追加後、次の報告で解放できます。`
                    );
                }

                return;
            }

            if (!definition.valid) {
                console.warn(
                    `[肉スタンプラリー] ${reward.itemId} の items.js 定義が meat.js の想定と一致しません。`,
                    definition.item
                );

                if (includeResultLines) {
                    result.lines.push(
                        `${reward.amount.toLocaleString()}個の報酬「${reward.name}」の定義を確認してくれ。`
                    );
                }

                return;
            }

            if (!state.unlocked[reward.itemId]) {
                state.unlocked[reward.itemId] = true;
                result.unlockedSomething = true;
            }

            state.meatRewardReceived[key] = true;
            delete state.meatPendingRewards[key];

            result.changed = true;

            if (includeResultLines) {
                result.lines.push(
                    `${reward.amount.toLocaleString()}個の報酬・${getRewardTypeLabel(reward.type)}「${reward.name}」を解放！`
                );
            }
        });

        return result;
    }

    function queueReachedRewards(
        includeResultLines = true
    ) {
        const result = {
            changed: false,
            lines: []
        };

        MEAT_STAMP_REWARDS.forEach(reward => {
            const key = `stamp_${reward.amount}`;

            if (state.meatTotal < reward.amount) {
                return;
            }

            if (
                state.meatRewardReceived[key] ||
                state.meatPendingRewards[key]
            ) {
                return;
            }

            state.meatPendingRewards[key] = true;
            result.changed = true;

            if (includeResultLines) {
                result.lines.push(
                    `${reward.amount.toLocaleString()}個達成！ 報酬「${reward.name}」は次の報告で解放できます。`
                );
            }
        });

        return result;
    }

    function cancelInvalidPendingRewards() {
        let changed = false;

        MEAT_STAMP_REWARDS.forEach(reward => {
            const key = `stamp_${reward.amount}`;

            if (
                state.meatPendingRewards[key] &&
                state.meatTotal < reward.amount
            ) {
                delete state.meatPendingRewards[key];
                changed = true;
            }
        });

        return changed;
    }

    function renderStampRally() {
        const stampCount = getStampCount();
        const nextStampNumber =
            stampCount < 15 ? stampCount + 1 : null;

        const cells = [];

        for (let i = 1; i <= 15; i++) {
            const amount = i * MEAT_STAMP_STEP;

            const reward = MEAT_STAMP_REWARDS.find(
                r => r.amount === amount
            );

            const rewardKey =
                reward ? `stamp_${reward.amount}` : null;

            const rewardReceived =
                rewardKey
                    ? !!state.meatRewardReceived[rewardKey]
                    : false;

            const rewardPending =
                rewardKey
                    ? (
                        !!state.meatPendingRewards[rewardKey] &&
                        !rewardReceived
                    )
                    : false;

            const completed = i <= stampCount;
            const isNext = i === nextStampNumber;
            const rewardPoint = !!reward;

            let cls =
                completed
                    ? 'done'
                    : isNext
                        ? 'next'
                        : 'locked';

            if (rewardPending) {
                cls = 'pending';
            }

            const fallback =
                completed
                    ? '✓'
                    : isNext
                        ? '🥩'
                        : '○';

            cells.push(`
                <div
                    class="meat-stamp-cell ${cls}${rewardPoint ? ' reward-point' : ''}"
                    title="${amount.toLocaleString()}個${reward ? `：${escapeHtml(reward.name)}` : ''}"
                >
                    ${
                        isNext && !rewardPending
                            ? '<span class="meat-stamp-next-tag">NEXT</span>'
                            : ''
                    }

                    <img
                        class="meat-stamp-image"
                        src="${MEAT_STAMP_IMAGE}"
                        alt="スタンプ"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    >

                    <span class="meat-stamp-fallback">
                        ${fallback}
                    </span>

                    <span style="font-size:10px;">
                        ${amount / 1000}k
                    </span>

                    ${
                        rewardPending
                            ? '<span style="font-size:8px; color:#9a5b0a;">次回解放</span>'
                            : ''
                    }
                </div>
            `);
        }

        return cells.join('');
    }

    function renderNextRewardCard() {
        const pendingRewards = getPendingRewards();

        if (pendingRewards.length > 0) {
            const reward = pendingRewards[0];

            const more =
                pendingRewards.length > 1
                    ? `ほか ${pendingRewards.length - 1}件`
                    : '';

            return `
                <div class="meat-rally-card meat-pending-notice">
                    <div style="
                        font-size:10px;
                        font-weight:bold;
                        color:#b56b0b;
                        letter-spacing:.08em;
                        margin-bottom:4px;
                    ">
                        報酬解放待ち
                    </div>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                    ">
                        <div class="meat-reward-icon">
                            ${reward.icon}
                        </div>

                        <div style="min-width:0; flex:1;">
                            <div style="
                                font-size:12px;
                                color:#7a4a0b;
                            ">
                                ${reward.amount.toLocaleString()}個達成・${getRewardTypeLabel(reward.type)}
                            </div>

                            <div style="
                                font-size:15px;
                                font-weight:bold;
                                color:#7a4a0b;
                                margin-top:1px;
                            ">
                                ${escapeHtml(reward.name)}
                            </div>

                            <div style="
                                font-size:12px;
                                font-weight:bold;
                                color:#b56b0b;
                                margin-top:4px;
                            ">
                                次の報告で解放できます。${more}
                            </div>
                        </div>
                    </div>

                    <div style="
                        font-size:11px;
                        line-height:1.6;
                        color:#7a4a0b;
                        margin-top:8px;
                    ">
                        肉数を間違えていた場合は、
                        次の報告をする前に「肉数修正」で直してください。
                        修正して条件を下回った未受取報酬は自動で取り消されます。
                    </div>
                </div>
            `;
        }

        const nextReward = getNextReward();

        if (!nextReward) {
            const allReceived =
                MEAT_STAMP_REWARDS.every(
                    reward =>
                        state.meatRewardReceived[
                            `stamp_${reward.amount}`
                        ]
                );

            if (allReceived) {
                return `
                    <div
                        class="meat-rally-card meat-next-reward"
                        style="text-align:center;"
                    >
                        <div style="
                            font-size:22px;
                            margin-bottom:3px;
                        ">
                            🎉
                        </div>

                        <div style="
                            font-size:15px;
                            font-weight:bold;
                            color:#8e2d41;
                        ">
                            15,000個コンプリート！
                        </div>

                        <div style="
                            font-size:12px;
                            color:#64748b;
                            margin-top:3px;
                        ">
                            5つの報酬をすべて獲得したぞ。
                        </div>
                    </div>
                `;
            }

            return '';
        }

        const remaining = Math.max(
            0,
            nextReward.amount - state.meatTotal
        );

        return `
            <div class="meat-rally-card meat-next-reward">
                <div style="
                    font-size:10px;
                    font-weight:bold;
                    color:#c0392b;
                    letter-spacing:.08em;
                    margin-bottom:4px;
                ">
                    次の報酬
                </div>

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">
                    <div class="meat-reward-icon">
                        ${nextReward.icon}
                    </div>

                    <div style="min-width:0; flex:1;">
                        <div style="
                            font-size:12px;
                            color:#64748b;
                        ">
                            ${nextReward.amount.toLocaleString()}個達成・${getRewardTypeLabel(nextReward.type)}
                        </div>

                        <div style="
                            font-size:15px;
                            font-weight:bold;
                            color:#7f1d2d;
                            margin-top:1px;
                        ">
                            ${escapeHtml(nextReward.name)}
                        </div>
                    </div>

                    <div style="
                        text-align:right;
                        flex-shrink:0;
                    ">
                        <div style="
                            font-size:10px;
                            color:#64748b;
                        ">
                            あと
                        </div>

                        <div style="
                            font-size:17px;
                            font-weight:bold;
                            color:#c0392b;
                        ">
                            ${remaining.toLocaleString()}個
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderRewardList() {
        const nextReward = getNextReward();

        return MEAT_STAMP_REWARDS.map(reward => {
            const key =
                `stamp_${reward.amount}`;

            const received =
                !!state.meatRewardReceived[key];

            const pending =
                !!state.meatPendingRewards[key] &&
                !received;

            const reached =
                state.meatTotal >= reward.amount;

            const isNext =
                !!nextReward &&
                nextReward.amount === reward.amount;

            const definition =
                getRewardItemDefinitionState(reward);

            let cls = 'locked';
            let status = '🔒 未達成';
            let statusColor = '#64748b';

            if (received) {
                cls = 'done';
                status = '✓ 獲得済み';
                statusColor = '#26723b';

            } else if (pending) {
                cls = 'pending';

                if (!definition.item) {
                    status =
                        '⏳ 定義追加後、次の報告で解放';

                } else if (!definition.valid) {
                    status =
                        '⚠ 定義を確認';

                } else {
                    status =
                        '⏳ 次の報告で解放できます';
                }

                statusColor = '#b56b0b';

            } else if (isNext) {
                cls = 'next';

                status =
                    `NEXT・あと ${(reward.amount - state.meatTotal).toLocaleString()}個`;

                statusColor = '#c0392b';

            } else if (reached) {
                cls = 'pending';
                status =
                    '⏳ 次の報告で解放できます';

                statusColor = '#b56b0b';
            }

            return `
                <div class="meat-reward-item ${cls}">
                    <div class="meat-reward-icon">
                        ${reward.icon}
                    </div>

                    <div style="min-width:0;">
                        <div style="
                            font-size:10px;
                            color:#64748b;
                        ">
                            ${reward.amount.toLocaleString()}個・${getRewardTypeLabel(reward.type)}
                        </div>

                        <div style="
                            font-size:13px;
                            font-weight:bold;
                            color:${
                                received
                                    ? '#215e33'
                                    : pending
                                        ? '#7a4a0b'
                                        : isNext
                                            ? '#8e2d41'
                                            : '#334155'
                            };
                            margin-top:2px;
                        ">
                            ${escapeHtml(reward.name)}
                        </div>
                    </div>

                    <div
                        class="meat-reward-status"
                        style="color:${statusColor};"
                    >
                        ${status}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderMeatPanel(result = null) {
        ensureMeatState();

        const panel =
            document.getElementById('meat-mode-panel');

        if (!panel) {
            return;
        }

        const stampCount =
            getStampCount();

        const progressTotal =
            getProgressTotal();

        const progressPercent =
            Math.min(
                100,
                (progressTotal / MEAT_MAX_TOTAL) * 100
            );

        const nextStamp =
            stampCount >= 15
                ? 0
                : (
                    (stampCount + 1) *
                    MEAT_STAMP_STEP -
                    progressTotal
                );

        let resultHtml = '';

        if (
            result &&
            result.lines &&
            result.lines.length > 0
        ) {
            resultHtml = `
                <div
                    class="meat-rally-card"
                    style="
                        font-size:13px;
                        line-height:1.7;
                        border-color:#e5a8b5;
                    "
                >
                    ${
                        result.lines
                            .map(
                                line =>
                                    `<div>${escapeHtml(line)}</div>`
                            )
                            .join('')
                    }
                </div>
            `;
        }

        panel.innerHTML = `
            <div style="
                display:flex;
                flex-direction:column;
                gap:12px;
                width:100%;
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                ">
                    <h3 style="
                        margin:0;
                        color:#8e2d41;
                    ">
                        🥩 肉集めモード
                    </h3>

                    <button
                        onclick="closeMeatMode()"
                        style="
                            padding:8px 12px;
                            background-color:#64748b;
                        "
                    >
                        ← 貢献度モードに戻る
                    </button>
                </div>

                <div class="status-container">
                    <div class="status-card">
                        <span class="label">
                            🥩 現在の肉
                        </span>

                        <span class="val">
                            ${state.meatTotal.toLocaleString()}個
                        </span>
                    </div>

                    <div class="status-card">
                        <span class="label">
                            📣 肉報告
                        </span>

                        <span class="val">
                            ${state.meatReportCount}回
                        </span>
                    </div>

                    <div class="status-card">
                        <span class="label">
                            🎫 スタンプ
                        </span>

                        <span class="val">
                            ${stampCount} / 15
                        </span>
                    </div>
                </div>

                <div class="input-group">
                    <input
                        type="number"
                        id="input-meat"
                        max="${MEAT_MAX_TOTAL}"
                        placeholder="現在の累計肉数を入力（最大15,000）"
                        onkeydown="if(['e', 'E', '+', '-', '.'].includes(event.key)) event.preventDefault();"
                    >

                    <div style="
                        display:grid;
                        grid-auto-rows:1fr;
                        gap:10px;
                        flex-shrink:0;
                        min-width:150px;
                    ">
                        <button
                            id="btn-meat-report"
                            onclick="reportMeat()"
                            style="
                                width:100%;
                                height:100%;
                                background-color:#c0392b;
                            "
                        >
                            肉を報告する
                        </button>

                        <button
                            id="btn-meat-fix"
                            onclick="fixMeat()"
                            style="
                                width:100%;
                                height:100%;
                                background-color:#f39c12;
                            "
                        >
                            肉数修正
                            <br>
                            <span style="font-size:10px;">
                                （報酬は増加しません。）
                            </span>
                        </button>
                    </div>
                </div>

                <div
                    id="meat-cooldown-text"
                    style="
                        color:#c0392b;
                        font-size:13px;
                        font-weight:bold;
                        min-height:20px;
                        display:flex;
                        align-items:center;
                    "
                ></div>

                <div class="meat-rally-card">
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:end;
                        gap:10px;
                    ">
                        <div>
                            <div style="
                                font-size:13px;
                                font-weight:bold;
                                color:#8e2d41;
                            ">
                                肉スタンプラリー
                            </div>

                            <div style="
                                font-size:11px;
                                color:#64748b;
                                margin-top:2px;
                            ">
                                ${
                                    stampCount >= 15
                                        ? '全15スタンプ達成！'
                                        : `次のスタンプまであと ${nextStamp.toLocaleString()}個`
                                }
                            </div>
                        </div>

                        <div style="
                            font-size:13px;
                            font-weight:bold;
                            color:#8e2d41;
                            white-space:nowrap;
                        ">
                            ${progressTotal.toLocaleString()}
                            /
                            ${MEAT_MAX_TOTAL.toLocaleString()}
                        </div>
                    </div>

                    <div class="meat-progress-bar">
                        <div
                            class="meat-progress-fill"
                            style="
                                width:${progressPercent}%;
                            "
                        ></div>
                    </div>

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        font-size:10px;
                        color:#64748b;
                        margin-top:4px;
                    ">
                        <span>0</span>
                        <span>15,000</span>
                    </div>
                </div>

                ${renderNextRewardCard()}

                <div class="meat-rally-card">
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        margin-bottom:12px;
                    ">
                        <strong style="
                            font-size:13px;
                            color:#8e2d41;
                        ">
                            15個のスタンプ
                        </strong>

                        <span style="
                            font-size:10px;
                            color:#64748b;
                        ">
                            ✓ 達成
                            <span style="
                                color:#b56b0b;
                                font-weight:bold;
                            ">
                                橙枠＝次回解放
                            </span>
                            <span style="
                                color:#c0392b;
                                font-weight:bold;
                            ">
                                赤枠＝次
                            </span>
                            ○ 未達成
                        </span>
                    </div>

                    <div class="meat-stamp-grid">
                        ${renderStampRally()}
                    </div>

                    <div style="
                        font-size:11px;
                        color:#8e2d41;
                        margin-top:9px;
                    ">
                        🎁 3,000個ごとに着せ替え報酬。
                        到達した次の報告で解放できます。
                    </div>
                </div>

                ${resultHtml}

                <div class="meat-rally-card">
                    <div style="
                        font-size:13px;
                        font-weight:bold;
                        color:#8e2d41;
                        margin-bottom:4px;
                    ">
                        報酬
                    </div>

                    <div style="
                        font-size:11px;
                        color:#64748b;
                        line-height:1.6;
                        margin-bottom:9px;
                    ">
                        条件に到達した報酬はすぐには配布されません。
                        次の通常報告でも条件を満たしていると解放できます。
                        誤入力した場合は、その前に「肉数修正」で直してください。
                    </div>

                    <div class="meat-reward-grid">
                        ${renderRewardList()}
                    </div>
                </div>
            </div>
        `;

        updateMeatCooldownUI();
    }

    function openMeatMode() {
        ensureMeatState();

        const sectionTop =
            document.getElementById('section-top');

        if (!sectionTop) {
            return;
        }

        const status =
            sectionTop.querySelector(
                '.status-container'
            );

        const contributionInput =
            sectionTop.querySelector(
                ':scope > .input-group'
            );

        const cooldown =
            document.getElementById(
                'cooldown-text'
            );

        const panel =
            document.getElementById(
                'meat-mode-panel'
            );

        if (status) {
            status.style.display = 'none';
        }

        if (contributionInput) {
            contributionInput.style.display = 'none';
        }

        if (cooldown) {
            cooldown.style.display = 'none';
        }

        if (panel) {
            panel.style.display = 'flex';
        }

        applyMeatTheme(true);
        renderMeatPanel();
        startMeatCooldownTimer();

        setMeatLancelotMessage(
            '肉集めモードだな。15,000個まで、俺と一緒にスタンプを埋めていこう！',
            'lancelot_1.png'
        );
    }

    function closeMeatMode() {
        const sectionTop =
            document.getElementById('section-top');

        if (!sectionTop) {
            return;
        }

        const status =
            sectionTop.querySelector(
                '.status-container'
            );

        const contributionInput =
            sectionTop.querySelector(
                ':scope > .input-group'
            );

        const cooldown =
            document.getElementById(
                'cooldown-text'
            );

        const panel =
            document.getElementById(
                'meat-mode-panel'
            );

        if (status) {
            status.style.display = '';
        }

        if (contributionInput) {
            contributionInput.style.display = '';
        }

        if (cooldown) {
            cooldown.style.display = '';
        }

        if (panel) {
            panel.style.display = 'none';
        }

        applyMeatTheme(false);
        stopMeatCooldownTimer();
        updateCooldownUI();

        setMeatLancelotMessage(
            '貢献度の報告に戻るんだな。了解したぞ、団長。',
            'lancelot_1.png'
        );
    }

    function commitMeatReport(inputVal) {
        ensureMeatState();

        // 前回まで保留中だった報酬だけ、
        // 今回の通常報告で解放する。
        const confirmedResult =
            confirmPendingRewards(
                inputVal,
                true
            );

        const previousTotal =
            state.meatTotal;

        const previousStampCount =
            getStampCount();

        const diff =
            inputVal - previousTotal;

        state.meatTotal =
            inputVal;

        state.highestMeatTotal =
            Math.max(
                state.highestMeatTotal,
                inputVal
            );

        state.meatReportCount++;
        state.meatLastReportTime =
            Date.now();

        // 今回初めて条件を満たした報酬は保留。
        // 次回報告まで配布しない。
        const queuedResult =
            queueReachedRewards(true);

        const currentStampCount =
            getStampCount();

        const resultLines = [];

        if (diff > 0) {
            resultLines.push(
                `肉を ${diff.toLocaleString()}個 報告したぞ。`
            );
        } else {
            resultLines.push(
                '肉数に変化はないが、報酬の確認報告として受け付けたぞ。'
            );
        }

        resultLines.push(
            `累計 ${state.meatTotal.toLocaleString()}個。`
        );

        if (
            currentStampCount >
            previousStampCount
        ) {
            const added =
                currentStampCount -
                previousStampCount;

            resultLines.push(
                `スタンプが${added}個増えた！　現在 ${currentStampCount} / 15。`
            );
        }

        resultLines.push(
            ...confirmedResult.lines
        );

        resultLines.push(
            ...queuedResult.lines
        );

        if (
            state.meatTotal >=
            MEAT_MAX_TOTAL
        ) {
            resultLines.push(
                '15,000個達成！ 肉集めスタンプラリーコンプリート！'
            );
        }

        if (
            confirmedResult.unlockedSomething
        ) {
            renderItems();
        }

        const input =
            document.getElementById(
                'input-meat'
            );

        if (input) {
            input.value = '';
        }

        updateUI();
        saveGame();

        renderMeatPanel({
            lines: resultLines
        });

        startMeatCooldownTimer();

        const reaction =
            getRandomReportLine();

        setMeatLancelotMessage(
            reaction.msg,
            reaction.img
        );
    }

    function reportMeat() {
        ensureMeatState();

        const input =
            document.getElementById(
                'input-meat'
            );

        if (!input) {
            return;
        }

        const inputValStr =
            input.value.trim();

        if (
            inputValStr === '' ||
            !/^\d+$/.test(inputValStr)
        ) {
            setMeatLancelotMessage(
                '団長、その肉数はうまく読めないぞ。数字だけで入力してくれ。',
                'lancelot_2.png'
            );

            return;
        }

        const inputVal =
            Number(inputValStr);

        if (
            !Number.isSafeInteger(inputVal) ||
            inputVal < 0 ||
            inputVal > MEAT_MAX_TOTAL
        ) {
            setMeatLancelotMessage(
                '肉集めスタンプラリーは15,000個までだぞ。入力を確認してくれ。',
                'lancelot_2.png'
            );

            return;
        }

        const cooldownRemaining =
            getMeatCooldownRemaining();

        if (cooldownRemaining > 0) {
            const remainMin =
                Math.ceil(
                    cooldownRemaining /
                    1000 /
                    60
                );

            setMeatLancelotMessage(
                `少し休憩したらどうだ？ 次の肉報告まであと ${remainMin} 分だ。`,
                'lancelot_1.png'
            );

            updateMeatCooldownUI();

            return;
        }

        if (
            inputVal <
            state.meatTotal
        ) {
            setMeatLancelotMessage(
                '団長、肉が減っているようだ。減らしたい場合は「肉数修正」を使ってくれ。',
                'lancelot_5.png'
            );

            return;
        }

        // 報酬確認待ちがある場合は、
        // 15,000到達後などに同じ数でも
        // 次回報告として受け付ける。
        if (
            inputVal === state.meatTotal &&
            !hasPendingRewards()
        ) {
            setMeatLancelotMessage(
                '前回と同じ数だな。新しく集めたらまた教えてくれ。',
                'lancelot_1.png'
            );

            return;
        }

        const diff =
            inputVal -
            state.meatTotal;

        if (diff >= 3000) {
            showCustomConfirm(
                `前回から ${diff.toLocaleString()}個 増えているぞ。\n現在の肉は ${inputVal.toLocaleString()}個 で間違いないか？\n\n※到達した報酬は今回すぐには配布されず、次の報告で解放できます。`,
                () =>
                    commitMeatReport(
                        inputVal
                    )
            );

            return;
        }

        commitMeatReport(inputVal);
    }

    function fixMeat() {
        ensureMeatState();

        const input =
            document.getElementById(
                'input-meat'
            );

        if (!input) {
            return;
        }

        const inputValStr =
            input.value.trim();

        if (
            inputValStr === '' ||
            !/^\d+$/.test(inputValStr)
        ) {
            setMeatLancelotMessage(
                'そんな肉数はあり得ないと思うが……修正する数字を確認してくれ。',
                'lancelot_2.png'
            );

            return;
        }

        const inputVal =
            Number(inputValStr);

        if (
            !Number.isSafeInteger(inputVal) ||
            inputVal < 0 ||
            inputVal > MEAT_MAX_TOTAL
        ) {
            setMeatLancelotMessage(
                '肉集めスタンプラリーは15,000個までだぞ。修正する数字を確認してくれ。',
                'lancelot_2.png'
            );

            return;
        }

        const oldTotal =
            state.meatTotal;

        state.meatTotal =
            inputVal;

        state.highestMeatTotal =
            Math.max(
                state.highestMeatTotal,
                inputVal
            );

        const canceled =
            cancelInvalidPendingRewards();

        input.value = '';

        saveGame();

        renderMeatPanel({
            lines: [
                `肉数を ${oldTotal.toLocaleString()}個 → ${inputVal.toLocaleString()}個 に修正したぞ。`,
                '修正では報告回数・15分タイマー・報酬は増えません。',
                ...(
                    canceled
                        ? [
                            '条件を下回った「次の報告で解放」状態の報酬は取り消しました。'
                        ]
                        : []
                )
            ]
        });

        setMeatLancelotMessage(
            '肉数を修正したぞ。次は間違えないようにな。',
            inputVal < oldTotal
                ? 'lancelot_5.png'
                : 'lancelot_1.png'
        );
    }

    function initMeatMode() {
        ensureMeatState();
        ensureMeatThemeStyle();

        // 旧版データとの互換。
        // すでに解放済みは取得済み扱い、
        // 到達済み未取得は次回報告待ちにする。
        if (syncExistingRewardState()) {
            saveGame();
        }

        renderMeatPanel();

        const mainTabs =
            document.querySelectorAll(
                '#main-nav .tab-item'
            );

        mainTabs.forEach(
            (tab, index) => {
                tab.addEventListener(
                    'click',
                    () => {
                        if (
                            index === 0 &&
                            isMeatPanelOpen()
                        ) {
                            applyMeatTheme(true);

                        } else if (
                            index !== 0
                        ) {
                            applyMeatTheme(false);
                        }
                    }
                );
            }
        );
    }

    window.initMeatMode =
        initMeatMode;

    window.openMeatMode =
        openMeatMode;

    window.closeMeatMode =
        closeMeatMode;

    window.reportMeat =
        reportMeat;

    window.fixMeat =
        fixMeat;
})();
