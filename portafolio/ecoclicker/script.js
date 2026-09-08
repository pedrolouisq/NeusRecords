let energia = 0;
let energiaPorClic = 1;
let tieneGrafeno = false;
const costoGrafeno = 200;
let energiaTotalAcumulada = 0;
let nivelPrestigio = 0;
let multiplicadorPrestigio = 1;
const umbralPrestigio = 50000;
let huellaCarbono = 100;
let juegoGanado = false;
let modoLibre = false;
let modoSobrecargaActivo = false;
let eventoSobrecargaVisible = false;
let temporizadorSobrecarga;
const megaProyectos = {
	coal: { costo: 100000, reduccion: 25, comprado: false },
	amazon: { costo: 500000, reduccion: 50, comprado: false },
	renewable: { costo: 2000000, reduccion: 25, comprado: false }
};
const logros = {
	energia1000: false,
	turbinas10: false
};

const miniTurbina = { cantidad: 0, costo: 50, produccionWps: 1 };
const granjaSolar = { cantidad: 0, costo: 400, produccionWps: 10 };
const centralHidroelectrica = { cantidad: 0, costo: 3000, produccionWps: 80 };

const edificios = {
	wind: miniTurbina,
	solar: granjaSolar,
	hydro: centralHidroelectrica
};

const energyTotal = document.querySelector('#energy-total');
const energyRate = document.querySelector('#energy-rate');
const ownedTotal = document.querySelector('#owned-total');
const toast = document.querySelector('#toast');
const grafenoCard = document.querySelector('#grafeno-card');
const buyGrafenoButton = document.querySelector('#buy-grafeno');
const notificacionLogro = document.querySelector('#notificacion-logro');
const textoLogro = document.querySelector('#texto-logro');
const prestigeSection = document.querySelector('.prestige-section');
const prestigeLevel = document.querySelector('#prestige-level');
const prestigeMultiplier = document.querySelector('#prestige-multiplier');
const prestigeProgress = document.querySelector('#prestige-progress');
const prestigeButton = document.querySelector('#prestige-button');
const carbonCard = document.querySelector('#carbon-card');
const carbonValue = document.querySelector('#carbon-value');
const carbonProgressFill = document.querySelector('#carbon-progress-fill');
const carbonTrack = document.querySelector('.carbon-track');
const victoryOverlay = document.querySelector('#victory-overlay');
const continueFreeButton = document.querySelector('#continue-free');
const generateButton = document.querySelector('#generate-button');
const floatingLayer = document.querySelector('#floating-layer');

function calcularWpsTotal() {
	const produccionBase = Object.values(edificios).reduce((total, edificio) => total + edificio.cantidad * edificio.produccionWps, 0);
	return produccionBase * multiplicadorPrestigio;
}

function formatNumber(value) {
	return Math.floor(value).toLocaleString('es-ES');
}

