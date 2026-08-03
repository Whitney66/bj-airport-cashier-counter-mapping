const areaHierarchy = {
  出境: {
    烟酒A区: ['[72231501]DXS烟酒', '[72231101]DXM中心店'],
    香化A区: ['[72231501]DXS烟酒', '[72231101]DXM中心店'],
    精品区: [
      '[72231501]DXS烟酒', '[72231101]DXM中心店', '[72231201]DXW BOSS', '[72231202]DXW BALLY',
      '[72231203]DXW MB', '[72231204]DXW TUMI', '[72231205]DXW Multi Swatch', '[72231701]DXE MK',
      '[72231702]DXE POLO', '[72231703]DXE COACH', '[72231704]DXE Multi Jew', '[72231705]DXE Multi SG'
    ]
  },
  入境: {
    烟酒B区: ['[72235102]DXA食品', '[72235103]DXA烟酒', '[72235104]DXA提货'],
    香化B区: ['[72235105]DXA香化']
  }
};

const zoneCashiers = {
  烟酒A区: ['李振东', '王新媛', '班帅', '胡焰'],
  烟酒B区: ['李振东', '王新媛', '班帅', '胡焰'],
  香化A区: ['高巍菁', '苏晨丽', '薛家蕊', '蒋成敏', '王燕燕', '于苗'],
  香化B区: ['高巍菁', '苏晨丽', '薛家蕊', '蒋成敏', '王燕燕', '于苗'],
  精品区: ['梅珍珍', '高银璐', '李文瑞']
};

const allNames = [...new Set(Object.values(zoneCashiers).flat())];
const cashierIds = Object.fromEntries(allNames.map((name, index) => [name, `BJCA${String(index + 1).padStart(4, '0')}`]));
const records = [];
let nextId = 1;

Object.entries(areaHierarchy).forEach(([area, zones]) => {
  Object.entries(zones).forEach(([zone, teams]) => {
    const names = zoneCashiers[zone] || allNames;
    teams.forEach((team, index) => {
      const cashier = names[index % names.length];
      records.push({
        id: nextId++,
        month: index % 4 === 0 ? '2026-05' : index % 5 === 0 ? '2026-07' : '2026-06',
        area,
        zone,
        team,
        cashier,
        cashierId: cashierIds[cashier],
        relationType: index % 6 === 5 ? '跨柜组' : '固定柜组'
      });
    });
  });
});

const tableBody = document.querySelector('#tableBody');
const monthStart = document.querySelector('#monthStart');
const monthEnd = document.querySelector('#monthEnd');
const cascadeArea = document.querySelector('#cascadeArea');
const zoneFilter = document.querySelector('#zoneFilter');
const teamFilter = document.querySelector('#teamFilter');
const relationFilter = document.querySelector('#relationFilter');
const areaFilter = document.querySelector('#areaFilter');
const areaPanel = document.querySelector('#areaPanel');
const areaTrigger = document.querySelector('#areaTrigger');
const filterError = document.querySelector('#filterError');
let selectedAreas = new Set(['出境', '入境']);

function options(items, allLabel) {
  return `<option value="">${allLabel}</option>${items.map(item => `<option value="${item}">${item}</option>`).join('')}`;
}

function updateAreaSummary() {
  const summary = selectedAreas.size === 2 ? '全部' : selectedAreas.size ? [...selectedAreas].join('、') : '请选择';
  document.querySelector('#areaSummary').textContent = summary;
}

function syncAreaCheckboxes() {
  areaPanel.querySelector('[value="全部"]').checked = selectedAreas.size === 2;
  ['出境', '入境'].forEach(area => {
    areaPanel.querySelector(`[value="${area}"]`).checked = selectedAreas.has(area);
  });
  updateAreaSummary();
}

function updateCascadeAreas() {
  const previous = cascadeArea.value;
  const areas = [...selectedAreas];
  cascadeArea.innerHTML = options(areas, '全部区域');
  cascadeArea.value = areas.includes(previous) ? previous : '';
  updateZones();
}

function updateZones() {
  const previous = zoneFilter.value;
  const areas = cascadeArea.value ? [cascadeArea.value] : [...selectedAreas];
  const zones = [...new Set(areas.flatMap(area => Object.keys(areaHierarchy[area] || {})))];
  zoneFilter.innerHTML = options(zones, '全部分区');
  zoneFilter.value = zones.includes(previous) ? previous : '';
  updateTeams();
}

