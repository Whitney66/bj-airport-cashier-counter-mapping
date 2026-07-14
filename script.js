const counterGroups = [
  '72222201', '72222401', '72221301', '72222501', '72221201', '72221501', '72222301', '72222901',
  '72221601', '72221602', '72221603', '72221604', '72221605', '72221607', '72221801', '72221704',
  '72222801', '72222802', '72222803', '72222804', '72222805', '72222806', '72221401', '72221606',
  '72221701', '72221702', '72221802', '72221901', '72221902', '72222601', '72222602', '72222603',
  '72222604', '72222701', '72222702', '72223001', '72225101', '72225102', '72225103', '72225104'
];

const cashierNames = ['张敏', '王欣', '李娜', '赵凯', '陈晨', '刘洋', '孙妍', '周浩', '吴迪', '郑洁', '马超', '胡佳'];
const cashiers = cashierNames.map((name, index) => ({ name, id: `BJCA${String(index + 1).padStart(4, '0')}` }));
let selectedIds = new Set();
let editingId = null;
let records = counterGroups.map((group, index) => {
  const cashier = cashiers[index % cashiers.length];
  return {
    id: index + 1,
    month: '2026-06',
    counter: group,
    cashier: cashier.name,
    cashierId: cashier.id,
    relationType: '固定柜组',
    items: 128 + ((index * 17) % 96),
    txns: 76 + ((index * 11) % 64),
    status: '已维护',
    updater: '店长01',
    updatedAt: `2026-07-${String(2 + (index % 8)).padStart(2, '0')} 09:${String(10 + index).padStart(2, '0')}`,
    remark: ''
  };
});

[
  { baseIndex: 8, counter: '72222803', cashierIndex: 1, items: 18, txns: 11, remark: '临时支援' },
  { baseIndex: 17, counter: '72221604', cashierIndex: 5, items: 9, txns: 6, remark: '轮岗收款' },
  { baseIndex: 29, counter: '72225102', cashierIndex: 8, items: 14, txns: 8, remark: '系统补录' }
].forEach((item, index) => {
  const cashier = cashiers[item.cashierIndex];
  records.splice(item.baseIndex + index, 0, {
    id: records.length + index + 1,
    month: '2026-06',
    counter: item.counter,
    cashier: cashier.name,
    cashierId: cashier.id,
    relationType: '跨柜组',
    items: item.items,
    txns: item.txns,
    status: '待复核',
    updater: '店长01',
    updatedAt: `2026-07-${10 + index} 15:${20 + index}`,
    remark: item.remark
  });
});

const tableBody = document.querySelector('#tableBody');
const addModal = document.querySelector('#addModal');
const importModal = document.querySelector('#importModal');
const reviewModal = document.querySelector('#reviewModal');
const counterFilter = document.querySelector('#counterFilter');
const counterSelect = document.querySelector('#counterSelect');
const monthInput = document.querySelector('#monthInput');
const cashierNameInput = document.querySelector('#cashierNameInput');
const cashierIdInput = document.querySelector('#cashierIdInput');
const relationType = document.querySelector('#relationType');
const itemInput = document.querySelector('#itemInput');
const txnInput = document.querySelector('#txnInput');
const remarkInput = document.querySelector('#remarkInput');
const formTitle = document.querySelector('#formTitle');

function fillOptions() {
  const counterOptions = counterGroups.map(group => `<option value="${group}">${group}</option>`).join('');
  counterFilter.innerHTML = `<option value="">全部柜组</option>${counterOptions}`;
  counterSelect.innerHTML = counterOptions;
  cashierNameInput.value = cashiers[0].name;
  cashierIdInput.value = cashiers[0].id;
}

function filteredRecords() {
  const monthValue = document.querySelector('#monthFilter').value;
  const counterValue = counterFilter.value;
  const idValue = document.querySelector('#cashierIdFilter').value.trim().toLowerCase();
  const nameValue = document.querySelector('#cashierNameFilter').value.trim().toLowerCase();
  const relationValue = document.querySelector('#relationFilter').value;
  const statusValue = document.querySelector('#statusFilter').value;
  return records.filter(record => {
    return (!monthValue || record.month === monthValue) &&
      (!counterValue || record.counter === counterValue) &&
      (!idValue || record.cashierId.toLowerCase().includes(idValue)) &&
      (!nameValue || record.cashier.toLowerCase().includes(nameValue)) &&
      (!relationValue || record.relationType === relationValue) &&
      (!statusValue || record.status === statusValue);
  });
}

function render() {
  const rows = filteredRecords();
  tableBody.innerHTML = rows.map(record => `
    <tr>
      <td class="check"><input type="checkbox" data-row-check="${record.id}" ${selectedIds.has(record.id) ? 'checked' : ''} /></td>
      <td>${record.month}</td>
      <td>${record.counter}</td>
      <td>${record.cashier}</td>
      <td>${record.cashierId}</td>
      <td><span class="badge el-tag ${record.relationType === '跨柜组' ? 'el-tag--warning cross' : 'el-tag--success fixed'}">${record.relationType}</span></td>
      <td>${record.items}</td>
      <td>${record.txns}</td>
      <td><span class="badge el-tag ${record.status === '待复核' ? 'el-tag--warning warn' : 'el-tag--success ok'}">${record.status}</span></td>
      <td>${record.updater}</td>
      <td>${record.updatedAt}</td>
      <td><div class="ops"><button class="el-button el-button--text" data-copy="${record.id}">复制</button><button class="el-button el-button--text" data-edit="${record.id}">修改</button><button class="delete el-button el-button--text" data-delete="${record.id}">删除</button></div></td>
    </tr>
  `).join('');
  updateSummary(rows);
  bindRowActions();
}

