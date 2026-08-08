// info.js
const infoContentHTML = `
    <h2>遊びかた</h2>
    <p>
        古戦場の累計貢献度を報告してコインを獲得し、アイテムを解放して自由に着せ替えを楽しむアプリです。<br>
        画面上部の「大タブ」を切り替えて遊びます。
    </p>

    <h2>トップ</h2>
    <p>
        現在の古戦場の累計貢献度を入力して「報告する」ボタンを押してください。<br>
        ・報告を行うと、コインと親愛度が貯まります。<br>
        ・貢献度を間違えてしまった場合は、「貢献度修正」ボタンで正しい数値に修正できます（コイン等は貯まりません）。
    </p>

    <h2>着せ替え</h2>
    <p>
        <strong>【ショップ】</strong><br>
        貯まったコインを使ってアイテムを解放できます。アイテムを選択するとプレビューが表示され、解放ボタンが現れます。<br>
        <br>
        <strong>【クローゼット】</strong><br>
        ショップで解放したアイテムを使って、自由に着せ替えを楽しめます。<br>
        ・アイテム一覧は枠内でスクロール可能です。<br>
        ・アクセサリーは同時に複数つけることができ、着用中のアイテムを再度タップすると外せます。
    </p>

    <h2>データ</h2>
    <p>
        データの引継ぎやバックアップを行えます。ブラウザの履歴削除などを行う前に、定期的にデータ出力（コピー）をしておくことをお勧めします。
    </p>

    <h2>注意事項</h2>
    <p>
        ・ブラウザの履歴削除を行うとセーブデータが消えます。<br>
        ・シークレットブラウザモードではセーブできません。<br>
        ・iosの場合は「ホーム画面に追加」を推奨します。
    </p>

    <h2>ご感想はこちらから</h2>
    <p style="text-align: center; margin-top: 20px;">
        <a href="https://x.com/mhks_dora/status/2082801864761016513" target="_blank" style="text-decoration: none;">
            <button style="font-size: 18px; padding: 12px 40px; background-color: var(--accent);">気軽に送ってね</button>
        </a>
    </p>

    <h2>クレジット</h2>
    <p>
        イラスト：ああああ 様
    </p>

    <button onclick="hideInfo()" class="close-btn" style="font-size: 18px; padding: 12px 40px; background-color: var(--secondary);">閉じる</button>
`;
