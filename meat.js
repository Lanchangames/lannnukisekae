(() => {
    const MEAT_BOX_STEP = 200;
    const MEAT_MAX_TOTAL = 1000000;
    const MEAT_COOLDOWN_MS = 15 * 60 * 1000;
    let meatTimerInterval = null;

    const MEAT_PICKUPS = [
        { id: 'sandwich', name: 'サンドイッチ', weight: 7.5, rarity: 'common', img: 'lancelot_1.png', msg: '腹ごしらえにはちょうどよさそうだな。肉集めの途中で食べてしまわないようにな。' },
        { id: 'cookie', name: 'クッキー', weight: 7.5, rarity: 'common', img: 'lancelot_1.png', msg: 'クッキーか。休憩の時に食べるといい。' },
        { id: 'apple', name: 'りんご', weight: 7.5, rarity: 'common', img: 'lancelot_1.png', msg: 'りんごだな。肉ばかりでなく、こういうものも必要だぞ。' },
        { id: 'unknown_meat', name: 'よくわからない肉', weight: 7.5, rarity: 'common', img: 'lancelot_5.png', msg: '……これは本当に食べられるものなのか？' },
        { id: 'broken_sword', name: '折れた剣', weight: 7.5, rarity: 'common', img: 'lancelot_6.png', msg: '折れてはいるが、悪くない剣だな。少し見せてもらってもいいか？' },
        { id: 'used_shield', name: '使い込まれた盾', weight: 7.5, rarity: 'common', img: 'lancelot_6.png', msg: 'ずいぶん使い込まれているな。誰かが落としたんだろうか。' },
        { id: 'monster_fang', name: '魔物の牙', weight: 7.5, rarity: 'common', img: 'lancelot_1.png', msg: '魔物の牙か。古戦場らしい拾いものだな。' },
        { id: 'mystery_stone', name: '謎の石', weight: 7.5, rarity: 'common', img: 'lancelot_5.png', msg: '……石だな。いや、何かあるのかもしれないが、今のところは石だ。' },

        { id: 'pudding', name: 'プリン', weight: 5, rarity: 'uncommon', img: 'lancelot_8.png', msg: '……これは俺が預かっておこう。いや、別に食べたいわけではないぞ。' },
        { id: 'crab', name: 'カニ', weight: 5, rarity: 'uncommon', img: 'lancelot_5.png', msg: '団長、肉を集めていたんじゃなかったのか？' },
        { id: 'helmet', name: '誰かの兜', weight: 5, rarity: 'uncommon', img: 'lancelot_1.png', msg: '誰かの兜だな。持ち主が探しているかもしれない。' },
        { id: 'potion_like', name: 'ポーションらしきもの', weight: 5, rarity: 'uncommon', img: 'lancelot_5.png', msg: '「らしきもの」というのが少し気になるな。飲む前によく確認してくれ。' },
        { id: 'forgotten_item', name: '誰かの忘れ物', weight: 5, rarity: 'uncommon', img: 'lancelot_1.png', msg: '忘れ物か。あとで持ち主が分かる場所に置いておこう。' },

        { id: 'small_coin_bag', name: '小袋のコイン', weight: 2.5, rarity: 'rare', coins: 100, img: 'lancelot_1.png', msg: 'コインまで落ちていたのか。団長の運もなかなかだな。' },
        { id: 'large_coin_bag', name: '少し大きいコイン袋', weight: 2.5, rarity: 'rare', coins: 300, img: 'lancelot_6.png', msg: 'これは結構入っているな。大事に使うんだぞ。' },
        { id: 'tiny_crab', name: '小さなカニ', weight: 2.5, rarity: 'rare', img: 'lancelot_5.png', msg: '……またカニか。しかも今度は小さいな。' },
        { id: 'well_shaped_meat', name: 'やけに形のいい肉', weight: 2.5, rarity: 'rare', img: 'lancelot_1.png', msg: '妙に形が整っているな。飾っておきたくなる気持ちは……少し分かる。' },

        { id: 'glowing_meat', name: '光っている肉', weight: 2, rarity: 'veryRare', img: 'lancelot_6.png', msg: '団長。その肉、光っているぞ。……本当に肉なのか？' },
        { id: 'golden_fork', name: '金色のフォーク', weight: 2, rarity: 'veryRare', img: 'lancelot_6.png', msg: 'ずいぶん立派なフォークだな。肉集めで見つかるものなのか、これは。' },

        { id: 'meat_paper', name: '「肉」と書かれた紙', weight: 1, rarity: 'mystery', img: 'lancelot_2.png', msg: '団長。これは肉ではないぞ。' }
    ];

    const MEAT_MILESTONES = [
        { amount: 100, msg: '100個か。いい滑り出しだな、団長。まずは無理なく集めていこう。', img: 'lancelot_1.png' },
        { amount: 500, coins: 300, msg: '500個到達だな。少しだが、補給の足しにしてくれ。', img: 'lancelot_1.png' },
        { amount: 1000, itemId: 'acc78', duplicateCoins: 250, msg: '1000個！記念に「漫画肉」をクローゼットに入れておいたぞ。', img: 'lancelot_6.png' },
        { amount: 2000, msg: '2000個も集めたのか。これなら戦いの準備もかなり進んだな。', img: 'lancelot_1.png' },
        { amount: 3000, itemId: 'bg47', duplicateCoins: 300, msg: '3000個到達だ。肉を置く場所が必要そうだから「倉庫」を使ってくれ。', img: 'lancelot_5.png' },
        { amount: 5000, itemId: 'clothes12', duplicateCoins: 500, msg: '5000個……！記念に「光古戦場ボスのきぐるみ」を用意したぞ。', img: 'lancelot_6.png' },
        { amount: 7500, guaranteedRare: 1, msg: '7500個到達だ。今日は珍しいものが見つかりそうな気がするな。', img: 'lancelot_1.png' },
        { amount: 10000, coins: 800, msg: '10000個！？団長、一体どれだけ周回したんだ……。本当にお疲れさま。', img: 'lancelot_4.png' },
        { amount: 15000, coins: 1000, guaranteedRare: 1, msg: '15000個か。ここまで来ると、肉集めというより一つの偉業だな。', img: 'lancelot_6.png' },
        { amount: 20000, guaranteedPickupId: 'meat_paper', msg: '20000個到達おめでとう。……それで最後に見つかったのがこれなのか？「肉」と書かれた紙……？', img: 'lancelot_2.png' }
    ];

    function ensureMeatState() {
        if (!Number.isSafeInteger(state.meatTotal) || state.meatTotal < 0) state.meatTotal = 0;
        if (!Number.isSafeInteger(state.highestMeatTotal) || state.highestMeatTotal < 0) state.highestMeatTotal = state.meatTotal;
        if (!Number.isSafeInteger(state.meatReportCount) || state.meatReportCount < 0) state.meatReportCount = 0;
        if (!state.meatRewardReceived || typeof state.meatRewardReceived !== 'object' || Array.isArray(state.meatRewardReceived)) state.meatRewardReceived = {};
        if (!state.meatCollection || typeof state.meatCollection !== 'object' || Array.isArray(state.meatCollection)) state.meatCollection = {};
        if (!Number.isSafeInteger(state.meatGiftCount) || state.meatGiftCount < 0) state.meatGiftCount = 0;
        if (!Number.isSafeInteger(state.meatBoxProgress) || state.meatBoxProgress < 0) state.meatBoxProgress = 0;
        if (!Number.isSafeInteger(state.meatLastReportTime) || state.meatLastReportTime < 0) state.meatLastReportTime = 0;
        state.meatBoxProgress %= MEAT_BOX_STEP;
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

    function syncMeatEntryButtonWidth() {
        const entry = document.getElementById('meat-mode-entry');
        const reportButton = document.getElementById('btn-report');
        if (!entry || !reportButton) return;

        const width = reportButton.getBoundingClientRect().width;
        if (width > 0) entry.style.width = `${width}px`;
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

    function getCollectionUniqueCount() {
        return MEAT_PICKUPS.reduce((count, item) => count + ((state.meatCollection[item.id] || 0) > 0 ? 1 : 0), 0);
    }

    function getCollectionTotalCount() {
        return MEAT_PICKUPS.reduce((count, item) => count + (state.meatCollection[item.id] || 0), 0);
    }

    function drawWeightedPickup(pool = MEAT_PICKUPS) {
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const item of pool) {
            if (roll < item.weight) return item;
            roll -= item.weight;
        }
        return pool[pool.length - 1];
    }

    function awardPickup(item) {
        if (!item) return { name: '', coins: 0, item: null };
        state.meatCollection[item.id] = (state.meatCollection[item.id] || 0) + 1;
        let coins = 0;
        if (item.coins) {
            coins = item.coins;
            state.coins += coins;
        }
        return { name: item.name, coins, item };
    }

    function awardGuaranteedRare() {
        const rarePool = MEAT_PICKUPS.filter(item => ['rare', 'veryRare', 'mystery'].includes(item.rarity));
        return awardPickup(drawWeightedPickup(rarePool));
    }

    function awardGuaranteedPickup(id) {
        return awardPickup(MEAT_PICKUPS.find(item => item.id === id));
    }

    function setMeatLancelotMessage(msg, img = 'lancelot_1.png') {
        currentLancelotImg = img;
        setLancelotMessage(msg);
        updateLancelotImage();
    }

    function processMilestones(previousTotal, newTotal) {
        const result = {
            lines: [],
            pickups: [],
            lastMessage: null,
            lastImage: null,
            unlockedSomething: false
        };

        MEAT_MILESTONES.forEach(reward => {
            const key = String(reward.amount);
            if (newTotal < reward.amount || state.meatRewardReceived[key]) return;

            state.meatRewardReceived[key] = true;
            result.lines.push(`累計 ${reward.amount.toLocaleString()}個 到達！`);

            if (reward.coins) {
                state.coins += reward.coins;
                result.lines.push(`＋${reward.coins.toLocaleString()}コイン`);
            }

            if (reward.itemId) {
                const item = findItemById(reward.itemId);
                if (item) {
                    if (state.unlocked[reward.itemId]) {
                        const compensation = reward.duplicateCoins || 0;
                        if (compensation > 0) {
                            state.coins += compensation;
                            result.lines.push(`${item.name}は取得済みだったため＋${compensation.toLocaleString()}コイン`);
                        } else {
                            result.lines.push(`${item.name}は取得済み`);
                        }
                    } else {
                        state.unlocked[reward.itemId] = true;
                        result.lines.push(`「${item.name}」を解放`);
                        result.unlockedSomething = true;
                    }
                }
            }

            for (let i = 0; i < (reward.guaranteedRare || 0); i++) {
                const pickup = awardGuaranteedRare();
                if (pickup.item) {
                    result.pickups.push(pickup);
                    result.lines.push(`珍しい拾いもの確定：「${pickup.name}」`);
                }
            }

            if (reward.guaranteedPickupId) {
                const pickup = awardGuaranteedPickup(reward.guaranteedPickupId);
                if (pickup.item) {
                    result.pickups.push(pickup);
                    result.lines.push(`拾いもの：「${pickup.name}」`);
                }
            }

            result.lastMessage = reward.msg;
            result.lastImage = reward.img;
        });

        return result;
    }

    function getNormalReportReaction(diff) {
        if (diff >= 3000) {
            return { img: 'lancelot_4.png', msg: '待ってくれ団長。その量を一度に集めたのか……？少し休んだ方がいいんじゃないか？' };
        }
        if (diff >= 1000) {
            return { img: 'lancelot_6.png', msg: 'こんなに集めたのか！？団長は本当に働き者だな。' };
        }
        if (diff >= 300) {
            return { img: 'lancelot_1.png', msg: 'ずいぶん集まったな。これなら戦いの準備も万全だ。' };
        }
        return { img: 'lancelot_1.png', msg: '肉集めお疲れさま、団長。無理せず続けよう。' };
    }

    function renderMeatPanel(result = null) {
        ensureMeatState();
        const panel = document.getElementById('meat-mode-panel');
        if (!panel) return;

        const uniqueCount = getCollectionUniqueCount();
        const totalFinds = getCollectionTotalCount();
        const remaining = state.meatBoxProgress === 0 ? MEAT_BOX_STEP : MEAT_BOX_STEP - state.meatBoxProgress;

        const obtained = MEAT_PICKUPS
            .filter(item => (state.meatCollection[item.id] || 0) > 0)
            .map(item => `<span style="display:inline-block; margin:2px 6px 2px 0; padding:5px 8px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-size:12px;">${escapeHtml(item.name)} ×${state.meatCollection[item.id]}</span>`)
            .join('');

        let resultHtml = '';
        if (result && result.lines && result.lines.length > 0) {
            resultHtml = `
                <div style="padding: 12px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; font-size: 13px; line-height: 1.7;">
                    ${result.lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
                </div>`;
        }

        panel.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <h3 style="margin:0;">🥩 肉集めモード</h3>
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
                        <span class="label">🎁 拾ったもの</span>
                        <span class="val">${uniqueCount} / ${MEAT_PICKUPS.length}</span>
                    </div>
                </div>

                <div class="input-group">
                    <input type="number" id="input-meat" placeholder="現在の累計肉数を入力" onkeydown="if(['e', 'E', '+', '-', '.'].includes(event.key)) event.preventDefault();">
                    <button id="btn-meat-report" onclick="reportMeat()" style="min-width:130px;">肉を報告する</button>
                </div>

                <div id="meat-cooldown-text" style="color:#c0392b; font-size:13px; font-weight:bold; min-height:20px; display:flex; align-items:center;"></div>

                <div style="font-size:12px; color:#64748b; line-height:1.6;">
                    肉${MEAT_BOX_STEP}個増加ごとに、肉集め中の拾いものを1回抽選します。<br>
                    次の抽選まであと ${remaining.toLocaleString()}個 ／ 拾いもの総数 ${totalFinds.toLocaleString()}個
                </div>

                ${resultHtml}

                <div style="padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px;">
                    <div style="font-size:13px; font-weight:bold; margin-bottom:8px;">拾ったもの（取得済み）</div>
                    <div>${obtained || '<span style="font-size:12px; color:#64748b;">まだ何も拾っていないぞ。</span>'}</div>
                </div>
            </div>`;

        syncMeatEntryButtonWidth();
        updateMeatCooldownUI();
    }

    function openMeatMode() {
        ensureMeatState();
        const sectionTop = document.getElementById('section-top');
        if (!sectionTop) return;

        const status = sectionTop.querySelector('.status-container');
        const contributionInput = sectionTop.querySelector(':scope > .input-group');
        const cooldown = document.getElementById('cooldown-text');
        const entry = document.getElementById('meat-mode-entry');
        const panel = document.getElementById('meat-mode-panel');

        if (status) status.style.display = 'none';
        if (contributionInput) contributionInput.style.display = 'none';
        if (cooldown) cooldown.style.display = 'none';
        if (entry) entry.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        sectionTop.style.backgroundColor = '#fff2f2';

        renderMeatPanel();
        startMeatCooldownTimer();
        setMeatLancelotMessage('肉集めの報告だな。今日は何が見つかるだろうな？', 'lancelot_1.png');
    }

    function closeMeatMode() {
        const sectionTop = document.getElementById('section-top');
        if (!sectionTop) return;

        const status = sectionTop.querySelector('.status-container');
        const contributionInput = sectionTop.querySelector(':scope > .input-group');
        const cooldown = document.getElementById('cooldown-text');
        const entry = document.getElementById('meat-mode-entry');
        const panel = document.getElementById('meat-mode-panel');

        if (status) status.style.display = '';
        if (contributionInput) contributionInput.style.display = '';
        if (cooldown) cooldown.style.display = '';
        if (entry) entry.style.display = '';
        if (panel) panel.style.display = 'none';
        sectionTop.style.backgroundColor = '';
        stopMeatCooldownTimer();
        syncMeatEntryButtonWidth();

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
            setMeatLancelotMessage('その数はさすがに多すぎないか……？入力を確認してくれ。', 'lancelot_2.png');
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

        const previousTotal = state.meatTotal;
        const diff = inputVal - previousTotal;
        state.meatTotal = inputVal;
        state.highestMeatTotal = Math.max(state.highestMeatTotal, inputVal);
        state.meatReportCount++;
        state.meatLastReportTime = Date.now();

        const progressTotal = state.meatBoxProgress + diff;
        const drawCount = Math.floor(progressTotal / MEAT_BOX_STEP);
        state.meatBoxProgress = progressTotal % MEAT_BOX_STEP;

        const pickupResults = [];
        let pickupCoins = 0;
        let lastPickup = null;

        for (let i = 0; i < drawCount; i++) {
            const pickup = awardPickup(drawWeightedPickup());
            if (pickup.item) {
                pickupResults.push(pickup);
                pickupCoins += pickup.coins;
                lastPickup = pickup.item;
            }
        }

        const milestoneResult = processMilestones(previousTotal, inputVal);
        milestoneResult.pickups.forEach(pickup => {
            pickupResults.push(pickup);
            pickupCoins += pickup.coins;
            if (pickup.item) lastPickup = pickup.item;
        });

        const counts = {};
        pickupResults.forEach(pickup => {
            if (!pickup.item) return;
            counts[pickup.item.id] = (counts[pickup.item.id] || 0) + 1;
        });

        const resultLines = [
            `肉を ${diff.toLocaleString()}個 報告したぞ。`,
            `累計 ${state.meatTotal.toLocaleString()}個。`
        ];

        if (drawCount > 0) {
            resultLines.push(`拾いもの抽選 ${drawCount}回。`);
        } else {
            resultLines.push(`次の拾いもの抽選まであと ${(MEAT_BOX_STEP - state.meatBoxProgress).toLocaleString()}個。`);
        }

        Object.keys(counts).forEach(id => {
            const item = MEAT_PICKUPS.find(entry => entry.id === id);
            if (item) resultLines.push(`「${item.name}」×${counts[id]}`);
        });

        if (pickupCoins > 0) {
            resultLines.push(`拾いものから＋${pickupCoins.toLocaleString()}コイン`);
        }

        resultLines.push(...milestoneResult.lines);

        if (milestoneResult.unlockedSomething) {
            renderItems();
        }

        updateUI();
        saveGame();
        renderMeatPanel({ lines: resultLines });
        startMeatCooldownTimer();

        if (milestoneResult.lastMessage) {
            setMeatLancelotMessage(milestoneResult.lastMessage, milestoneResult.lastImage || 'lancelot_1.png');
        } else if (lastPickup) {
            setMeatLancelotMessage(lastPickup.msg, lastPickup.img || 'lancelot_1.png');
        } else {
            const reaction = getNormalReportReaction(diff);
            setMeatLancelotMessage(reaction.msg, reaction.img);
        }
    }

    function initMeatMode() {
        ensureMeatState();
        renderMeatPanel();
        syncMeatEntryButtonWidth();
    }

    window.addEventListener('resize', syncMeatEntryButtonWidth);

    window.initMeatMode = initMeatMode;
    window.openMeatMode = openMeatMode;
    window.closeMeatMode = closeMeatMode;
    window.reportMeat = reportMeat;
})();
