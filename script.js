const areaHierarchy = {
  出境: {
    烟酒A区: ['[72231501]DXS烟酒', '[72231101]DXM中心店'],
    香化A区: ['[72231501]DXS烟酒', '[72231101]DXM中心店'],
    精品区: ['[72231501]DXS烟酒', '[72231101]DXM中心店', '[72231201]DXW BOSS', '[72231202]DXW BALLY', '[72231203]DXW MB', '[72231204]DXW TUMI', '[72231205]DXW Multi Swatch', '[72231701]DXE MK', '[72231702]DXE POLO', '[72231703]DXE COACH', '[72231704]DXE Multi Jew', '[72231705]DXE Multi SG']
  },
  入境: {
    烟酒B区: ['[72235102]DXA食品', '[72235103]DXA烟酒', '[72235104]DXA提货'],
    香化B区: ['[72235105]DXA香化']
  }
};

const zoneCashiers = {
  烟酒A区: ['李振东', '王新媛', '班帅', '胡焰'], 烟酒B区: ['李振东', '王新媛', '班帅', '胡焰'],
  香化A区: ['高巍菁', '苏晨丽', '薛家蕊', '蒋成敏', '王燕燕', '于苗'], 香化B区: ['高巍菁', '苏晨丽', '薛家蕊', '蒋成敏', '王燕燕', '于苗'],
  精品区: ['梅珍珍', '高银璐', '李文瑞']
};
const allNames = [...new Set(Object.values(zoneCashiers).flat())];
const cashierIds = Object.fromEntries(allNames.map((name, index) => [name, `BJCA${String(index + 1).padStart(4, '0')}`]));
let records = [];
let nextId = 1;
Object.entries(areaHierarchy).forEach(([area, zones]) => Object.entries(zones).forEach(([zone, teams]) => teams.forEach((team, index) => {
  const cashier = (zoneCashiers[zone] || allNames)[index % (zoneCashiers[zone] || allNames).length];
  records.push({ id: nextId++, month: index % 4 === 0 ? '2026-05' : index % 5 === 0 ? '2026-07' : '2026-06', area, zone, team, cashier, cashierId: cashierIds[cashier], relationType: index % 6 === 5 ? '跨柜组' : '固定柜组' });
})));

const $ = selector => document.querySelector(selector);
const tableBody = $('#tableBody');
const areaPanel = $('#areaPanel');
const cascadePanel = $('#cascadePanel');
const monthPanel = $('#monthPanel');
let selectedAreas = new Set(['出境', '入境']);
let selectedTeams = new Set();
let activeArea = '出境';
let activeZone = '烟酒A区';
let monthStart = '2026-06';
let monthEnd = '2026-06';
let panelYear = 2026;
let pendingMonth = null;
let selectedIds = new Set();
let editingId = null;
const batchValues = { name: new Set(), id: new Set() };
let activeBatch = 'name';

function closePopovers(except) {
  [monthPanel, areaPanel, cascadePanel].forEach(panel => { if (panel !== except) panel.hidden = true; });
}
function monthValue(year, month) { return `${year}-${String(month).padStart(2, '0')}`; }
function updateMonthSummary() { $('#monthSummary').textContent = `${monthStart} - ${monthEnd}`; }
function chooseRange(start, end) {
  monthStart = start; monthEnd = end; pendingMonth = null; panelYear = Number(start.slice(0, 4));
  updateMonthSummary(); renderMonthPanel(); monthPanel.hidden = true;
}
function renderMonthPanel() {
  $('#panelYear').textContent = `${panelYear} 年`;
  const names = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  $('#monthGrid').innerHTML = names.map((name, index) => {
    const value = monthValue(panelYear, index + 1);
    const selected = value === monthStart || value === monthEnd;
    const inRange = value >= monthStart && value <= monthEnd;
    return `<button type="button" data-month="${value}" class="${selected ? 'selected ' : ''}${inRange ? 'in-range' : ''}">${name}</button>`;
  }).join('');
  $('#monthHelp').textContent = pendingMonth ? `已选择 ${pendingMonth}，请选择结束月份` : '请选择开始月份';
}
const shortcutDefs = [
  ['本月', () => ['2026-06', '2026-06']], ['上月', () => ['2026-05', '2026-05']], ['近3个月', () => ['2026-04', '2026-06']],
  ['本季', () => ['2026-04', '2026-06']], ['今年', () => ['2026-01', '2026-12']], ['去年', () => ['2025-01', '2025-12']]
];
$('#monthShortcuts').innerHTML = shortcutDefs.map(([label], index) => `<button type="button" data-shortcut="${index}">${label}</button>`).join('');
$('#monthTrigger').addEventListener('click', () => { const opening = monthPanel.hidden; closePopovers(monthPanel); monthPanel.hidden = !opening; renderMonthPanel(); });
$('#monthGrid').addEventListener('click', event => {
  const value = event.target.dataset.month; if (!value) return;
  if (!pendingMonth) { pendingMonth = value; renderMonthPanel(); return; }
  chooseRange(value < pendingMonth ? value : pendingMonth, value < pendingMonth ? pendingMonth : value);
});
$('#monthShortcuts').addEventListener('click', event => { const index = event.target.dataset.shortcut; if (index !== undefined) chooseRange(...shortcutDefs[index][1]()); });
$('#prevYear').addEventListener('click', () => { panelYear--; renderMonthPanel(); });
$('#nextYear').addEventListener('click', () => { panelYear++; renderMonthPanel(); });

