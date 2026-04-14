const timeline = document.querySelector('#timeline');
const scheduleStatus = document.querySelector('#schedule-status');
const dayTabs = document.querySelector('#day-tabs');
const modalRoot = document.querySelector('#modal-root');
const modalBackdrop = document.querySelector('#modal-backdrop');
const modalPanel = document.querySelector('#modal-panel');
const modalClose = document.querySelector('#modal-close');

const modalFields = {
	category: document.querySelector('#modal-category'),
	title: document.querySelector('#modal-title'),
	subtitle: document.querySelector('#modal-subtitle'),
	easyTitle: document.querySelector('#modal-easy-title'),
	meta: document.querySelector('#modal-meta'),
	abstract: document.querySelector('#modal-abstract'),
	affiliation: document.querySelector('#modal-affiliation'),
	achievements: document.querySelector('#modal-achievements'),
	affiliationBlock: document.querySelector('#modal-affiliation-block'),
	achievementsBlock: document.querySelector('#modal-achievements-block')
};

const sectionMap = {
	1: '第1部',
	2: '第2部',
	3: '第3部',
	4: '第4部'
};

const dayLabelMap = {
	25: '4月25日（土）',
	26: '4月26日（日）'
};

let researchItems = [];
let activeDay = 25;
let lastFocusedButton = null;
const specialTimeSlots = new Set(['11:07', '11:41', '14:37']);
const researchesPath = './data/researches.json';

