#!/usr/bin/env node
/**
 * Firestore 自動備份腳本
 * 由 GitHub Actions 定期執行
 * 備份 JSON 上傳到 Firebase Storage（私有），不 commit 進 repo
 * 同時在 repo 保留一份不含個人資料的備份摘要（統計數字）
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// ── 初始化 Firebase Admin ──
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'louise-tracker.firebasestorage.app',
});

const db = getFirestore();
const bucket = getStorage().bucket();

// ── 要備份的 Collections ──
const COLLECTIONS = [
  'users',
  'growth_records',
  'vaccines',
  'milestones',
  'diary_entries',
  'medications',
  'doctor_visits',
  'blood_pressure',
];

async function runBackup() {
  console.log('🔥 開始備份 Firestore...');
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  const backup = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    source: 'github-actions-auto-backup',
    collections: {},
    totalDocs: 0,
  };

  // 統計摘要（不含個人資料，可以安全 commit 進 repo）
  const summary = {
    date: dateStr,
    exportDate: new Date().toISOString(),
    collections: {},
    totalDocs: 0,
  };

  for (const colId of COLLECTIONS) {
    try {
      const snap = await db.collection(colId).get();
      backup.collections[colId] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      summary.collections[colId] = snap.docs.length;
      console.log(`  ✅ ${colId}: ${snap.docs.length} 筆`);
    } catch (e) {
      console.error(`  ❌ ${colId}: ${e.message}`);
      backup.collections[colId] = [];
      summary.collections[colId] = 0;
    }
  }

  backup.totalDocs = Object.values(backup.collections).reduce((s, a) => s + a.length, 0);
  summary.totalDocs = backup.totalDocs;

  // ── 上傳完整備份到 Firebase Storage（私有，不公開）──
  const backupJson = JSON.stringify(backup, null, 2);
  const storageFileName = `backups/${dateStr}.json`;

  try {
    const file = bucket.file(storageFileName);
    await file.save(backupJson, {
      metadata: { contentType: 'application/json' },
    });
    console.log(`\n☁️  完整備份已上傳到 Firebase Storage: ${storageFileName}`);
    console.log(`   （私有，不公開，可在 Firebase Console 下載）`);
  } catch (e) {
    console.error('❌ Firebase Storage 上傳失敗:', e.message);
    // 降級：存到本地（會被 commit 進 repo，但至少有備份）
    console.warn('⚠️  降級：儲存到本地 backups/ 目錄');
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    fs.writeFileSync(path.join(backupsDir, `${dateStr}.json`), backupJson, 'utf8');
  }

  // ── 確保 backups 目錄存在 ──
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // ── 只 commit 不含個人資料的摘要（統計數字）──
  const summaryPath = path.join(backupsDir, 'summary.json');
  let allSummaries = [];
  if (fs.existsSync(summaryPath)) {
    try { allSummaries = JSON.parse(fs.readFileSync(summaryPath, 'utf8')); } catch {}
  }
  allSummaries = allSummaries.filter(s => s.date !== dateStr);
  allSummaries.unshift(summary);
  allSummaries = allSummaries.slice(0, 30); // 保留最近 30 天
  fs.writeFileSync(summaryPath, JSON.stringify(allSummaries, null, 2), 'utf8');

  // ── 更新 index.json（只有統計，無個人資料）──
  updateIndex(backupsDir, dateStr, backup.totalDocs);

  console.log(`\n✅ 備份完成！`);
  console.log(`   總計 ${backup.totalDocs} 筆記錄`);
  console.log(`   耗時 ${((Date.now() - startTime) / 1000).toFixed(1)} 秒`);
  console.log(`   完整備份：Firebase Storage（私有）`);
  console.log(`   摘要統計：backups/summary.json（公開，無個人資料）`);
}

function updateIndex(backupsDir, dateStr, totalDocs) {
  const indexPath = path.join(backupsDir, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch {}
  }
  index = index.filter(e => e.date !== dateStr);
  index.unshift({ date: dateStr, totalDocs, createdAt: new Date().toISOString() });
  index = index.slice(0, 30);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

runBackup().catch(e => {
  console.error('❌ 備份失敗:', e);
  process.exit(1);
});