function syncAreaCheckboxes() {
  areaPanel.querySelector('[value="全部"]').checked = selectedAreas.size === 2;
  ['出境', '入境'].forEach(area => { areaPanel.querySelector(`[value="${area}"]`).checked = selectedAreas.has(area); });
  $('#areaSummary').textContent = selectedAreas.size === 2 ? '全部' : selectedAreas.size ? [...selectedAreas].join('、') : '请选择';
}
$('#areaTrigger').addEventListener('click', () => { const opening = areaPanel.hidden; closePopovers(areaPanel); areaPanel.hidden = !opening; });
areaPanel.addEventListener('change', event => {
  const { value, checked } = event.target;
  if (value === '全部') selectedAreas = checked ? new Set(['出境', '入境']) : new Set();
  else checked ? selectedAreas.add(value) : selectedAreas.delete(value);
  selectedTeams = new Set([...selectedTeams].filter(team => [...selectedAreas].some(area => Object.values(areaHierarchy[area]).flat().includes(team))));
  if (!selectedAreas.has(activeArea)) activeArea = [...selectedAreas][0] || '';
  activeZone = activeArea ? Object.keys(areaHierarchy[activeArea])[0] : '';
  syncAreaCheckboxes(); renderCascade();
});

function teamsForArea(area) { return Object.values(areaHierarchy[area] || {}).flat(); }
function renderCascade() {
  const areas = [...selectedAreas];
  $('#cascadeAreas').innerHTML = areas.length ? areas.map(area => `<label class="${area === activeArea ? 'active' : ''}"><input type="checkbox" data-area-check="${area}" ${teamsForArea(area).every(team => selectedTeams.has(team)) ? 'checked' : ''}/><span data-area-nav="${area}">${area}</span><i>›</i></label>`).join('') : '<p>请先选择区域</p>';
  const zones = Object.keys(areaHierarchy[activeArea] || {});
  if (!zones.includes(activeZone)) activeZone = zones[0] || '';
  $('#cascadeZones').innerHTML = zones.map(zone => `<label class="${zone === activeZone ? 'active' : ''}"><input type="checkbox" data-zone-check="${zone}" ${areaHierarchy[activeArea][zone].every(team => selectedTeams.has(team)) ? 'checked' : ''}/><span data-zone-nav="${zone}">${zone}</span><i>›</i></label>`).join('');
  const teams = areaHierarchy[activeArea]?.[activeZone] || [];
  $('#cascadeTeams').innerHTML = teams.map(team => `<label><input type="checkbox" data-team="${team}" ${selectedTeams.has(team) ? 'checked' : ''}/><span>${team}</span></label>`).join('');
  const summary = selectedTeams.size === 0 ? '请选择柜组' : selectedTeams.size === 1 ? [...selectedTeams][0] : `已选 ${selectedTeams.size} 项`;
  $('#teamSummary').textContent = summary; $('#teamSummary').classList.toggle('placeholder', !selectedTeams.size);
}
$('#teamTrigger').addEventListener('click', () => { const opening = cascadePanel.hidden; closePopovers(cascadePanel); cascadePanel.hidden = !opening; renderCascade(); });
cascadePanel.addEventListener('click', event => {
  if (event.target.dataset.areaNav) { activeArea = event.target.dataset.areaNav; activeZone = Object.keys(areaHierarchy[activeArea])[0]; renderCascade(); }
  if (event.target.dataset.zoneNav) { activeZone = event.target.dataset.zoneNav; renderCascade(); }
});
cascadePanel.addEventListener('change', event => {
  let teams = [];
  if (event.target.dataset.areaCheck) teams = teamsForArea(event.target.dataset.areaCheck);
  if (event.target.dataset.zoneCheck) teams = areaHierarchy[activeArea][event.target.dataset.zoneCheck];
  if (event.target.dataset.team) teams = [event.target.dataset.team];
  teams.forEach(team => event.target.checked ? selectedTeams.add(team) : selectedTeams.delete(team));
  renderCascade();
});