function updateSummary(rows) {
  document.querySelector('#totalText').textContent = `共 ${rows.length} 条`;
}

function openModal(mode, record) {
  editingId = mode === 'edit' ? record.id : null;
  formTitle.textContent = mode === 'edit' ? '修改关系' : mode === 'copy' ? '复制关系' : '新增关系';
  monthInput.value = record?.month || document.querySelector('#monthFilter').value || '2026-06';
  counterSelect.value = record?.counter || counterGroups[0];
  cashierNameInput.value = record?.cashier || cashiers[0].name;
  cashierIdInput.value = record?.cashierId || cashiers[0].id;
  relationType.value = record?.relationType || '固定柜组';
  itemInput.value = record?.items || 0;
  txnInput.value = record?.txns || 0;
  remarkInput.value = record?.remark || '';
  addModal.hidden = false;
}

function closeModals() {
  addModal.hidden = true;
  importModal.hidden = true;
  reviewModal.hidden = true;
}

function openReviewModal() {
  const pendingRows = records.filter(record => record.relationType === '跨柜组' && record.status === '待复核');
  document.querySelector('#reviewBody').innerHTML = pendingRows.length ? pendingRows.map(record => `
    <tr>
      <td>${record.month}</td>
      <td>${record.counter}</td>
      <td>${record.cashier}</td>
      <td>${record.cashierId}</td>
      <td>${record.items}</td>
      <td>${record.txns}</td>
      <td>${record.remark || '-'}</td>
    </tr>
  `).join('') : '<tr><td colspan="7">暂无待复核跨柜组记录</td></tr>';
  reviewModal.hidden = false;
}

function bindRowActions() {
  document.querySelectorAll('[data-row-check]').forEach(input => {
    input.addEventListener('change', () => {
      const id = Number(input.dataset.rowCheck);
      input.checked ? selectedIds.add(id) : selectedIds.delete(id);
    });
  });
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', () => {
      const record = records.find(item => item.id === Number(button.dataset.copy));
      openModal('copy', record);
    });
  });
  document.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => {
      const record = records.find(item => item.id === Number(button.dataset.edit));
      openModal('edit', record);
    });
  });
  document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', () => {
      records = records.filter(item => item.id !== Number(button.dataset.delete));
      selectedIds.delete(Number(button.dataset.delete));
      render();
    });
  });
}

function saveRelation() {
  const payload = {
    month: monthInput.value || '2026-06',
    counter: counterSelect.value,
    cashier: cashierNameInput.value.trim() || '未填写',
    cashierId: cashierIdInput.value.trim() || '未填写',
    relationType: relationType.value,
    items: Number(itemInput.value || 0),
    txns: Number(txnInput.value || 0),
    status: relationType.value === '跨柜组' ? '待复核' : '已维护',
    updater: '当前用户',
    updatedAt: '2026-07-14 10:30',
    remark: remarkInput.value.trim()
  };

  if (editingId) {
    records = records.map(record => record.id === editingId ? { ...record, ...payload } : record);
  } else {
    records.unshift({ id: Math.max(...records.map(item => item.id)) + 1, ...payload });
  }
  closeModals();
  render();
}

function resetFilters() {
  document.querySelector('#monthFilter').value = '2026-06';
  document.querySelector('#counterFilter').value = '';
  document.querySelector('#cashierIdFilter').value = '';
  document.querySelector('#cashierNameFilter').value = '';
  document.querySelector('#relationFilter').value = '';
  document.querySelector('#statusFilter').value = '';
  render();
}

fillOptions();
render();

document.querySelector('#addBtn').addEventListener('click', () => openModal('add'));
document.querySelector('#editBtn').addEventListener('click', () => {
  const firstSelected = records.find(record => selectedIds.has(record.id));
  openModal('edit', firstSelected || filteredRecords()[0]);
});
document.querySelector('#importBtn').addEventListener('click', () => { importModal.hidden = false; });
document.querySelector('#queryBtn').addEventListener('click', render);
document.querySelector('#resetBtn').addEventListener('click', resetFilters);
document.querySelector('#validateBtn').addEventListener('click', openReviewModal);
document.querySelector('.danger').addEventListener('click', () => {
  if (!selectedIds.size) return;
  records = records.filter(record => !selectedIds.has(record.id));
  selectedIds.clear();
  render();
});
document.querySelector('#confirmReviewBtn').addEventListener('click', () => {
  records = records.map(record => record.relationType === '跨柜组' && record.status === '待复核'
    ? { ...record, status: '已维护', updater: '复核员01', updatedAt: '2026-07-14 11:00' }
    : record);
  closeModals();
  render();
});
document.querySelector('#saveRelationBtn').addEventListener('click', saveRelation);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModals));
document.querySelectorAll('.modal-mask').forEach(mask => {
  mask.addEventListener('click', event => {
    if (event.target === mask) closeModals();
  });
});
document.querySelectorAll('#counterFilter, #cashierIdFilter, #cashierNameFilter, #relationFilter, #statusFilter').forEach(control => {
  control.addEventListener('keydown', event => {
    if (event.key === 'Enter') render();
  });
});
