# data/ フォルダについて（椛島さん向け）

このフォルダには、サイドパネル・ウィザード拡張機能（アカウント開設ガイド君／仮称）が読み込む「手順データ」が入っています。拡張機能のコード本体はこのフォルダを触らず、ここにあるJSONを読み込んで表示するだけです。手順の文言を直したいときは、このフォルダの `steps.json` を編集してください。

## ファイル一覧

| ファイル | 内容 |
|---|---|
| `steps.json` | 本体データ。①〜⑥の柱ごとに手順（ステップ）が入っている |
| `schema.json` | `steps.json` の形式ルール（JSON Schema）。人が読むものではなく、チェック用 |
| `validate.js` | `steps.json` の中身が正しいかを機械でチェックするスクリプト |
| `README.md` | このファイル |

---

## 1. steps.json の構造・フィールドの意味

```json
{
  "version": "2026.09.1",
  "updatedAt": "2026-09-16",
  "phases": [
    {
      "id": "phase2-ebay-start",
      "pillar": "eBayアカウント作成",
      "title": "eBay言語設定とアカウント作成開始",
      "steps": [
        {
          "id": "p2-s01",
          "site": "ebay",
          "title": "ebay.comにアクセス",
          "studentText": "受講生向けの案内文（平易な日本語）",
          "instructorText": "講師用マニュアルの声掛け文そのまま（なければ空文字）",
          "image": "",
          "links": [{"label": "eBay公式サイト", "url": "https://www.ebay.com/"}],
          "pasteFields": ["fullNameFirstLast"],
          "branches": [
            {"condition": "この画面が出たら〜の条件", "text": "その場合の案内文"}
          ],
          "checklist": true
        }
      ]
    }
  ]
}
```

### トップレベル

| フィールド | 意味 |
|---|---|
| `version` | データのバージョン番号。更新するたびに上げる（例：`2026.09.1` → `2026.09.2`） |
| `updatedAt` | 更新日。`YYYY-MM-DD` 形式（例：`2026-09-16`） |
| `phases` | 柱（①〜⑥）ごとのまとまりの配列 |

### phase（`phases[]` の各要素）

| フィールド | 意味 |
|---|---|
| `id` | フェーズの識別子。他と重複しないこと（例：`phase4-payoneer-basic`） |
| `pillar` | 6つの柱のどれか（下記の固定値のみ使用可）。誤字があるとチェックで弾かれる |
| `title` | フェーズの見出し |
| `steps` | このフェーズに含まれるステップの配列 |

`pillar` に使える値（この6つ以外はエラーになります）：
- `環境の準備`
- `eBayアカウント作成`
- `Payoneer登録`
- `eBayに戻ってカード情報・住所`
- `Payoneer本人確認書類`
- `完了チェック・セラーポータル`

### step（`steps[]` の各要素）

| フィールド | 意味 |
|---|---|
| `id` | ステップの識別子。全体で重複しないこと（例：`p5-s01`） |
| `site` | `ebay` / `payoneer` / `general`（環境準備など、どちらのサイトにも属さないもの）のいずれか |
| `title` | ステップの見出し |
| `studentText` | **受講生モード**で表示する、平易な日本語の案内文 |
| `instructorText` | **講師モード**で表示する、講師用マニュアルの声掛け文そのまま。マニュアルに該当箇所がない場合は空文字 `""` |
| `image` | 案内画像のパス。v1では未使用のため常に空文字 `""` |
| `links` | 公式サイトへのリンク（新しいタブで開く想定）。`{"label": "表示名", "url": "https://..."}` の配列 |
| `pasteFields` | このステップで表示する「コピーボタン」の項目名の配列（下の表の語彙のみ使用可） |
| `branches` | 「この画面が出たら」の分岐案内。`{"condition": "条件文", "text": "その場合の案内文"}` の配列 |
| `checklist` | 完了チェック欄に表示するアクション項目なら `true`、説明だけの情報項目なら `false` |
| `notice` | （任意）画面共有の一時停止など、特に強調したい注意文。必要なステップにだけ付ける |

---

## 2. pasteFields の語彙表（コピーボタンの項目）

`pasteFields` に書けるキーはこの18個だけです。新しい項目が必要になった場合は、椛島さんの判断で増やさず、まずユーザーに確認してください（語彙を増やすと `schema.json` と `validate.js` の両方の修正が必要です）。