function parseValues(text) { return [...new Set(text.split(/\r?\n|,|，/).map(value => value.trim()).filter(Boolean))]; }
function syncBatchInput(type) {
  const input = type === 'name' ? $('#cashierNameInput') : $('#cashierIdInput');
  const values = [...batchValues[type]];
  input.value = values.length > 1 ? `已输入 ${values.length} 个` : values[0] || '';
  input.classList.toggle('summary-value', values.length > 1);
}
function commitDirectInput(type) {
  const input = type === 'name' ? $('#cashierNameInput') : $('#cashierIdInput');
  if (!input.classList.contains('summary-value') && input.value.trim()) batchValues[type] = new Set(parseValues(input.value));
}
document.querySelectorAll('[data-batch]').forEach(button => button.addEventListener('click', () => {
  activeBatch = button.dataset.batch; commitDirectInput(activeBatch);
  const isName = activeBatch === 'name';
  $('#batchTitle').textContent = isName ? '编辑员工姓名多值' : '编辑工号多值';
  $('#batchTextarea').placeholder = isName ? '每行输入一个员工姓名' : '每行输入一个工号';
  $('#batchTextarea').value = [...batchValues[activeBatch]].join('\n');
  $('#batchCount').textContent = batchValues[activeBatch].size;
  $('#batchModal').hidden = false; $('#batchTextarea').focus();
}));
$('#batchTextarea').addEventListener('input', () => { $('#batchCount').textContent = parseValues($('#batchTextarea').value).length; });
function closeBatch() { $('#batchModal').hidden = true; }
$('#batchConfirm').addEventListener('click', () => { batchValues[activeBatch] = new Set(parseValues($('#batchTextarea').value)); syncBatchInput(activeBatch); closeBatch(); });
$('#batchCancel').addEventListener('click', closeBatch); $('#batchClose').addEventListener('click', closeBatch);

function filteredRecords() {
  commitDirectInput('name'); commitDirectInput('id');
  return records.filter(record => record.month >= monthStart && record.month <= monthEnd && selectedAreas.has(record.area) && (!selectedTeams.size || selectedTeams.has(record.team)) && (!batchValues.name.size || batchValues.name.has(record.cashier)) && (!batchValues.id.size || batchValues.id.has(record.cashierId)) && (!$('#relationFilter').value || record.relationType === $('#relationFilter').value));
}
function render() {
  const rows = filteredRecords();
  tableBody.innerHTML = rows.length ? rows.map(record => `<tr><td class="check"><input type="checkbox" data-row="${record.id}" ${selectedIds.has(record.id) ? 'checked' : ''}/></td><td>${record.month}</td><td>${record.area}</td><td title="${record.zone} / ${record.team}"><span class="zone-name">${record.zone}</span>${record.team}</td><td>${record.cashier}</td><td>${record.cashierId}</td><td><span class="badge el-tag ${record.relationType === '跨柜组' ? 'cross' : 'fixed'}">${record.relationType}</span></td><td><div class="ops"><button data-edit="${record.id}">修改</button><button data-delete="${record.id}">删除</button></div></td></tr>`).join('') : '<tr><td colspan="8" class="empty-row">暂无符合条件的数据</td></tr>';
  $('#totalText').textContent = `共 ${rows.length} 条`;
  tableBody.querySelectorAll('[data-row]').forEach(input => input.addEventListener('change', () => input.checked ? selectedIds.add(Number(input.dataset.row)) : selectedIds.delete(Number(input.dataset.row))));
  tableBody.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => openRelation(records.find(record => record.id === Number(button.dataset.edit)))));
  tableBody.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => { records = records.filter(record => record.id !== Number(button.dataset.delete)); render(); }));
}
function resetFilters() {
  monthStart = monthEnd = '2026-06'; panelYear = 2026; pendingMonth = null; selectedAreas = new Set(['出境', '入境']); selectedTeams.clear(); batchValues.name.clear(); batchValues.id.clear();
  $('#cashierNameInput').value = ''; $('#cashierIdInput').value = ''; $('#cashierNameInput').classList.remove('summary-value'); $('#cashierIdInput').classList.remove('summary-value'); $('#relationFilter').value = '';
  syncAreaCheckboxes(); updateMonthSummary(); renderCascade(); render();
}