function updateTeams() {
  const previous = teamFilter.value;
  const areas = cascadeArea.value ? [cascadeArea.value] : [...selectedAreas];
  const teams = [...new Set(areas.flatMap(area => {
    const zones = areaHierarchy[area] || {};
    return zoneFilter.value ? (zones[zoneFilter.value] || []) : Object.values(zones).flat();
  }))];
  teamFilter.innerHTML = options(teams, '全部团队');
  teamFilter.value = teams.includes(previous) ? previous : '';
}

function createTagInput(rootId) {
  const root = document.querySelector(`#${rootId}`);
  const list = root.querySelector('.tag-list');
  const input = root.querySelector('input');
  const values = new Set();

  function draw() {
    list.innerHTML = [...values].map(value => `<span class="input-tag">${value}<button type="button" data-value="${value}" aria-label="删除 ${value}">×</button></span>`).join('');
    list.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      values.delete(button.dataset.value);
      draw();
    }));
  }

  function addValue() {
    const value = input.value.trim();
    if (value) values.add(value);
    input.value = '';
    draw();
  }

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addValue();
    } else if (event.key === 'Backspace' && !input.value && values.size) {
      values.delete([...values].at(-1));
      draw();
    }
  });
  input.addEventListener('blur', addValue);
  root.addEventListener('click', () => input.focus());
  return { values, clear: () => { values.clear(); input.value = ''; draw(); }, commit: addValue };
}

const nameTags = createTagInput('cashierNameTags');
const idTags = createTagInput('cashierIdTags');

function filteredRecords() {
  nameTags.commit();
  idTags.commit();
  if (monthStart.value && monthEnd.value && monthStart.value > monthEnd.value) {
    filterError.textContent = '开始月份不能晚于结束月份';
    return null;
  }
  filterError.textContent = '';
  return records.filter(record =>
    (!monthStart.value || record.month >= monthStart.value) &&
    (!monthEnd.value || record.month <= monthEnd.value) &&
    selectedAreas.has(record.area) &&
    (!cascadeArea.value || record.area === cascadeArea.value) &&
    (!zoneFilter.value || record.zone === zoneFilter.value) &&
    (!teamFilter.value || record.team === teamFilter.value) &&
    (!nameTags.values.size || nameTags.values.has(record.cashier)) &&
    (!idTags.values.size || idTags.values.has(record.cashierId)) &&
    (!relationFilter.value || record.relationType === relationFilter.value)
  );
}

function render() {
  const rows = filteredRecords();
  if (!rows) return;
  tableBody.innerHTML = rows.length ? rows.map(record => `
    <tr><td>${record.month}</td><td>${record.area}</td><td title="${record.zone} / ${record.team}"><span class="zone-name">${record.zone}</span>${record.team}</td><td>${record.cashier}</td><td>${record.cashierId}</td><td><span class="badge el-tag ${record.relationType === '跨柜组' ? 'cross' : 'fixed'}">${record.relationType}</span></td></tr>
  `).join('') : '<tr><td colspan="6" class="empty-row">暂无符合条件的数据</td></tr>';
  document.querySelector('#totalText').textContent = `共 ${rows.length} 条`;
}

function resetFilters() {
  monthStart.value = '2026-06';
  monthEnd.value = '2026-06';
  selectedAreas = new Set(['出境', '入境']);
  syncAreaCheckboxes();
  updateCascadeAreas();
  nameTags.clear();
  idTags.clear();
  relationFilter.value = '';
  filterError.textContent = '';
  render();
}

areaTrigger.addEventListener('click', () => {
  areaPanel.hidden = !areaPanel.hidden;
  areaTrigger.setAttribute('aria-expanded', String(!areaPanel.hidden));
});
areaPanel.addEventListener('change', event => {
  const value = event.target.value;
  if (value === '全部') {
    selectedAreas = event.target.checked ? new Set(['出境', '入境']) : new Set();
  } else {
    event.target.checked ? selectedAreas.add(value) : selectedAreas.delete(value);
  }
  syncAreaCheckboxes();
  updateCascadeAreas();
});
document.addEventListener('click', event => {
  if (!areaFilter.contains(event.target)) {
    areaPanel.hidden = true;
    areaTrigger.setAttribute('aria-expanded', 'false');
  }
});
cascadeArea.addEventListener('change', updateZones);
zoneFilter.addEventListener('change', updateTeams);
document.querySelector('#queryBtn').addEventListener('click', render);
document.querySelector('#resetBtn').addEventListener('click', resetFilters);

syncAreaCheckboxes();
updateCascadeAreas();
render();
