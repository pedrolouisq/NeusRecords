const itemsBody = document.getElementById("itemsBody");
const emitterFields = ["issuerName", "issuerEmail", "issuerPhone"];
const currencyOptions = {
	COP: { locale: "es-CO", decimals: 0, prefix: "COP $ ", suffix: "" },
	USD: { locale: "en-US", decimals: 2, prefix: "USD $ ", suffix: "" },
	EUR: { locale: "es-ES", decimals: 2, prefix: "EUR ", suffix: " €" }
};

function formatCurrency(value) {
	const selectedCurrency = document.getElementById("currency").value;
	const configuration = currencyOptions[selectedCurrency];
	const amount = Number.isFinite(value) ? value : 0;
	const formatted = new Intl.NumberFormat(configuration.locale, {
		minimumFractionDigits: configuration.decimals,
		maximumFractionDigits: configuration.decimals
	}).format(amount);
	return `${configuration.prefix}${formatted}${configuration.suffix}`;
}

function updateCurrencyLabel() {
	const selectedCurrency = document.getElementById("currency").value;
	const labels = { COP: "COP ($)", USD: "USD ($)", EUR: "EUR (€)" };
	document.getElementById("currencyPrint").textContent = labels[selectedCurrency];
}

function createItemRow(description = "", quantity = 1, price = 0) {
	const row = document.createElement("tr");
	row.className = "item-row";
	row.innerHTML = `
		<td><label class="sr-only">Descripción</label><input class="item-description" type="text" value="${description}" placeholder="Producto o servicio"></td>
		<td><label class="sr-only">Cantidad</label><input class="item-quantity" type="number" min="0" step="0.01" value="${quantity}"></td>
		<td><label class="sr-only">Precio unitario</label><input class="item-price" type="number" min="0" step="0.01" value="${price}"></td>
		<td class="row-total">0,00 €</td>
		<td><button class="remove-item" type="button" aria-label="Eliminar item">×</button></td>
	`;
	itemsBody.appendChild(row);
	calculateTotals();
}

function calculateTotals() {
	let subtotal = 0;
	document.querySelectorAll(".item-row").forEach((row) => {
		const quantity = Math.max(0, Number(row.querySelector(".item-quantity").value) || 0);
		const price = Math.max(0, Number(row.querySelector(".item-price").value) || 0);
		const rowTotal = quantity * price;
		row.querySelector(".row-total").textContent = formatCurrency(rowTotal);
		subtotal += rowTotal;
	});

	document.getElementById("subtotal").textContent = formatCurrency(subtotal);
	document.getElementById("grandTotal").textContent = formatCurrency(subtotal);
}

function saveEmitterData(event) {
	localStorage.setItem("quickInvoiceEmitter", JSON.stringify(
		Object.fromEntries(emitterFields.map((id) => [id, event.target.form?.querySelector(`#${id}`)?.value ?? document.getElementById(id).value]))
	));
}

function loadEmitterData() {
	const savedData = JSON.parse(localStorage.getItem("quickInvoiceEmitter") || "null");
	if (!savedData) return;
	emitterFields.forEach((id) => {
		if (savedData[id] !== undefined) document.getElementById(id).value = savedData[id];
	});
}

document.getElementById("addItemButton").addEventListener("click", () => createItemRow());
document.getElementById("currency").addEventListener("change", () => {
	updateCurrencyLabel();
	calculateTotals();
});
document.getElementById("printButton").addEventListener("click", () => window.print());

itemsBody.addEventListener("input", calculateTotals);
itemsBody.addEventListener("click", (event) => {
	if (!event.target.classList.contains("remove-item")) return;
	const rows = document.querySelectorAll(".item-row");
	if (rows.length > 1) event.target.closest(".item-row").remove();
	calculateTotals();
});

emitterFields.forEach((id) => document.getElementById(id).addEventListener("input", saveEmitterData));

const today = new Date();
const toDateInput = (date) => date.toISOString().slice(0, 10);
document.getElementById("issueDate").value = toDateInput(today);
loadEmitterData();
updateCurrencyLabel();
createItemRow("Servicio / producto", 1, 0);