function fillRelationTeams(area, selected = '') {
  $('#relationTeam').innerHTML = Object.entries(areaHierarchy[area]).flatMap(([zone, teams]) => teams.map(team => `<option value="${zone}|${team}" ${team === selected ? 'selected' : ''}>${zone} / ${team}</option>`)).join('');
}
function openRelation(record) {
  editingId = record?.id || null; $('#relationTitle').textContent = record ? '修改关系' : '新增关系';
  $('#relationArea').innerHTML = Object.keys(areaHierarchy).map(area => `<option ${record?.area === area ? 'selected' : ''}>${area}</option>`).join('');
  fillRelationTeams($('#relationArea').value, record?.team); $('#relationMonth').value = record?.month || '2026-06'; $('#relationCashier').value = record?.cashier || ''; $('#relationCashierId').value = record?.cashierId || ''; $('#relationType').value = record?.relationType || '固定柜组'; $('#relationModal').hidden = false;
}
$('#relationArea').addEventListener('change', () => fillRelationTeams($('#relationArea').value));
$('#saveRelationBtn').addEventListener('click', () => {
  const [zone, team] = $('#relationTeam').value.split('|'); const payload = { month: $('#relationMonth').value, area: $('#relationArea').value, zone, team, cashier: $('#relationCashier').value.trim() || '未填写', cashierId: $('#relationCashierId').value.trim() || '未填写', relationType: $('#relationType').value };
  if (editingId) records = records.map(record => record.id === editingId ? { ...record, ...payload } : record); else records.unshift({ id: nextId++, ...payload });
  $('#relationModal').hidden = true; render();
});
$('#addBtn').addEventListener('click', () => openRelation());
$('#importBtn').addEventListener('click', () => { $('#importModal').hidden = false; });
$('#validateBtn').addEventListener('click', () => { const rows = records.filter(record => record.relationType === '跨柜组'); $('#reviewBody').innerHTML = rows.map(record => `<tr><td>${record.month}</td><td>${record.area}</td><td>${record.team}</td><td>${record.cashier}</td><td>${record.cashierId}</td></tr>`).join('') || '<tr><td colspan="5">暂无跨柜组记录</td></tr>'; $('#reviewModal').hidden = false; });
$('#batchDeleteBtn').addEventListener('click', () => { if (!selectedIds.size) return; records = records.filter(record => !selectedIds.has(record.id)); selectedIds.clear(); render(); });
$('#selectAll').addEventListener('change', event => { filteredRecords().forEach(record => event.target.checked ? selectedIds.add(record.id) : selectedIds.delete(record.id)); render(); });
document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => { $(`#${button.dataset.closeModal}`).hidden = true; }));
$('#queryBtn').addEventListener('click', render); $('#resetBtn').addEventListener('click', resetFilters);
document.addEventListener('click', event => { if (!$('#monthControl').contains(event.target) && !monthPanel.hidden) monthPanel.hidden = true; if (!$('#areaFilter').contains(event.target) && !areaPanel.hidden) areaPanel.hidden = true; if (!$('#teamControl').contains(event.target) && !cascadePanel.hidden) cascadePanel.hidden = true; });

syncAreaCheckboxes(); updateMonthSummary(); renderMonthPanel(); renderCascade(); render();