| キー | 何が入るか（出力の形） |
|---|---|
| `firstName` | 名（下の名前）のローマ字。例：Taro |
| `lastName` | 姓（苗字）のローマ字。例：Yamada |
| `fullNameFirstLast` | フルネーム、名→姓の順。例：Taro Yamada（eBayのBusiness Name欄など） |
| `fullNameUpperFirstLast` | フルネーム大文字、名→姓の順。例：TARO YAMADA |
| `fullNameUpperLastFirst` | フルネーム大文字、姓→名の順。例：YAMADA TARO |
| `addressLine1` | eBay Street Address用。番地＋町名ローマ字（例：16-1 Hanaten-higashi） |
| `streetNumbersOnly` | Payoneer住所1用。番地の数字＋丁目の数字のみ、町名なし。例：「16-1 4」 |
| `addressLine2` | 建物名（アルファベット）＋部屋番号。例：ABC Mansion 101 |
| `city` | 市区町村名（ローマ字）。例：Matsudo-shi |
| `state` | 都道府県名（ローマ字）。例：Chiba |
| `zipDash` | 郵便番号、ハイフンあり。例：123-4567 |
| `zipDigits` | 郵便番号、ハイフンなし。例：1234567 |
| `phoneIntl` | 電話番号、国際表記（+81付き）。例：+81 80 1234 5678 |
| `phoneNational` | 電話番号、国内表記だが先頭の0を除いたもの。例：8012345678（eBay初回SMS認証・Payoneer用） |
| `phoneDomestic` | 電話番号、先頭の0を残した国内表記。例：08012345678（eBay Phase6 Phone Number欄用） |
| `nameKatakanaFirst` | 名のカタカナ表記そのまま。例：タロウ（Payoneer「現地語での名」用） |
| `nameKatakanaLast` | 姓のカタカナ表記そのまま。例：ヤマダ（Payoneer「現地語での姓」用） |
| `nameKatakanaFull` | 氏名のカタカナ、姓と名の間にスペース。例：ヤマダ タロウ（Payoneer口座名義用） |

**注意（要確認扱いのまま残っている点）：**
- `streetNumbersOnly`（Payoneer住所1）は、実際のPayoneer画面で「町名なし」が本当に正しいかどうか、まだ実機確認していません（設計書 §4-4参照）。実機確認の結果、仕様が変わる可能性があります。
- `zipDash` はeBay側がハイフンあり／なしどちらを求めるか、マニュアルに明記がないため未確認です。

---

## 3. 編集の仕方

1. `steps.json` をテキストエディタで開く
2. 直したいステップの `studentText` や `instructorText` を書き換える（JSON形式を崩さないよう、ダブルクォート `"` の対応に注意）
3. 保存したら、次の「4. チェックのやり方」を必ず実行する
4. エラーがなければ完了。`version` を上げ、`updatedAt` を今日の日付に更新する

**やってはいけないこと：**
- `pillar` に6つの柱以外の文字列を入れる
- `site` に `ebay` / `payoneer` / `general` 以外を入れる
- `pasteFields` に上の18個の語彙にないキーを入れる
- `links` に `http://`（暗号化なし）のURLや、eBay/Payoneer公式以外のURLを入れる
- 同じ `id` を2つ以上のステップ・フェーズに使う

---

## 4. チェックのやり方（validate.js）

ターミナルで `data` フォルダに移動して実行します（Node.jsが入っていれば追加インストール不要）。

```bash
cd "/Users/naokijodan/Desktop/アカウント開設ガイド君/data"
node validate.js
```

正常な場合の出力例：

```
=== validate.js 実行結果 ===
PASS: エラーはありませんでした。

=== カウント ===
phases: 9
steps: 77
steps with branches: 8
checklist steps (checklist=true): 72
```

エラーがある場合は `FAIL: n件のエラーがあります。` の下に、どのステップの何がおかしいかが日本語で1行ずつ出ます。エラーが0件になるまで直してから、拡張機能側・公開先に反映してください。

---

## 5. 公開方法（GitHub Pages）

設計書（`設計書.md` §5-3・§5-5）の方針どおり、拡張機能はこの `data` フォルダの中身をGitHub Pages経由で読み込みます。

- 椛島さんが `steps.json` を編集 → GitHubへpush → GitHub Pagesに反映、という流れです
- 拡張機能自体の再申請は不要で、次にパネルを開いたときから新しい内容が反映されます（即時反映ではなく「次回読み込み時」）
- 公開先のリポジトリ名・URLは現時点では**未決**です。決まり次第、このREADMEと拡張機能側の `host_permissions` に反映してください
- 公開前には必ず `node validate.js` でエラーが0件であることを確認してください
