#!/usr/bin/env node
/**
 * Firestore 自動備份腳本
 * 由 GitHub Actions 定期執行
 * 使用 Firebase Admin SDK 直接讀取所有 Collections
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ── 初始化 Firebase Admin ──
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

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

  const backup = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    source: 'github-actions-auto-backup',
    collections: {},
    totalDocs: 0,
  };

  for (const colId of COLLECTIONS) {
    try {
      const snap = await db.collection(colId).get();
      backup.collections[colId] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      console.log(`  ✅ ${colId}: ${snap.docs.length} 筆`);
    } catch (e) {
      console.error(`  ❌ ${colId}: ${e.message}`);
      backup.collections[colId] = [];
    }
  }

  backup.totalDocs = Object.values(backup.collections)
    .reduce((sum, arr) => sum + arr.length, 0);

  // ── 確保 backups 目錄存在 ──
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // ── 寫入備份檔案（以日期命名）──
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = path.join(backupsDir, `${dateStr}.json`);
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`\n💾 備份完成：${filename}`);
  console.log(`   總計 ${backup.totalDocs} 筆記錄`);
  console.log(`   耗時 ${((Date.now() - startTime) / 1000).toFixed(1)} 秒`);

  // ── 更新 latest.json（方便快速查看最新備份）──
  const latestPath = path.join(backupsDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(backup, null, 2), 'utf8');

  // ── 更新備份索引 ──
  updateIndex(backupsDir, dateStr, backup.totalDocs);

  // ── 清理超過 30 天的舊備份 ──
  cleanOldBackups(backupsDir, 30);

  console.log('\n✅ 所有任務完成');
}

function updateIndex(backupsDir, dateStr, totalDocs) {
  const indexPath = path.join(backupsDir, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch {}
  }
  // 移除同日期的舊記錄
  index = index.filter(e => e.date !== dateStr);
  index.unshift({ date: dateStr, totalDocs, createdAt: new Date().toISOString() });
  // 只保留最近 30 筆索引
  index = index.slice(0, 30);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

function cleanOldBackups(backupsDir, keepDays) {
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(backupsDir)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));

  let deleted = 0;
  for (const file of files) {
    const dateStr = file.replace('.json', '');
    const fileTime = new Date(dateStr).getTime();
    if (fileTime < cutoff) {
      fs.unlinkSync(path.join(backupsDir, file));
      deleted++;
    }
  }
  if (deleted > 0) {
    console.log(`🗑️  已清理 ${deleted} 個超過 ${keepDays} 天的舊備份`);
  }
}

runBackup().catch(e => {
  console.error('❌ 備份失敗:', e);
  process.exit(1);
});
