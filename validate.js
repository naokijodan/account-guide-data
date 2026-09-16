#!/usr/bin/env node
/**
 * validate.js — steps.json の内容チェック（依存パッケージなし）
 *
 * 使い方: node validate.js
 * data/steps.json を読み込み、以下をチェックする。
 *   - 必須フィールドの有無（version / updatedAt / phases、phase側、step側）
 *   - pillar が6つの柱のいずれかに一致するか
 *   - site が ebay / payoneer / general のいずれかか
 *   - pasteFields のキーが固定語彙の中にあるか
 *   - id（phase・step とも）が重複していないか
 *   - links が https のみで、許可したホスト（ebay.com / ebay.co.jp / payoneer.com）のみか
 *   - "http://" を含んでいないか
 *   - updatedAt が YYYY-MM-DD 形式か
 * 最後に phases数 / steps数 / branchesを持つstep数 / checklist=trueのstep数 を表示する。
 */

const fs = require("fs");
const path = require("path");

const STEPS_PATH = path.join(__dirname, "steps.json");

const PILLARS = [
  "環境の準備",
  "eBayアカウント作成",
  "Payoneer登録",
  "eBayに戻ってカード情報・住所",
  "Payoneer本人確認書類",
  "完了チェック・セラーポータル",
];

const SITES = ["ebay", "payoneer", "general"];

const PASTE_FIELDS = [
  "firstName",
  "lastName",
  "fullNameFirstLast",
  "fullNameUpperFirstLast",
  "fullNameUpperLastFirst",
  "addressLine1",
  "streetNumbersOnly",
  "addressLine2",
  "city",
  "state",
  "zipDash",
  "zipDigits",
  "phoneIntl",
  "phoneNational",
  "phoneDomestic",
  "nameKatakanaFirst",
  "nameKatakanaLast",
  "nameKatakanaFull",
];

const ALLOWED_LINK_HOSTS = ["ebay.com", "www.ebay.com", "ebay.co.jp", "www.ebay.co.jp", "payoneer.com", "www.payoneer.com"];

const TOP_REQUIRED = ["version", "updatedAt", "phases"];
const PHASE_REQUIRED = ["id", "pillar", "title", "steps"];
const STEP_REQUIRED = [
  "id",
  "site",
  "title",
  "studentText",
  "instructorText",
  "image",
  "links",
  "pasteFields",
  "branches",
  "checklist",
];

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

let raw;
try {
  raw = fs.readFileSync(STEPS_PATH, "utf8");
} catch (e) {
  console.error("ERROR: steps.json を読み込めませんでした:", e.message);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error("ERROR: steps.json のJSONパースに失敗しました:", e.message);
  process.exit(1);
}

// --- トップレベル必須フィールド ---
for (const key of TOP_REQUIRED) {
  if (!(key in data)) fail(`トップレベルに必須フィールド "${key}" がありません`);
}

if (typeof data.updatedAt === "string") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt)) {
    fail(`updatedAt の形式が YYYY-MM-DD ではありません: "${data.updatedAt}"`);
  }
} else if ("updatedAt" in data) {
  fail("updatedAt が文字列ではありません");
}

if (!Array.isArray(data.phases)) {
  fail("phases が配列ではありません（以降のチェックを中断します）");
  console.error(errors.join("\n"));
  process.exit(1);
}

const phaseIds = new Set();
const stepIds = new Set();

let totalSteps = 0;
let stepsWithBranches = 0;
let stepsChecklistTrue = 0;