function buildResearchesUrl() {
	const separator = researchesPath.includes('?') ? '&' : '?';
	return `${researchesPath}${separator}t=${Date.now()}`;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function setStatus(message) {
	if (scheduleStatus) {
		scheduleStatus.textContent = message;
	}
}

function formatTime(value) {
	if (!value) {
		return '--:--';
	}
	const parts = String(value).split(':');
	if (parts.length >= 2) {
		return `${parts[0]}:${parts[1]}`;
	}
	return String(value);
}

function isSpecialTimeSlot(value) {
	return specialTimeSlots.has(formatTime(value));
}

function normalizeText(value) {
	if (value === null || value === undefined) {
		return '';
	}
	return String(value).trim();
}

function isTeacherGrade(grade) {
	return normalizeText(grade) === '教員';
}

function isObGrade(grade) {
	return normalizeText(grade).toUpperCase() === 'OB';
}

function buildRoleLabel(item) {
	const grade = normalizeText(item.grade);
	const affiliation = normalizeText(item.affiliation);

	if (isTeacherGrade(grade)) {
		return affiliation ? `${affiliation}教員` : '教員';
	}

	if (isObGrade(grade)) {
		return affiliation ? `${affiliation}OB` : 'OB';
	}

	return grade || '学年未定';
}

function buildPresenterHtml(item) {
	const presenter = normalizeText(item.presenter) || '発表者未定';
	const escapedPresenter = escapeHtml(presenter);

	if (isTeacherGrade(item.grade)) {
		return `${escapedPresenter}<span style="font-size:0.78em; opacity:0.82; margin-left:0.25em;">先生</span>`;
	}

	if (isObGrade(item.grade)) {
		return `${escapedPresenter}<span style="font-size:0.78em; opacity:0.82; margin-left:0.25em;">さん</span>`;
	}

	return escapedPresenter;
}

function createTimelineMarkup(items) {
	if (items.length === 0) {
		return `
			<div class="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-white/55">
				該当日の発表データはありません。
			</div>
		`;
	}

	return items
		.map((item, index) => {
			const delay = 100 + index * 45;
			const roleLabel = buildRoleLabel(item);
			const presenterHtml = buildPresenterHtml(item);
			const special = isSpecialTimeSlot(item.time);
			const lineClass = special
				? 'from-[#dcbbff]/80 via-[#d8ff6b]/25 to-transparent'
				: 'from-festival-lime/70 via-white/10 to-transparent';
			const dotClass = special
				? 'bg-[#b87bff] shadow-[0_0_0_6px_rgba(184,123,255,0.18),0_0_16px_rgba(203,255,76,0.28)]'
				: 'bg-festival-lime shadow-[0_0_0_6px_rgba(209,255,0,0.08)]';
			const timeClass = special ? 'text-[#d7b8ff]' : 'text-festival-lime';
			const mobileTimeClass = special
				? 'border-[#cfabff]/40 bg-[linear-gradient(135deg,rgba(190,125,255,0.24),rgba(208,255,89,0.15))] text-[#e6d4ff]'
				: 'border-festival-lime/20 bg-festival-lime/10 text-festival-lime';
			const cardClass = special
				? 'hover:border-[#c9a2ff]/70 focus:ring-[#cfaeff]/70'
				: 'hover:border-festival-lime/60 focus:ring-festival-lime/70';
			const subtitleClass = special ? 'text-[#dbc3ff]' : 'text-festival-mist';
			const detailButtonClass = special
				? 'bg-[linear-gradient(130deg,#b57cff_0%,#d3a8ff_56%,#d8ff5c_100%)] text-[#1d0b2f] shadow-[0_10px_24px_rgba(181,124,255,0.32)]'
				: 'bg-festival-lime text-black';
			return `
				<article class="group relative animate-rise opacity-0 [animation-delay:${delay}ms]">
					<div class="absolute left-[1.1rem] top-16 bottom-[-1.4rem] w-px bg-gradient-to-b ${lineClass} ${index === items.length - 1 ? 'hidden' : ''}"></div>
					<div class="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-4">
						<div class="relative pt-2 sm:pt-3">
							<div class="absolute left-3 top-5 h-3 w-3 rounded-full border-2 border-black ${dotClass} sm:left-auto sm:right-0"></div>
							<p class="hidden pr-4 text-right font-display text-sm font-bold tracking-[0.08em] ${timeClass} sm:block">${escapeHtml(formatTime(item.time))}</p>
						</div>
						<button
							type="button"
							class="research-card w-full rounded-[1.6rem] border border-white/10 bg-black/40 p-4 text-left shadow-lg shadow-black/20 transition duration-200 ${cardClass} hover:bg-black/55 focus:outline-none focus:ring-2 sm:min-h-[12.5rem] sm:p-5"
							data-research-id="${item.id}"
							aria-label="${escapeHtml(item.title)} の詳細を表示"
						>
							<p class="mb-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] ${mobileTimeClass} sm:hidden">${escapeHtml(formatTime(item.time))}</p>
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">${escapeHtml(item.dayLabel)}</span>
								<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/50">${escapeHtml(item.location)}</span>
							</div>
							<h3 class="mt-4 text-lg font-bold leading-7 text-white sm:text-xl">${escapeHtml(item.title)}</h3>
							${item.subtitle ? `<p class="mt-1 text-sm leading-6 ${subtitleClass} sm:text-base">${escapeHtml(item.subtitle)}</p>` : ''}
							<p class="mt-2 text-sm leading-7 text-white/65">${presenterHtml} / ${escapeHtml(roleLabel)}</p>
							<div class="mt-4 flex items-center justify-end gap-3">
								<span class="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-bold ${detailButtonClass}">詳細を見る</span>
							</div>
						</button>
					</div>
				</article>
			`;
		})
		.join('');
}

function updateTabs(days) {
	if (!dayTabs) {
		return;
	}

	dayTabs.innerHTML = days
		.map((day) => {
			const active = day === activeDay;
			const baseClass = active
				? 'border-festival-lime bg-festival-lime text-black'
				: 'border-white/20 bg-white/5 text-white hover:border-festival-lime/60 hover:text-festival-lime';
			return `
				<button type="button" class="day-tab rounded-full border px-5 py-2 text-sm font-bold transition ${baseClass}" data-day="${day}">
					${escapeHtml(dayLabelMap[day] || `${day}日`)}
				</button>
			`;
		})
		.join('');
}

function renderTimeline() {
	const filtered = researchItems.filter((item) => item.day === activeDay);
	timeline.innerHTML = createTimelineMarkup(filtered);
	setStatus(`${dayLabelMap[activeDay] || `${activeDay}日`} ${filtered.length}件を表示中`);
}

function openModal(item, triggerButton) {
	lastFocusedButton = triggerButton;
	modalFields.category.textContent = `${item.dayLabel} / ${item.location}`;
	modalFields.title.textContent = item.title;
	modalFields.subtitle.textContent = item.subtitle || '';
	modalFields.easyTitle.innerHTML = `${buildPresenterHtml(item)} / ${escapeHtml(buildRoleLabel(item))}`;
	modalFields.meta.textContent = `${formatTime(item.time)} / ${item.location}`;
	modalFields.abstract.textContent = item.description || '詳細情報はありません';
	modalFields.affiliation.textContent = item.affiliation || '情報なし';
	modalFields.achievements.textContent = item.achievements || '情報なし';

	modalRoot.classList.remove('hidden');
	modalRoot.classList.add('pointer-events-auto');
	modalBackdrop.classList.remove('opacity-0');
	modalBackdrop.classList.add('animate-fadeIn');
	modalPanel.classList.remove('opacity-0', 'translate-y-6');
	modalPanel.classList.add('animate-sheetUp');
	document.body.classList.add('overflow-hidden');
	modalClose.focus();
}

function closeModal() {
	modalRoot.classList.add('hidden');
	modalRoot.classList.remove('pointer-events-auto');
	modalBackdrop.classList.add('opacity-0');
	modalBackdrop.classList.remove('animate-fadeIn');
	modalPanel.classList.add('opacity-0', 'translate-y-6');
	modalPanel.classList.remove('animate-sheetUp');
	document.body.classList.remove('overflow-hidden');

	if (lastFocusedButton) {
		lastFocusedButton.focus();
	}
	lastFocusedButton = null;
}

function bindEvents() {
	timeline?.addEventListener('click', (event) => {
		const trigger = event.target.closest('.research-card');
		if (!trigger) {
			return;
		}

		const selectedItem = researchItems.find((item) => String(item.id) === trigger.dataset.researchId && item.day === activeDay);
		if (selectedItem) {
			openModal(selectedItem, trigger);
		}
	});

	dayTabs?.addEventListener('click', (event) => {
		const tab = event.target.closest('.day-tab');
		if (!tab) {
			return;
		}

		const selectedDay = Number(tab.dataset.day);
		if (!Number.isNaN(selectedDay) && selectedDay !== activeDay) {
			activeDay = selectedDay;
			const days = [...new Set(researchItems.map((item) => item.day))].sort((a, b) => a - b);
			updateTabs(days);
			renderTimeline();
		}
	});

	modalClose?.addEventListener('click', closeModal);
	modalBackdrop?.addEventListener('click', closeModal);
	modalRoot?.addEventListener('click', (event) => {
		if (!event.target.closest('#modal-panel')) {
			closeModal();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modalRoot.classList.contains('hidden')) {
			closeModal();
		}
	});
}

async function loadResearches() {
	try {
		const response = await fetch(buildResearchesUrl(), {
			cache: 'no-store',
			headers: {
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache'
			}
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		const presentations = Array.isArray(data) ? data : data.presentations;
		if (!Array.isArray(presentations) || presentations.length === 0) {
			throw new Error('発表データが空です');
		}

		researchItems = presentations
			.filter((item) => item && item.title)
			.map((item) => ({
				id: item.id,
				day: item.day,
				dayLabel: dayLabelMap[item.day] || `${item.day}日`,
				time: item.time || '--:--:--',
				title: item.title,
				subtitle: item.subtitle || '',
				presenter: item.presenter || '発表者未定',
				grade: item.grade || '学年未定',
				affiliation: item.affiliation || '',
				achievements: item.achievements || '',
				description: item.description || '',
				location: sectionMap[item.section] || `第${item.section}部`
			}))
			.sort((a, b) => {
				if (a.day !== b.day) {
					return a.day - b.day;
				}
				return a.time.localeCompare(b.time);
			});

		const days = [...new Set(researchItems.map((item) => item.day))].sort((a, b) => a - b);
		if (!days.includes(activeDay)) {
			activeDay = days[0];
		}

		updateTabs(days);
		renderTimeline();
	} catch (error) {
		console.error('研究データの読み込みに失敗しました', error);
		timeline.innerHTML = `
			<div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm leading-7 text-red-100">
				タイムテーブルの読み込みに失敗しました。Live Server などの簡易サーバー経由で表示してください。
			</div>
		`;
		if (dayTabs) {
			dayTabs.innerHTML = '';
		}
		setStatus('読み込み失敗');
	}
}

bindEvents();
loadResearches();
