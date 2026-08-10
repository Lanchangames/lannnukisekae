// info.js
const infoContentHTML = `
    <h2>遊びかた</h2>
    <p>
        非公式2次創作ゲームです。<br>
        古戦場の累計貢献度を報告してコインを獲得し、ランぬを着せ替えましょう。<br>
        iOSの場合、「ホーム画面へ追加」を推奨します。
        
    </p>

    <h2>トップ</h2>
    <p>
        現在の古戦場の累計貢献度を入力して「報告する」ボタンを押してください。<br>
        ・報告を行うとコインが貯まります。報告は20分に1度可能です。<br>
        ・貢献度の増加量が少ないと報告を断られることがあります。<br>
        ・コインの量は貢献度に依存しないので、ご自身のペースで古戦場を走ってください。<br>
        ・報告回数に応じてアイコンのランスロットの表情が変化します。<br>
        ・累計貢献度に応じてランスロットがお喋りします。セリフは約50種類あります。<br>
        ・貢献度を間違えてしまった場合は、貢献度修正ボタンで正しい数値に修正できます（コイン等は貯まりません）。
    </p>

    <h2>着せ替え</h2>
    <p>
        <strong>【ショップ】</strong><br>
        貯まったコインを使ってアイテムを解放できます。<br>
        必要なコイン数はカテゴリにより異なります。<br>
        <br>
        <strong>【クローゼット】</strong><br>
        ショップで解放したアイテムを使って、自由に着せ替えを楽しめます。<br>
        アクセサリーは同時に複数つけることができ、着用中のアイテムを再度タップすると外せます。<br>
    </p>

    <h2>データ</h2>
    <p>
        データの引継ぎやバックアップを行えます。
    </p>

    <h2>注意事項</h2>
    <p>
        データ出力を行わない限り、ブラウザの履歴削除でセーブデータが消えます。<br>
        
    </p>

    <h2>ご意見・感想はこちらから</h2>
    <p>
        感想をいただけるととても喜びます。<br>
        バグ等のご報告や、衣装追加のご要望もこちらへどうぞ。<br>
        
    </p>
    <p style="text-align: center; margin-top: 20px;">
        <a href="https://marshmallow-qa.com/oj0afz3donoawsc" target="_blank" style="text-decoration: none;">
            <button style="font-size: 18px; padding: 12px 40px; background-color: var(--accent);">気軽に送ってね</button>
        </a>
    </p>

    <h2>クレジット</h2>
    <p>
        【制作】<br>
        ろかス（@mhks_dora）<br><br>
        【イラスト】<br>
        水田しち様（@muzta7chi）<br>
        スライム様（@luminous_slime）<br>
        まりもんど様（@marimondo）<br>
        山田せろり様（@sayaenndoo）<br>
        二次元番長様（@zbbbancyo）<br>
        ろカス<br><br>
        ※順不同にて失礼いたします。<br>
        イラストを提供してくださった皆様に、この場をお借りして感謝の意と最大の敬意を表します。
    </p>

    <button onclick="hideInfo()" class="close-btn" style="font-size: 18px; padding: 12px 40px; background-color: var(--secondary);">閉じる</button>
`;