for (const [pi, phase] of data.phases.entries()) {
  const phaseLabel = `phases[${pi}]`;

  for (const key of PHASE_REQUIRED) {
    if (!(key in phase)) fail(`${phaseLabel} に必須フィールド "${key}" がありません`);
  }

  if (typeof phase.id === "string") {
    if (phaseIds.has(phase.id)) {
      fail(`phase id が重複しています: "${phase.id}"`);
    }
    phaseIds.add(phase.id);
  } else {
    fail(`${phaseLabel}.id が文字列ではありません`);
  }

  if (typeof phase.pillar === "string") {
    if (!PILLARS.includes(phase.pillar)) {
      fail(`${phaseLabel}(${phase.id}).pillar が不正な値です: "${phase.pillar}"`);
    }
  } else {
    fail(`${phaseLabel}(${phase.id}).pillar が文字列ではありません`);
  }

  if (!Array.isArray(phase.steps)) {
    fail(`${phaseLabel}(${phase.id}).steps が配列ではありません`);
    continue;
  }

  for (const [si, step] of phase.steps.entries()) {
    totalSteps++;
    const stepLabel = `${phaseLabel}.steps[${si}]`;

    for (const key of STEP_REQUIRED) {
      if (!(key in step)) fail(`${stepLabel} (id想定: ${step.id || "不明"}) に必須フィールド "${key}" がありません`);
    }

    if (typeof step.id === "string") {
      if (stepIds.has(step.id)) {
        fail(`step id が重複しています: "${step.id}"`);
      }
      stepIds.add(step.id);
    } else {
      fail(`${stepLabel}.id が文字列ではありません`);
    }

    if (typeof step.site === "string") {
      if (!SITES.includes(step.site)) {
        fail(`step "${step.id}".site が不正な値です: "${step.site}"`);
      }
    } else {
      fail(`step "${step.id}".site が文字列ではありません`);
    }

    if (typeof step.studentText !== "string" || step.studentText.trim() === "") {
      fail(`step "${step.id}".studentText が空です`);
    }

    if (typeof step.instructorText !== "string") {
      fail(`step "${step.id}".instructorText が文字列ではありません`);
    }

    if (Array.isArray(step.pasteFields)) {
      for (const pf of step.pasteFields) {
        if (!PASTE_FIELDS.includes(pf)) {
          fail(`step "${step.id}".pasteFields に語彙外のキーがあります: "${pf}"`);
        }
      }
    } else {
      fail(`step "${step.id}".pasteFields が配列ではありません`);
    }

    if (Array.isArray(step.links)) {
      for (const link of step.links) {
        if (!link || typeof link.label !== "string" || typeof link.url !== "string") {
          fail(`step "${step.id}".links の要素に label/url がありません`);
          continue;
        }
        if (link.url.startsWith("http://")) {
          fail(`step "${step.id}".links に http:// のURLがあります: "${link.url}"`);
          continue;
        }
        if (!link.url.startsWith("https://")) {
          fail(`step "${step.id}".links のURLがhttps://で始まっていません: "${link.url}"`);
          continue;
        }
        let host = "";
        try {
          host = new URL(link.url).hostname;
        } catch (e) {
          fail(`step "${step.id}".links のURLが不正です: "${link.url}"`);
          continue;
        }
        if (!ALLOWED_LINK_HOSTS.includes(host)) {
          fail(`step "${step.id}".links に許可外のホストがあります: "${host}" (${link.url})`);
        }
      }
    } else {
      fail(`step "${step.id}".links が配列ではありません`);
    }

    if (Array.isArray(step.branches)) {
      if (step.branches.length > 0) stepsWithBranches++;
      for (const b of step.branches) {
        if (!b || typeof b.condition !== "string" || typeof b.text !== "string") {
          fail(`step "${step.id}".branches の要素に condition/text がありません`);
        }
      }
    } else {
      fail(`step "${step.id}".branches が配列ではありません`);
    }

    if (typeof step.checklist === "boolean") {
      if (step.checklist) stepsChecklistTrue++;
    } else {
      fail(`step "${step.id}".checklist が真偽値ではありません`);
    }

    if ("notice" in step && (typeof step.notice !== "string" || step.notice.trim() === "")) {
      fail(`step "${step.id}".notice がある場合は空でない文字列である必要があります`);
    }

    // 全体で "http://" 混入チェック（テキスト中も含む）
    const flatText = JSON.stringify(step);
    if (flatText.includes("http://")) {
      warn(`step "${step.id}" のどこかに "http://" という文字列が含まれています（リンク以外の可能性あり、要確認）`);
    }
  }
}

// --- 結果出力 ---
console.log("=== validate.js 実行結果 ===");
if (errors.length === 0) {
  console.log("PASS: エラーはありませんでした。");
} else {
  console.log(`FAIL: ${errors.length} 件のエラーがあります。`);
  for (const e of errors) console.log(" - " + e);
}

if (warnings.length > 0) {
  console.log(`\n警告 ${warnings.length} 件:`);
  for (const w of warnings) console.log(" - " + w);
}

console.log("\n=== カウント ===");
console.log(`phases: ${data.phases.length}`);
console.log(`steps: ${totalSteps}`);
console.log(`steps with branches: ${stepsWithBranches}`);
console.log(`checklist steps (checklist=true): ${stepsChecklistTrue}`);

process.exit(errors.length === 0 ? 0 : 1);
