// ============================================================
// 肉スタンプラリー限定報酬：items.js 追加用定義
// meatRewardOnly: true は通常ショップに表示しないためのフラグです。
// 対応するPNGファイルも同じ階層へ追加してください。
// ============================================================

// ITEM_DB.setup の末尾へ追加
{ id: 'meat9000',  name: '肉集め遠征服',     file: 'meat_9000.png',  type: 'setup', meatRewardOnly: true },
{ id: 'meat15000', name: '伝説の肉集め騎士', file: 'meat_15000.png', type: 'setup', meatRewardOnly: true },

// ITEM_DB.acc の末尾へ追加
{ id: 'meat3000',  name: '肉集め隊の腕章',   file: 'meat_3000.png',  type: 'acc', meatRewardOnly: true },
{ id: 'meat12000', name: '肉マスターの勲章', file: 'meat_12000.png', type: 'acc', meatRewardOnly: true },

// ITEM_DB.bg の末尾へ追加
{ id: 'meat6000', name: '肉集めキャンプ', file: 'meat_6000.png', type: 'bg', meatRewardOnly: true },