function actualizarPantalla() {
	const wpsTotal = calcularWpsTotal();
	energyTotal.textContent = formatNumber(energia);
	energyRate.textContent = formatNumber(wpsTotal);
	ownedTotal.textContent = Object.values(edificios).reduce((total, edificio) => total + edificio.cantidad, 0);

	document.querySelectorAll('.upgrade-card[data-id]').forEach((card) => {
		const edificio = edificios[card.dataset.id];
		card.querySelector('[data-cost]').textContent = `${formatNumber(edificio.costo)} W`;
		card.querySelector('[data-owned]').textContent = edificio.cantidad;
		const button = card.querySelector('.buy-button');
		button.disabled = energia < edificio.costo;
		button.setAttribute('aria-label', `Comprar ${card.querySelector('h3').textContent} por ${formatNumber(edificio.costo)} W`);
	});

	buyGrafenoButton.disabled = tieneGrafeno || energia < costoGrafeno;
	if (tieneGrafeno) {
		grafenoCard.classList.add('researched');
		buyGrafenoButton.textContent = 'Investigado';
	} else {
		grafenoCard.classList.remove('researched');
		buyGrafenoButton.textContent = 'Investigar';
	}

	prestigeLevel.textContent = nivelPrestigio;
	prestigeMultiplier.textContent = `+${Math.round((multiplicadorPrestigio - 1) * 100)}%`;
	prestigeButton.disabled = energiaTotalAcumulada < umbralPrestigio;
	prestigeSection.classList.toggle('ready', !prestigeButton.disabled);
	prestigeProgress.textContent = prestigeButton.disabled
		? `Requiere ${formatNumber(umbralPrestigio)} W acumulados (${formatNumber(energiaTotalAcumulada)} W)`
		: 'Red global lista para activarse';

	const huellaVisible = Math.max(0, huellaCarbono);
	carbonValue.textContent = `${huellaVisible}%`;
	carbonProgressFill.style.width = `${huellaVisible}%`;
	carbonTrack.setAttribute('aria-valuenow', huellaVisible);
	carbonCard.classList.toggle('low', huellaVisible <= 50);
	document.querySelectorAll('.mega-project-card').forEach((card) => {
		const proyecto = megaProyectos[card.dataset.project];
		const button = card.querySelector('.project-button');
		button.disabled = proyecto.comprado || energia < proyecto.costo;
		if (proyecto.comprado) {
			card.classList.add('completed');
			button.textContent = 'Completado';
		} else {
			card.classList.remove('completed');
			button.textContent = 'Activar proyecto';
		}
	});
}

