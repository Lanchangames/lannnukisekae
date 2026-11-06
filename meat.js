(() => {
    const MEAT_MAX_TOTAL = 15000;
    const MEAT_STAMP_STEP = 1000;
    const MEAT_COOLDOWN_MS = 15 * 60 * 1000;
    let meatTimerInterval = null;

    // 肉スタンプラリー限定着せ替え報酬。
    // items.js 側には同じ id / name / file / type で meatRewardOnly: true を付けて追加する。
    // 定義がまだ存在しない場合は報酬取得済みにせず、後から items.js に追加した時点で自動解放する。
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
        { img: 'lancelot_6.png', msg: 'またスタンプに近づいたな。限定アイテムまであと少しだ！' },
        { img: 'lancelot_1.png', msg: '団長とこうして進捗を確認するのも、古戦場の楽しみのひとつかもしれないな。' }
    ];

    function ensureMeatState() {
        if (!Number.isSafeInteger(state.meatTotal) || state.meatTotal < 0) state.meatTotal = 0;
        if (!Number.isSafeInteger(state.highestMeatTotal) || state.highestMeatTotal < 0) state.highestMeatTotal = state.meatTotal;
        if (!Number.isSafeInteger(state.meatReportCount) || state.meatReportCount < 0) state.meatReportCount = 0;
        if (!state.meatRewardReceived || typeof state.meatRewardReceived !== 'object' || Array.isArray(state.meatRewardReceived)) state.meatRewardReceived = {};
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
            body.meat-mode-page { background-color: #ffe4eb !important; }
            #game-container.mode-top.meat-mode-active { background-color: #ffe4eb !important; }
            #game-container.mode-top.meat-mode-active #content-wrapper,
            #game-container.mode-top.meat-mode-active #ui-area,
            #game-container.mode-top.meat-mode-active #section-top { background-color: #ffe4eb !important; }

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
            if (gc) gc.classList.add('meat-mode-active');
        } else {
            document.body.classList.remove('meat-mode-page');
            if (gc) gc.classList.remove('meat-mode-active');
        }
    }

    function getMeatCooldownRemaining() {
        if (!state.meatLastReportTime) return 0;
        return Math.max(0, MEAT_COOLDOWN_MS - (Date.now() - state.meatLastReportTime));
    }

    function updateMeatCooldownUI() {
        const button = document.getElementById('btn-meat-report');
        const text = document.getElementById('meat-cooldown-text');
        if (!button || !text) return;

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
            meatTimerInterval = setInterval(updateMeatCooldownUI, 1000);
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
        return MEAT_REPORT_LINES[Math.floor(Math.random() * MEAT_REPORT_LINES.length)];
    }

    function getProgressTotal() {
        return Math.min(state.meatTotal, MEAT_MAX_TOTAL);
    }

    function getStampCount() {
        return Math.min(15, Math.floor(getProgressTotal() / MEAT_STAMP_STEP));
    }

    function getRewardTypeLabel(type) {
        const labels = { setup: 'セットアップ', tops: 'トップス', bottoms: 'ボトムス', acc: 'アクセサリー', bg: '背景' };
        return labels[type] || type;
    }

    function getNextReward() {
        return MEAT_STAMP_REWARDS.find(reward => state.meatTotal < reward.amount) || null;
    }

    function getRewardItemDefinitionState(reward) {
        const item = findItemById(reward.itemId);
        if (!item) return { item: null, valid: false };
        const valid = item.name === reward.name && item.file === reward.file && item.type === reward.type;
        return { item, valid };
    }

    function unlockEligibleStampRewards(includeResultLines = false) {
        const result = { changed: false, unlockedSomething: false, lines: [] };

        MEAT_STAMP_REWARDS.forEach(reward => {
            if (state.meatTotal < reward.amount) return;
            const key = `stamp_${reward.amount}`;
            if (state.meatRewardReceived[key]) return;

            const definition = getRewardItemDefinitionState(reward);
            if (!definition.item) {
                if (includeResultLines) {
                    result.lines.push(`${reward.amount.toLocaleString()}個達成！「${reward.name}」は items.js への追加後に自動解放されるぞ。`);
                }
                return;
            }
            if (!definition.valid) {
                console.warn(`[肉スタンプラリー] ${reward.itemId} の items.js 定義が meat.js の想定と一致しません。`, definition.item);
                if (includeResultLines) {
                    result.lines.push(`${reward.amount.toLocaleString()}個達成！ 限定報酬の定義を確認してくれ。`);
                }
                return;
            }

            if (!state.unlocked[reward.itemId]) {
                state.unlocked[reward.itemId] = true;
                result.unlockedSomething = true;
            }
            state.meatRewardReceived[key] = true;
            result.changed = true;

            if (includeResultLines) {
                result.lines.push(`${reward.amount.toLocaleString()}個達成！ 限定${getRewardTypeLabel(reward.type)}「${reward.name}」を解放！`);
            }
        });

        return result;
    }

    function renderStampRally() {
        const stampCount = getStampCount();
        const nextStampNumber = stampCount < 15 ? stampCount + 1 : null;
        const cells = [];

        for (let i = 1; i <= 15; i++) {
            const amount = i * MEAT_STAMP_STEP;
            const completed = i <= stampCount;
            const isNext = i === nextStampNumber;
            const reward = MEAT_STAMP_REWARDS.find(r => r.amount === amount);
            const rewardPoint = !!reward;
            const cls = completed ? 'done' : isNext ? 'next' : 'locked';
            const symbol = completed ? '✓' : isNext ? '🥩' : '○';

            cells.push(`
                <div class="meat-stamp-cell ${cls}${rewardPoint ? ' reward-point' : ''}" title="${amount.toLocaleString()}個${reward ? `：${escapeHtml(reward.name)}` : ''}">
                    ${isNext ? '<span class="meat-stamp-next-tag">NEXT</span>' : ''}
                    <span style="font-size:18px; line-height:1;">${symbol}</span>
                    <span style="font-size:10px;">${amount / 1000}k</span>
                </div>
            `);
        }
        return cells.join('');
    }

    function renderNextRewardCard() {
        const nextReward = getNextReward();
        if (!nextReward) {
            return `
                <div class="meat-rally-card meat-next-reward" style="text-align:center;">
                    <div style="font-size:22px; margin-bottom:3px;">🎉</div>
                    <div style="font-size:15px; font-weight:bold; color:#8e2d41;">15,000個コンプリート！</div>
                    <div style="font-size:12px; color:#64748b; margin-top:3px;">限定報酬5種をすべて達成したぞ。</div>
                </div>`;
        }

        const remaining = nextReward.amount - state.meatTotal;
        return `
            <div class="meat-rally-card meat-next-reward">
                <div style="font-size:10px; font-weight:bold; color:#c0392b; letter-spacing:.08em; margin-bottom:4px;">NEXT REWARD</div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="meat-reward-icon">${nextReward.icon}</div>
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:12px; color:#64748b;">${nextReward.amount.toLocaleString()}個達成報酬・${getRewardTypeLabel(nextReward.type)}</div>
                        <div style="font-size:15px; font-weight:bold; color:#7f1d2d; margin-top:1px;">${escapeHtml(nextReward.name)}</div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <div style="font-size:10px; color:#64748b;">あと</div>
                        <div style="font-size:17px; font-weight:bold; color:#c0392b;">${remaining.toLocaleString()}個</div>
                    </div>
                </div>
            </div>`;
    }

    function renderRewardList() {
        const nextReward = getNextReward();

        return MEAT_STAMP_REWARDS.map(reward => {
            const received = !!state.meatRewardReceived[`stamp_${reward.amount}`];
            const reached = state.meatTotal >= reward.amount;
            const isNext = !!nextReward && nextReward.amount === reward.amount;
            const definition = getRewardItemDefinitionState(reward);

            let cls = 'locked';
            let status = '🔒 未達成';
            let statusColor = '#64748b';

            if (received) {
                cls = 'done';
                status = '✓ 獲得済み';
                statusColor = '#26723b';
            } else if (reached && !definition.item) {
                cls = 'next';
                status = '達成済み・定義待ち';
                statusColor = '#c0392b';
            } else if (reached && !definition.valid) {
                cls = 'next';
                status = '定義を確認';
                statusColor = '#c0392b';
            } else if (isNext) {
                cls = 'next';
                status = `NEXT・あと ${(reward.amount - state.meatTotal).toLocaleString()}個`;
                statusColor = '#c0392b';
            }

            return `
                <div class="meat-reward-item ${cls}">
                    <div class="meat-reward-icon">${reward.icon}</div>
                    <div style="min-width:0;">
                        <div style="font-size:10px; color:#64748b;">${reward.amount.toLocaleString()}個・${getRewardTypeLabel(reward.type)}</div>
                        <div style="font-size:13px; font-weight:bold; color:${received ? '#215e33' : isNext ? '#8e2d41' : '#334155'}; margin-top:2px;">${escapeHtml(reward.name)}</div>
                    </div>
                    <div class="meat-reward-status" style="color:${statusColor};">${status}</div>
                </div>
            `;
        }).join('');
    }

    function renderMeatPanel(result = null) {
        ensureMeatState();
        const panel = document.getElementById('meat-mode-panel');
        if (!panel) return;

        const stampCount = getStampCount();
        const progressTotal = getProgressTotal();
        const progressPercent = Math.min(100, (progressTotal / MEAT_MAX_TOTAL) * 100);
        const nextStamp = stampCount >= 15 ? 0 : ((stampCount + 1) * MEAT_STAMP_STEP - progressTotal);

        let resultHtml = '';
        if (result && result.lines && result.lines.length > 0) {
            resultHtml = `
                <div class="meat-rally-card" style="font-size:13px; line-height:1.7; border-color:#e5a8b5;">
                    ${result.lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
                </div>`;
        }

        panel.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <h3 style="margin:0; color:#8e2d41;">🥩 肉集めモード</h3>
                    <button onclick="closeMeatMode()" style="padding:8px 12px; background-color:#64748b;">← 貢献度モードに戻る</button>
                </div>

                <div class="status-container">
                    <div class="status-card">
                        <span class="label">🥩 現在の肉</span>
                        <span class="val">${state.meatTotal.toLocaleString()}個</span>
                    </div>
                    <div class="status-card">
                        <span class="label">📣 肉報告</span>
                        <span class="val">${state.meatReportCount}回</span>
                    </div>
                    <div class="status-card">
                        <span class="label">🎫 スタンプ</span>
                        <span class="val">${stampCount} / 15</span>
                    </div>
                </div>

                <div class="input-group">
                    <input type="number" id="input-meat" max="${MEAT_MAX_TOTAL}" placeholder="現在の累計肉数を入力（最大15,000）" onkeydown="if(['e', 'E', '+', '-', '.'].includes(event.key)) event.preventDefault();">
                    <button id="btn-meat-report" onclick="reportMeat()" style="min-width:130px; background-color:#c0392b;">肉を報告する</button>
                </div>

                <div id="meat-cooldown-text" style="color:#c0392b; font-size:13px; font-weight:bold; min-height:20px; display:flex; align-items:center;"></div>

                <div class="meat-rally-card">
                    <div style="display:flex; justify-content:space-between; align-items:end; gap:10px;">
                        <div>
                            <div style="font-size:13px; font-weight:bold; color:#8e2d41;">肉スタンプラリー</div>
                            <div style="font-size:11px; color:#64748b; margin-top:2px;">${stampCount >= 15 ? '全15スタンプ達成！' : `次のスタンプまであと ${nextStamp.toLocaleString()}個`}</div>
                        </div>
                        <div style="font-size:13px; font-weight:bold; color:#8e2d41; white-space:nowrap;">${progressTotal.toLocaleString()} / ${MEAT_MAX_TOTAL.toLocaleString()}</div>
                    </div>
                    <div class="meat-progress-bar"><div class="meat-progress-fill" style="width:${progressPercent}%;"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:4px;">
                        <span>0</span><span>15,000</span>
                    </div>
                </div>

                ${renderNextRewardCard()}

                <div class="meat-rally-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                        <strong style="font-size:13px; color:#8e2d41;">15個のスタンプ</strong>
                        <span style="font-size:10px; color:#64748b;">✓ 達成　<span style="color:#c0392b; font-weight:bold;">赤枠＝次</span>　○ 未達成</span>
                    </div>
                    <div class="meat-stamp-grid">${renderStampRally()}</div>
                    <div style="font-size:11px; color:#8e2d41; margin-top:9px;">🎁 3,000個ごとに限定着せ替え報酬</div>
                </div>

                ${resultHtml}

                <div class="meat-rally-card">
                    <div style="font-size:13px; font-weight:bold; color:#8e2d41; margin-bottom:9px;">限定着せ替え報酬</div>
                    <div class="meat-reward-grid">${renderRewardList()}</div>
                </div>
            </div>`;

        updateMeatCooldownUI();
    }

    function openMeatMode() {
        ensureMeatState();
        const sectionTop = document.getElementById('section-top');
        if (!sectionTop) return;

        const status = sectionTop.querySelector('.status-container');
        const contributionInput = sectionTop.querySelector(':scope > .input-group');
        const cooldown = document.getElementById('cooldown-text');
        const panel = document.getElementById('meat-mode-panel');

        if (status) status.style.display = 'none';
        if (contributionInput) contributionInput.style.display = 'none';
        if (cooldown) cooldown.style.display = 'none';
        if (panel) panel.style.display = 'flex';

        applyMeatTheme(true);
        renderMeatPanel();
        startMeatCooldownTimer();
        setMeatLancelotMessage('肉集めモードだな。15,000個まで、俺と一緒にスタンプを埋めていこう！', 'lancelot_1.png');
    }

    function closeMeatMode() {
        const sectionTop = document.getElementById('section-top');
        if (!sectionTop) return;

        const status = sectionTop.querySelector('.status-container');
        const contributionInput = sectionTop.querySelector(':scope > .input-group');
        const cooldown = document.getElementById('cooldown-text');
        const panel = document.getElementById('meat-mode-panel');

        if (status) status.style.display = '';
        if (contributionInput) contributionInput.style.display = '';
        if (cooldown) cooldown.style.display = '';
        if (panel) panel.style.display = 'none';

        applyMeatTheme(false);
        stopMeatCooldownTimer();
        updateCooldownUI();
        setMeatLancelotMessage('貢献度の報告に戻るんだな。了解したぞ、団長。', 'lancelot_1.png');
    }

    function reportMeat() {
        ensureMeatState();
        const input = document.getElementById('input-meat');
        if (!input) return;

        const inputValStr = input.value.trim();
        if (inputValStr === '' || !/^\d+$/.test(inputValStr)) {
            setMeatLancelotMessage('団長、その肉数はうまく読めないぞ。数字だけで入力してくれ。', 'lancelot_2.png');
            return;
        }

        const inputVal = Number(inputValStr);
        if (!Number.isSafeInteger(inputVal) || inputVal < 0 || inputVal > MEAT_MAX_TOTAL) {
            setMeatLancelotMessage('肉集めスタンプラリーは15,000個までだぞ。入力を確認してくれ。', 'lancelot_2.png');
            return;
        }

        const cooldownRemaining = getMeatCooldownRemaining();
        if (cooldownRemaining > 0) {
            const remainMin = Math.ceil(cooldownRemaining / 1000 / 60);
            setMeatLancelotMessage(`少し休憩したらどうだ？ 次の肉報告まであと ${remainMin} 分だ。`, 'lancelot_1.png');
            updateMeatCooldownUI();
            return;
        }

        if (inputVal < state.meatTotal) {
            setMeatLancelotMessage('団長、肉が減っているようだが……食べたのか？', 'lancelot_5.png');
            return;
        }

        if (inputVal === state.meatTotal) {
            setMeatLancelotMessage('前回と同じ数だな。新しく集めたらまた教えてくれ。', 'lancelot_1.png');
            return;
        }

        const previousStampCount = getStampCount();
        const diff = inputVal - state.meatTotal;
        state.meatTotal = inputVal;
        state.highestMeatTotal = Math.max(state.highestMeatTotal, inputVal);
        state.meatReportCount++;
        state.meatLastReportTime = Date.now();

        const currentStampCount = getStampCount();
        const rewardResult = unlockEligibleStampRewards(true);

        const resultLines = [
            `肉を ${diff.toLocaleString()}個 報告したぞ。`,
            `累計 ${state.meatTotal.toLocaleString()}個。`
        ];

        if (currentStampCount > previousStampCount) {
            const added = currentStampCount - previousStampCount;
            resultLines.push(`スタンプが${added}個増えた！　現在 ${currentStampCount} / 15。`);
        }

        resultLines.push(...rewardResult.lines);
        if (state.meatTotal >= MEAT_MAX_TOTAL) {
            resultLines.push('15,000個達成！ 肉集めスタンプラリーコンプリート！');
        }

        if (rewardResult.unlockedSomething) {
            renderItems();
        }

        updateUI();
        saveGame();
        renderMeatPanel({ lines: resultLines });
        startMeatCooldownTimer();

        const reaction = getRandomReportLine();
        setMeatLancelotMessage(reaction.msg, reaction.img);
    }

    function initMeatMode() {
        ensureMeatState();
        ensureMeatThemeStyle();

        const rewardResult = unlockEligibleStampRewards(false);
        if (rewardResult.changed) {
            renderItems();
            saveGame();
        }

        renderMeatPanel();

        const mainTabs = document.querySelectorAll('#main-nav .tab-item');
        mainTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                if (index === 0 && isMeatPanelOpen()) {
                    applyMeatTheme(true);
                } else if (index !== 0) {
                    applyMeatTheme(false);
                }
            });
        });
    }

    window.initMeatMode = initMeatMode;
    window.openMeatMode = openMeatMode;
    window.closeMeatMode = closeMeatMode;
    window.reportMeat = reportMeat;
})();
