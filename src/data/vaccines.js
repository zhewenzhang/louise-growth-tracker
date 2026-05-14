export const DEFAULT_VACCINES = [
  { id: 'v1',  name: 'B型肝炎', dose: '第1劑', recommendedAge: '出生24小時內', ageMonths: 0 },
  { id: 'v2',  name: 'B型肝炎', dose: '第2劑', recommendedAge: '滿1個月', ageMonths: 1 },
  { id: 'v3',  name: '五合一', dose: '第1劑', recommendedAge: '滿2個月', ageMonths: 2 },
  { id: 'v4',  name: '13價肺炎鏈球菌', dose: '第1劑', recommendedAge: '滿2個月', ageMonths: 2 },
  { id: 'v5',  name: '五合一', dose: '第2劑', recommendedAge: '滿4個月', ageMonths: 4 },
  { id: 'v6',  name: '13價肺炎鏈球菌', dose: '第2劑', recommendedAge: '滿4個月', ageMonths: 4 },
  { id: 'v7',  name: '五合一', dose: '第3劑', recommendedAge: '滿6個月', ageMonths: 6 },
  { id: 'v8',  name: 'B型肝炎', dose: '第3劑', recommendedAge: '滿6個月', ageMonths: 6 },
  { id: 'v9',  name: '卡介苗(BCG)', dose: '1劑', recommendedAge: '滿5-8個月', ageMonths: 5 },
  { id: 'v10', name: '流感疫苗', dose: '第1劑', recommendedAge: '滿6個月(10-3月)', ageMonths: 6 },
  { id: 'v11', name: 'MMR', dose: '第1劑', recommendedAge: '滿12個月', ageMonths: 12 },
  { id: 'v12', name: '水痘疫苗', dose: '1劑', recommendedAge: '滿12個月', ageMonths: 12 },
  { id: 'v13', name: '13價肺炎鏈球菌', dose: '第3劑', recommendedAge: '滿12個月', ageMonths: 12 },
  { id: 'v14', name: 'A型肝炎', dose: '第1劑', recommendedAge: '滿12-15個月', ageMonths: 12 },
  { id: 'v15', name: '日本腦炎', dose: '第1劑', recommendedAge: '滿15個月', ageMonths: 15 },
  { id: 'v16', name: '五合一', dose: '第4劑', recommendedAge: '滿18個月', ageMonths: 18 },
  { id: 'v17', name: 'A型肝炎', dose: '第2劑', recommendedAge: '滿18-21個月', ageMonths: 18 },
  { id: 'v18', name: '日本腦炎', dose: '第2劑', recommendedAge: '滿27個月', ageMonths: 27 },
];

// 根據出生日期計算每劑疫苗的預計接種日
export const calcVaccineDates = (vaccines, birthDateStr) => {
  if (!birthDateStr) return vaccines;
  const birth = new Date(birthDateStr);
  return vaccines.map(v => {
    // 保留自訂疫苗的手動日期
    if (v.isCustom && v.dueDate) return v;
    const due = new Date(birth);
    due.setMonth(birth.getMonth() + v.ageMonths);
    return { ...v, dueDate: due.toISOString().split('T')[0] };
  });
};

// 格式化顯示預計日期
export const formatDueDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};