function showToast(message) {
	toast.textContent = message;
	toast.classList.add('show');
	window.clearTimeout(showToast.timeout);
	showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function guardarJuego() {
	const partida = {
		energia,
		energiaTotalAcumulada,
		energiaPorClic,
		wps: calcularWpsTotal(),
		edificios: {
			wind: { cantidad: miniTurbina.cantidad, costo: miniTurbina.costo },
			solar: { cantidad: granjaSolar.cantidad, costo: granjaSolar.costo },
			hydro: { cantidad: centralHidroelectrica.cantidad, costo: centralHidroelectrica.costo }
		},
		tieneGrafeno,
		nivelPrestigio,
		huellaCarbono,
		modoLibre,
		megaProyectos: Object.fromEntries(Object.entries(megaProyectos).map(([id, proyecto]) => [id, { comprado: proyecto.comprado }])),
		logros
	};
	localStorage.setItem('ecoClicsPartida', JSON.stringify(partida));
}

function cargarJuego() {
	const partidaGuardada = localStorage.getItem('ecoClicsPartida');
	if (!partidaGuardada) return;

	try {
		const partida = JSON.parse(partidaGuardada);
		energia = Number(partida.energia) || 0;
		energiaTotalAcumulada = Number(partida.energiaTotalAcumulada) || 0;
		nivelPrestigio = Number(partida.nivelPrestigio) || 0;
		multiplicadorPrestigio = 1 + nivelPrestigio * 0.2;
		tieneGrafeno = Boolean(partida.tieneGrafeno);
		energiaPorClic = tieneGrafeno ? 2 : 1;
		huellaCarbono = Number.isFinite(Number(partida.huellaCarbono)) ? Math.max(0, Number(partida.huellaCarbono)) : 100;
		modoLibre = Boolean(partida.modoLibre);

		Object.entries(edificios).forEach(([id, edificio]) => {
			const edificioGuardado = partida.edificios?.[id];
			if (!edificioGuardado) return;
			edificio.cantidad = Number(edificioGuardado.cantidad) || 0;
			edificio.costo = Number(edificioGuardado.costo) || edificio.costo;
		});

		Object.assign(logros, partida.logros || {});
		Object.entries(megaProyectos).forEach(([id, proyecto]) => {
			proyecto.comprado = Boolean(partida.megaProyectos?.[id]?.comprado);
		});
	} catch (error) {
		localStorage.removeItem('ecoClicsPartida');
	}
}

function desbloquearLogro(texto) {
	textoLogro.textContent = texto;
	notificacionLogro.classList.add('visible');
	guardarJuego();
	window.clearTimeout(desbloquearLogro.timeout);
	desbloquearLogro.timeout = window.setTimeout(() => notificacionLogro.classList.remove('visible'), 4000);
}

function comprobarLogros() {
	if (!logros.energia1000 && energiaTotalAcumulada >= 1000) {
		logros.energia1000 = true;
		desbloquearLogro('Primeros 1,000 W acumulados');
	}
	if (!logros.turbinas10 && miniTurbina.cantidad >= 10) {
		logros.turbinas10 = true;
		desbloquearLogro('Comprar 10 turbinas');
	}
}

function sumarEnergia(cantidad) {
	energia += cantidad;
	energiaTotalAcumulada += cantidad;
}

function crearNumeroFlotante(valor, x, y) {
	const numero = document.createElement('span');
	numero.className = 'floating-number';
	numero.textContent = `+${formatNumber(valor)} W`;
	numero.style.left = `${x}px`;
	numero.style.top = `${y}px`;
	floatingLayer.appendChild(numero);
	numero.addEventListener('animationend', () => numero.remove(), { once: true });
}

function activarModoSobrecarga() {
	modoSobrecargaActivo = true;
	generateButton.classList.add('overload-active');
	generateButton.setAttribute('aria-label', 'Generar energía. Modo Sobrecarga activo');
	showToast('Modo Sobrecarga activo: clics x5');
	window.clearTimeout(activarModoSobrecarga.timeout);
	activarModoSobrecarga.timeout = window.setTimeout(() => {
		modoSobrecargaActivo = false;
		generateButton.classList.remove('overload-active');
		generateButton.setAttribute('aria-label', 'Generar energía');
		showToast('Modo Sobrecarga finalizado');
	}, 15000);
}

function mostrarEventoSobrecarga() {
	if (eventoSobrecargaVisible || (juegoGanado && !modoLibre)) return;

	eventoSobrecargaVisible = true;
	const evento = document.createElement('button');
	evento.className = 'overload-event';
	evento.type = 'button';
	evento.textContent = '⚡';
	evento.title = 'Activar Modo Sobrecarga';
	evento.setAttribute('aria-label', 'Activar Modo Sobrecarga');
	evento.style.left = `${Math.max(30, Math.random() * (window.innerWidth - 60))}px`;
	evento.style.top = `${Math.max(45, Math.random() * (window.innerHeight - 90))}px`;
	floatingLayer.appendChild(evento);

	const ocultarEvento = () => {
		eventoSobrecargaVisible = false;
		evento.remove();
	};

	temporizadorSobrecarga = window.setTimeout(ocultarEvento, 6000);
	evento.addEventListener('click', () => {
		window.clearTimeout(temporizadorSobrecarga);
		ocultarEvento();
		activarModoSobrecarga();
	});
}

function comprobarVictoria() {
	if (huellaCarbono <= 0 && !juegoGanado && !modoLibre) {
		huellaCarbono = 0;
		juegoGanado = true;
		victoryOverlay.classList.add('visible');
		guardarJuego();
	}
}

function comprarMegaProyecto(proyecto, nombre) {
	if (proyecto.comprado || energia < proyecto.costo) return;

	energia -= proyecto.costo;
	proyecto.comprado = true;
	huellaCarbono = Math.max(0, huellaCarbono - proyecto.reduccion);
	showToast(`${nombre} activado`);
	actualizarPantalla();
	comprobarVictoria();
	guardarJuego();
}

function comprarCierreCarbon() {
	comprarMegaProyecto(megaProyectos.coal, 'Cierre de centrales de carbón');
}

function comprarReforestacionAmazonas() {
	comprarMegaProyecto(megaProyectos.amazon, 'Reforestación del Amazonas');
}

function comprarMatrizRenovable() {
	comprarMegaProyecto(megaProyectos.renewable, 'Matriz 100% Renovable');
}

function comprarEdificio(edificio, nombre) {
	if (energia < edificio.costo) return;

	energia -= edificio.costo;
	edificio.cantidad += 1;
	edificio.costo *= 1.15;
	showToast(`${nombre} añadida a tu red`);
	comprobarLogros();
	actualizarPantalla();
	guardarJuego();
}

function comprarMiniTurbina() {
	comprarEdificio(miniTurbina, 'Mini Turbina Eólica');
}

function comprarGranjaSolar() {
	comprarEdificio(granjaSolar, 'Granja Solar');
}

function comprarCentralHidroelectrica() {
	comprarEdificio(centralHidroelectrica, 'Central Hidroeléctrica');
}

function comprarGrafeno() {
	if (tieneGrafeno || energia < costoGrafeno) return;

	energia -= costoGrafeno;
	tieneGrafeno = true;
	energiaPorClic = 2;
	showToast('Superconductores de Grafeno investigados');
	actualizarPantalla();
	guardarJuego();
}

generateButton.addEventListener('click', (event) => {
	const multiplicadorGrafeno = tieneGrafeno ? 2 : 1;
	const multiplicadorSobrecarga = modoSobrecargaActivo ? 5 : 1;
	const energiaGenerada = energiaPorClic * multiplicadorGrafeno * multiplicadorPrestigio * multiplicadorSobrecarga;
	const buttonBounds = generateButton.getBoundingClientRect();
	const clickX = event.clientX || buttonBounds.left + buttonBounds.width / 2;
	const clickY = event.clientY || buttonBounds.top + buttonBounds.height / 2;
	sumarEnergia(energiaGenerada);
	crearNumeroFlotante(energiaGenerada, clickX, clickY);
	actualizarPantalla();
	guardarJuego();
});

document.querySelectorAll('.upgrade-card').forEach((card) => {
	card.querySelector('.buy-button').addEventListener('click', () => {
		if (card.dataset.id === 'wind') comprarMiniTurbina();
		if (card.dataset.id === 'solar') comprarGranjaSolar();
		if (card.dataset.id === 'hydro') comprarCentralHidroelectrica();
	});
});

buyGrafenoButton.addEventListener('click', comprarGrafeno);
document.querySelector('#buy-coal').addEventListener('click', comprarCierreCarbon);
document.querySelector('#buy-amazon').addEventListener('click', comprarReforestacionAmazonas);
document.querySelector('#buy-renewable').addEventListener('click', comprarMatrizRenovable);

continueFreeButton.addEventListener('click', () => {
	modoLibre = true;
	juegoGanado = false;
	victoryOverlay.classList.remove('visible');
	guardarJuego();
});

prestigeButton.addEventListener('click', () => {
	if (energiaTotalAcumulada < umbralPrestigio) return;
	if (!window.confirm('¿Reiniciar tu imperio y activar la Red Global? Conservarás tus logros y ganarás un +20% permanente.')) return;

	energia = 0;
	energiaPorClic = 1;
	tieneGrafeno = false;
	miniTurbina.cantidad = 0;
	miniTurbina.costo = 50;
	granjaSolar.cantidad = 0;
	granjaSolar.costo = 400;
	centralHidroelectrica.cantidad = 0;
	centralHidroelectrica.costo = 3000;
	nivelPrestigio += 1;
	multiplicadorPrestigio = 1 + nivelPrestigio * 0.2;
	showToast(`Red Global activada: Nivel ${nivelPrestigio}`);
	actualizarPantalla();
	guardarJuego();
});

window.setInterval(() => {
	if (!juegoGanado || modoLibre) {
		sumarEnergia(calcularWpsTotal());
		comprobarLogros();
		actualizarPantalla();
		comprobarVictoria();
	}
}, 1000);

window.setInterval(() => {
	if (Math.random() < 0.5) mostrarEventoSobrecarga();
}, 90000);

cargarJuego();
actualizarPantalla();
if (huellaCarbono <= 0 && !modoLibre) comprobarVictoria();
window.setInterval(guardarJuego, 10000);
