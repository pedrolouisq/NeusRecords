const STORAGE_KEY = 'monthlyPayRecords';
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });

const elements = {
  month: document.querySelector('#monthSelect'),
  year: document.querySelector('#yearSelect'),
  form: document.querySelector('#paymentForm'),
  date: document.querySelector('#paymentDate'),
  concept: document.querySelector('#paymentConcept'),
  amount: document.querySelector('#paymentAmount'),
  editingId: document.querySelector('#editingId'),
  formTitle: document.querySelector('#formTitle'),
  submit: document.querySelector('#submitButton'),
  cancel: document.querySelector('#cancelEdit'),
  error: document.querySelector('#formError'),
  total: document.querySelector('#totalAmount'),
  totalCaption: document.querySelector('#totalCaption'),
  count: document.querySelector('#paymentCount'),
  label: document.querySelector('#activeMonthLabel'),
  body: document.querySelector('#paymentsBody'),
  empty: document.querySelector('#emptyState'),
  export: document.querySelector('#exportButton')
};

let records = loadRecords();
const now = new Date();

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveRecords() {
  Object.keys(records).forEach((key) => {
    records[key] = sortPayments(records[key]);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function sortPayments(payments) {
  return [...payments].sort((firstPayment, secondPayment) => firstPayment.date.localeCompare(secondPayment.date));
}

function periodKey() {
  return `${elements.year.value}-${String(Number(elements.month.value) + 1).padStart(2, '0')}`;
}

function currentPayments() {
  return records[periodKey()] || [];
}

function populatePeriodSelectors() {
  monthNames.forEach((month, index) => {
    elements.month.add(new Option(month, index));
  });
  for (let year = now.getFullYear() - 2; year <= now.getFullYear() + 3; year += 1) {
    elements.year.add(new Option(year, year));
  }
  elements.month.value = now.getMonth();
  elements.year.value = now.getFullYear();
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function render() {
  const payments = sortPayments(currentPayments());
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const periodName = `${monthNames[Number(elements.month.value)]} ${elements.year.value}`;

  elements.total.textContent = currency.format(total);
  elements.count.textContent = payments.length;
  elements.totalCaption.textContent = payments.length === 0 ? 'Aun no hay pagos registrados' : `${payments.length} ${payments.length === 1 ? 'pago registrado' : 'pagos registrados'} este mes`;
  elements.label.textContent = periodName;
  elements.body.innerHTML = payments.map((payment) => `
    <tr>
      <td>${formatDate(payment.date)}</td>
      <td>${escapeHtml(payment.concept)}</td>
      <td class="amount-cell">${currency.format(Number(payment.amount))}</td>
      <td>
        <button class="action-button" type="button" data-action="edit" data-id="${payment.id}">Editar</button>
        <button class="action-button delete" type="button" data-action="delete" data-id="${payment.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');
  elements.empty.hidden = payments.length > 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function resetForm() {
  elements.form.reset();
  elements.editingId.value = '';
  elements.formTitle.textContent = 'Agregar pago';
  elements.submit.innerHTML = '<span>+</span> Agregar pago';
  elements.cancel.classList.add('hidden');
  elements.error.textContent = '';
}

function showError(message) {
  elements.error.textContent = message;
}

function handleSubmit(event) {
  event.preventDefault();
  const date = elements.date.value;
  const concept = elements.concept.value.trim();
  const amount = Number(elements.amount.value);
  if (!date || !concept || elements.amount.value === '') return showError('Completa todos los campos para continuar.');
  if (!Number.isFinite(amount) || amount < 0) return showError('El monto debe ser un numero valido mayor o igual a cero.');

  const payments = currentPayments();
  const editingId = elements.editingId.value;
  if (editingId) {
    const payment = payments.find((item) => item.id === editingId);
    if (payment) Object.assign(payment, { date, concept, amount });
  } else {
    payments.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date, concept, amount });
  }
  records[periodKey()] = sortPayments(payments);
  saveRecords();
  resetForm();
  render();
}

function startEditing(id) {
  const payment = currentPayments().find((item) => item.id === id);
  if (!payment) return;
  elements.date.value = payment.date;
  elements.concept.value = payment.concept;
  elements.amount.value = payment.amount;
  elements.editingId.value = id;
  elements.formTitle.textContent = 'Editar pago';
  elements.submit.innerHTML = '<span>&#10003;</span> Guardar cambios';
  elements.cancel.classList.remove('hidden');
  elements.error.textContent = '';
  elements.concept.focus();
}

function deletePayment(id) {
  const payment = currentPayments().find((item) => item.id === id);
  if (!payment || !window.confirm(`Eliminar el pago "${payment.concept}"?`)) return;
  records[periodKey()] = currentPayments().filter((item) => item.id !== id);
  saveRecords();
  if (elements.editingId.value === id) resetForm();
  render();
}

function exportCsv() {
  const payments = sortPayments(currentPayments());
  const header = ['Fecha', 'Concepto', 'Monto'];
  const rows = payments.map((payment) => [
    payment.date,
    payment.concept,
    Number(payment.amount).toFixed(2)
  ]);
  const csvRows = [header, ...rows].map((row) => row
    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
    .join(';'));
  const csvContent = `\ufeff${csvRows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pagos_${monthNames[Number(elements.month.value)].toLowerCase()}_${elements.year.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

elements.form.addEventListener('submit', handleSubmit);
elements.cancel.addEventListener('click', resetForm);
elements.month.addEventListener('change', () => { resetForm(); render(); });
elements.year.addEventListener('change', () => { resetForm(); render(); });
elements.body.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'edit') startEditing(button.dataset.id);
  if (button.dataset.action === 'delete') deletePayment(button.dataset.id);
});
elements.export.addEventListener('click', exportCsv);

populatePeriodSelectors();
render();
