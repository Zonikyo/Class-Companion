// --- main.js ---
// Core application logic, Compass calendar, UI management, settings, notifications.

// --- Constants & DOM Elements (from index.html) ---
const CALENDAR_URL_KEY = 'compassCalendarUrl';
const WORKER_URL_KEY = 'compassWorkerUrl';
const CLASS_MAPPINGS_KEY = 'compassClassMappings';
const CLASS_COLORS_KEY = 'compassClassColors';
const BACKGROUND_URL_KEY = 'compassBackgroundUrl';
const CANVAS_DOMAIN_KEY = 'canvasDomain'; // Used here for linking
const CANVAS_TOKEN_KEY = 'canvasToken'; // Used here for linking
const CANVAS_COURSE_MAPPINGS_KEY = 'canvasCourseMappings';
const NOTIFICATION_SETTINGS_KEY = 'classCompanionNotificationSettings';
const ONBOARDING_COMPLETE_KEY = 'classCompanionOnboardingComplete';

const DEFAULT_WORKER_URL = 'https://class-companion.thebestmate100.workers.dev';
const DEFAULT_BACKGROUND_URL = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.motionbolt.com%2Fwp-content%2Fuploads%2F2021%2F12%2FBackground_2.jpg&f=1&nofb=1&ipt=fb1e82a0f77bb090f3f284f3dee0d6b334a89a1437206a52786427eff0f2c650';
const REFRESH_INTERVAL = 10000;
const STATUS_UPDATE_INTERVAL = 1000;
const NOTIFICATION_CHECK_INTERVAL = 30000;
const CLOCK_UPDATE_INTERVAL = 1000;

const PASTEL_COLORS = [
    { name: 'Dark Mint', value: 'hsl(180, 40%, 45%)' },
    { name: 'Dark Lavender', value: 'hsl(240, 40%, 60%)' },
    { name: 'Dark Peach', value: 'hsl(15, 70%, 60%)' },
    { name: 'Dark Sky Blue', value: 'hsl(200, 50%, 55%)' },
    { name: 'Dark Rose', value: 'hsl(330, 50%, 60%)' },
    { name: 'Dark Periwinkle', value: 'hsl(220, 50%, 60%)'},
    { name: 'Dark Gold', value: 'hsl(50, 60%, 55%)' },
    { name: 'Dark Sage', value: 'hsl(100, 30%, 50%)' },
    { name: 'Dark Coral', value: 'hsl(0, 60%, 60%)' },
    { name: 'Dark Plum', value: 'hsl(270, 35%, 45%)' }
];

const ICONS = {
     clock: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
     location: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
     teacher: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
     event: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
     assignment: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`,
     cloudError: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`,
     link: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block ml-1 text-indigo-400 hover:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>`
};

// Onboarding Elements
const onboardingOverlay = document.getElementById('onboardingOverlay');
const onboardingCard = document.getElementById('onboardingCard');
const stepIndicatorContainer = document.getElementById('stepIndicatorContainer');
const onboardingSteps = [
    document.getElementById('onboardingStep1'),
    document.getElementById('onboardingStep2'),
    document.getElementById('onboardingStep3')
];
const onboardingWorkerUrlInput = document.getElementById('onboardingWorkerUrl');
const onboardingCalendarUrlInput = document.getElementById('onboardingCalendarUrl');
const onboardingCanvasDomainInput = document.getElementById('onboardingCanvasDomain');
const onboardingCanvasTokenInput = document.getElementById('onboardingCanvasToken');
const onboardingErrorMessage = document.getElementById('onboardingErrorMessage');

const nextToStep2Btn = document.getElementById('nextToStep2');
const prevToStep1Btn = document.getElementById('prevToStep1');
const nextToStep3Btn = document.getElementById('nextToStep3');
const prevToStep2Btn = document.getElementById('prevToStep2');
const finishOnboardingBtn = document.getElementById('finishOnboarding');
const skipCanvasStepBtn = document.getElementById('skipCanvasStep');

// Main App Elements
const workerUrlInput = document.getElementById('workerUrl');
const urlInput = document.getElementById('calendarUrl');
const loadButton = document.getElementById('loadCalendarBtn');
const calendarDisplayList = document.getElementById('calendarDisplayList');
const calendarDisplayWeek = document.getElementById('calendarDisplayWeek');
const calendarDisplayDay = document.getElementById('calendarDisplayDay');
const weeklyViewGrid = document.getElementById('weeklyViewGrid');
// const dayViewGrid = document.getElementById('dayViewGrid'); // Not used if renderDayView builds its own structure

const calendarMessageArea = document.getElementById('calendarMessageArea');
const settingsMessageArea = document.getElementById('settingsMessageArea');
const searchBox = document.getElementById('searchBox');
const sortOrderSelect = document.getElementById('sortOrder');
const navLinks = document.querySelectorAll('.nav-link');
const settingsSection = document.getElementById('settingsSection');
const calendarSection = document.getElementById('calendarSection');
const canvasSection = document.getElementById('canvasSection');
const listControls = document.getElementById('listControls');
const dayViewBtn = document.getElementById('dayViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const weekViewBtn = document.getElementById('weekViewBtn');
const mappingsListDiv = document.getElementById('mappingsList');
const addMappingBtn = document.getElementById('addMappingBtn');
const newMappingCodeInput = document.getElementById('newMappingCode');
const newMappingNameInput = document.getElementById('newMappingName');
const newMappingColorInput = document.getElementById('newMappingColor');
const newMappingPastelColorSelect = document.getElementById('newMappingPastelColor');
const sidebarEventsDiv = document.getElementById('sidebarEvents');
const sidebar = document.getElementById('sidebar');
const backgroundUrlInput = document.getElementById('backgroundUrl');
const saveBackgroundBtn = document.getElementById('saveBackgroundBtn');
const resetBackgroundBtn = document.getElementById('resetBackgroundBtn');
const statusIndicatorDiv = document.getElementById('statusIndicator');
const statusIconSpan = document.getElementById('statusIcon');
const statusTextSpan = document.getElementById('statusText');
const canvasDomainInput = document.getElementById('canvasDomain');
const canvasTokenInput = document.getElementById('canvasToken');
const saveCanvasSettingsBtn = document.getElementById('saveCanvasSettingsBtn');
// canvasDataMessageArea and canvasCoursesDisplay are managed in canvas.js
const canvasCourseMappingsListDiv = document.getElementById('canvasCourseMappingsList');
const compassClassNameForCanvasInput = document.getElementById('compassClassNameForCanvas');
const canvasCourseIdForMappingInput = document.getElementById('canvasCourseIdForMapping');
const addCanvasCourseMappingBtn = document.getElementById('addCanvasCourseMappingBtn');
const notificationPermissionStatusDiv = document.getElementById('notificationPermissionStatus');
const notifyClassesEnabledCheckbox = document.getElementById('notifyClassesEnabled');
const notifyClassesLeadTimeInput = document.getElementById('notifyClassesLeadTime');
const notifyAssignmentsEnabled1Checkbox = document.getElementById('notifyAssignmentsEnabled1');
const notifyAssignmentsLeadTime1Input = document.getElementById('notifyAssignmentsLeadTime1');
const notifyAssignmentsEnabled2Checkbox = document.getElementById('notifyAssignmentsEnabled2');
const notifyAssignmentsLeadTime2Input = document.getElementById('notifyAssignmentsLeadTime2');
const notifyTimetableChangesEnabledCheckbox = document.getElementById('notifyTimetableChangesEnabled');
const saveNotificationSettingsBtn = document.getElementById('saveNotificationSettingsBtn');
const liveClockDiv = document.getElementById('liveClock');
const canvasClassListContainer = document.getElementById('canvasClassListContainer');
// Canvas Detail Modal elements are expected to be in canvas.js if they are exclusively managed there,
// or here if main.js also interacts with them (e.g., for showing/hiding).
// For now, assuming canvas.js handles its modal's internal elements.
const canvasDetailModal = document.getElementById('canvasDetailModal'); // Main modal div
const closeCanvasDetailModalBtn = document.getElementById('closeCanvasDetailModal'); // Close button


let compassWorkerUrl = DEFAULT_WORKER_URL;
let allParsedEvents = [];
let previousProcessedClassEvents = [];
let processedClassEvents = [];
let processedSidebarEvents = [];
let currentSortOrder = 'time';
let currentSearchTerm = '';
let currentViewMode = 'list';
let classMappings = {};
let classColors = {};
let backgroundUrl = DEFAULT_BACKGROUND_URL;
// canvasDomain, canvasToken, canvasCourseMappings, fetchedCanvasCourses are managed in canvas.js but might be mirrored or accessed
let notificationSettings = {
    classesEnabled: false, classesLeadTime: 5,
    assignmentsEnabled1: false, assignmentsLeadTime1: 60,
    assignmentsEnabled2: false, assignmentsLeadTime2: 5,
    timetableChangesEnabled: false
};
let notificationPermission = Notification.permission;
let sentNotifications = new Set();
let notificationCheckIntervalId = null;
let clockIntervalId = null;
let currentOnboardingStep = 0;

let messageTimeout = null;
let refreshIntervalId = null;
let statusUpdateIntervalId = null;
let isFirstLoad = true;
let isAutoRefreshing = false;
let lastSuccessfulUpdateTime = null;
let currentStatus = 'idle';


// --- Event Listeners ---
if (loadButton) loadButton.addEventListener('click', handleSaveAndLoad);
if (searchBox) searchBox.addEventListener('input', handleSearch);
if (sortOrderSelect) sortOrderSelect.addEventListener('change', handleSort);
if (navLinks) navLinks.forEach(link => link.addEventListener('click', handleNavClick));
if (dayViewBtn) dayViewBtn.addEventListener('click', () => switchViewMode('day'));
if (listViewBtn) listViewBtn.addEventListener('click', () => switchViewMode('list'));
if (weekViewBtn) weekViewBtn.addEventListener('click', () => switchViewMode('week'));
if (addMappingBtn) addMappingBtn.addEventListener('click', handleAddMapping);
if (mappingsListDiv) mappingsListDiv.addEventListener('click', handleMappingListClick);
if (saveBackgroundBtn) saveBackgroundBtn.addEventListener('click', handleSaveBackground);
if (resetBackgroundBtn) resetBackgroundBtn.addEventListener('click', handleResetBackground);
// saveCanvasSettingsBtn listener will be in canvas.js
if (addCanvasCourseMappingBtn) addCanvasCourseMappingBtn.addEventListener('click', handleAddCanvasCourseMapping);
if (canvasCourseMappingsListDiv) canvasCourseMappingsListDiv.addEventListener('click', handleCanvasMappingListClick);
if (newMappingPastelColorSelect) newMappingPastelColorSelect.addEventListener('change', () => { if (newMappingPastelColorSelect.value && newMappingColorInput) { newMappingColorInput.value = newMappingPastelColorSelect.value; }});
if (saveNotificationSettingsBtn) saveNotificationSettingsBtn.addEventListener('click', handleSaveNotificationSettings);
if (closeCanvasDetailModalBtn) closeCanvasDetailModalBtn.addEventListener('click', () => { if (typeof hideCanvasDetailModal === "function") hideCanvasDetailModal(); });
if (canvasDetailModal) canvasDetailModal.addEventListener('click', (event) => { if (event.target === canvasDetailModal && typeof hideCanvasDetailModal === "function") hideCanvasDetailModal(); });


// Onboarding Listeners
if (nextToStep2Btn) nextToStep2Btn.addEventListener('click', () => navigateOnboarding(1));
if (prevToStep1Btn) prevToStep1Btn.addEventListener('click', () => navigateOnboarding(0));
if (nextToStep3Btn) nextToStep3Btn.addEventListener('click', () => navigateOnboarding(2));
if (prevToStep2Btn) prevToStep2Btn.addEventListener('click', () => navigateOnboarding(1));
if (finishOnboardingBtn) finishOnboardingBtn.addEventListener('click', handleFinishOnboarding);
if (skipCanvasStepBtn) skipCanvasStepBtn.addEventListener('click', handleSkipCanvasOnboarding);

document.addEventListener('DOMContentLoaded', initializeApp);

// --- Initialization ---
function initializeApp() {
    if (localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true') {
        initializeMainApp();
    } else {
        if(onboardingWorkerUrlInput) onboardingWorkerUrlInput.value = DEFAULT_WORKER_URL;
        showOnboarding();
    }
}

function initializeMainApp() {
    if(onboardingOverlay) onboardingOverlay.classList.add('hidden');
    populatePastelColorOptions();
    loadSettings();
    applyBackground();
    renderMappingsList();
    renderCanvasCourseMappingsList();
    renderNotificationSettings();
    initializeStatusIndicator();
    setupNotificationPermission();
    startNotificationChecker();
    startLiveClock();
    if (typeof renderCanvasClassListSidebar === "function") renderCanvasClassListSidebar();


    const savedCompassUrl = localStorage.getItem(CALENDAR_URL_KEY);
    if (compassWorkerUrl && savedCompassUrl) {
        if(urlInput) urlInput.value = savedCompassUrl;
        startAutoRefresh(savedCompassUrl);
    } else if (!compassWorkerUrl) {
        showMessage('Please set your Cloudflare Worker URL in Settings.', 'error', 'settings');
        updateStatusIndicator('idle');
    } else if (!savedCompassUrl) {
         showMessage('Go to Settings to enter your Compass calendar URL.', 'info', 'calendar');
         updateStatusIndicator('idle');
    }
    switchSection('calendar');
    switchViewMode('list');
}


// --- Onboarding Functions ---
function showOnboarding() {
    if (!onboardingOverlay || !onboardingCard) return;
    onboardingOverlay.classList.remove('hidden');
    setTimeout(() => {
        onboardingCard.classList.remove('opacity-0', 'scale-95');
        onboardingCard.classList.add('opacity-100', 'scale-100');
    }, 10);
    currentOnboardingStep = 0;
    updateOnboardingStepUI();
}

function updateOnboardingStepUI() {
    onboardingSteps.forEach((step, index) => {
        if (step) {
            if (index === currentOnboardingStep) {
                step.classList.remove('hidden');
                step.classList.add('active-step');
            } else {
                step.classList.add('hidden');
                step.classList.remove('active-step');
            }
        }
    });
    renderStepIndicators();
    if(onboardingErrorMessage) onboardingErrorMessage.textContent = '';
}

function renderStepIndicators() {
    if (!stepIndicatorContainer) return;
    stepIndicatorContainer.innerHTML = '';
    for (let i = 0; i < onboardingSteps.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'step-indicator-dot';
        if (i === currentOnboardingStep) {
            dot.classList.add('active');
        }
        stepIndicatorContainer.appendChild(dot);
    }
}

function navigateOnboarding(nextStepIndex) {
    if (!validateOnboardingStep(currentOnboardingStep)) {
        return;
    }
    currentOnboardingStep = nextStepIndex;
    updateOnboardingStepUI();
}

function validateOnboardingStep(stepNumber) {
    if(onboardingErrorMessage) onboardingErrorMessage.textContent = '';
    let isValid = true;
    if (stepNumber === 0) {
        if (!onboardingWorkerUrlInput || !onboardingWorkerUrlInput.value.trim()) {
            if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Worker URL is required.';
            isValid = false;
        } else {
            try { new URL(onboardingWorkerUrlInput.value.trim()); }
            catch (_) { if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Invalid Worker URL format.'; isValid = false; }
        }
    } else if (stepNumber === 1) {
        if (!onboardingCalendarUrlInput || !onboardingCalendarUrlInput.value.trim()) {
            if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Compass Calendar URL is required.';
            isValid = false;
        } else {
            try { new URL(onboardingCalendarUrlInput.value.trim()); }
            catch (_) { if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Invalid Compass Calendar URL format.'; isValid = false; }
        }
    } else if (stepNumber === 2) {
        const domain = onboardingCanvasDomainInput ? onboardingCanvasDomainInput.value.trim() : '';
        const token = onboardingCanvasTokenInput ? onboardingCanvasTokenInput.value.trim() : '';
        if (domain && !token) {
            if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Canvas Token is required if Domain is provided.';
            isValid = false;
        } else if (!domain && token) {
            if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Canvas Domain is required if Token is provided.';
            isValid = false;
        } else if (domain) {
            try { new URL(domain.startsWith('http') ? domain : `https://${domain}`); }
            catch (_) { if(onboardingErrorMessage) onboardingErrorMessage.textContent = 'Invalid Canvas Domain format.'; isValid = false; }
        }
    }
    return isValid;
}

function handleFinishOnboarding() {
    if (!validateOnboardingStep(2)) return;
    saveOnboardingData();
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    if(onboardingOverlay && onboardingCard) {
        onboardingCard.classList.add('opacity-0', 'scale-95');
        onboardingOverlay.classList.add('opacity-0');
        setTimeout(() => {
            onboardingOverlay.classList.add('hidden');
            initializeMainApp();
        }, 300);
    } else {
        initializeMainApp();
    }
}

function handleSkipCanvasOnboarding() {
    if (!validateOnboardingStep(0) || !validateOnboardingStep(1)) {
        if (!validateOnboardingStep(0)) { currentOnboardingStep = 0; updateOnboardingStepUI(); validateOnboardingStep(0); }
        else if (!validateOnboardingStep(1)) { currentOnboardingStep = 1; updateOnboardingStepUI(); validateOnboardingStep(1); }
        return;
    }
    if(onboardingWorkerUrlInput) localStorage.setItem(WORKER_URL_KEY, onboardingWorkerUrlInput.value.trim());
    if(onboardingCalendarUrlInput) localStorage.setItem(CALENDAR_URL_KEY, onboardingCalendarUrlInput.value.trim());
    localStorage.removeItem(CANVAS_DOMAIN_KEY);
    localStorage.removeItem(CANVAS_TOKEN_KEY);
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    if(onboardingOverlay && onboardingCard) {
        onboardingCard.classList.add('opacity-0', 'scale-95');
        onboardingOverlay.classList.add('opacity-0');
        setTimeout(() => { onboardingOverlay.classList.add('hidden'); initializeMainApp(); }, 300);
    } else { initializeMainApp(); }
}

function saveOnboardingData() {
    if(onboardingWorkerUrlInput) localStorage.setItem(WORKER_URL_KEY, onboardingWorkerUrlInput.value.trim());
    if(onboardingCalendarUrlInput) localStorage.setItem(CALENDAR_URL_KEY, onboardingCalendarUrlInput.value.trim());
    if(onboardingCanvasDomainInput && onboardingCanvasDomainInput.value.trim()) localStorage.setItem(CANVAS_DOMAIN_KEY, onboardingCanvasDomainInput.value.trim());
    if(onboardingCanvasTokenInput && onboardingCanvasTokenInput.value.trim()) localStorage.setItem(CANVAS_TOKEN_KEY, onboardingCanvasTokenInput.value.trim());
}


// --- Live Clock ---
function startLiveClock() { if (clockIntervalId) clearInterval(clockIntervalId); updateLiveClock(); clockIntervalId = setInterval(updateLiveClock, CLOCK_UPDATE_INTERVAL); }
function updateLiveClock() { if (!liveClockDiv) return; const now = new Date(); const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); liveClockDiv.innerHTML = `<div class="text-3xl">${timeString}</div><div class="text-xs">${dateString}</div>`; }

function populatePastelColorOptions() { if (!newMappingPastelColorSelect) return; PASTEL_COLORS.forEach(color => { const option = document.createElement('option'); option.value = color.value; option.textContent = color.name; newMappingPastelColorSelect.appendChild(option); }); }
function loadSettings() {
     compassWorkerUrl = localStorage.getItem(WORKER_URL_KEY) || DEFAULT_WORKER_URL;
     if(workerUrlInput) workerUrlInput.value = compassWorkerUrl;
     classMappings = JSON.parse(localStorage.getItem(CLASS_MAPPINGS_KEY) || '{}');
     classColors = JSON.parse(localStorage.getItem(CLASS_COLORS_KEY) || '{}');
     backgroundUrl = localStorage.getItem(BACKGROUND_URL_KEY) || DEFAULT_BACKGROUND_URL;
     if(backgroundUrlInput) backgroundUrlInput.value = localStorage.getItem(BACKGROUND_URL_KEY) || '';
     canvasDomain = localStorage.getItem(CANVAS_DOMAIN_KEY) || '';
     canvasToken = localStorage.getItem(CANVAS_TOKEN_KEY) || '';
     canvasCourseMappings = JSON.parse(localStorage.getItem(CANVAS_COURSE_MAPPINGS_KEY) || '{}');
     if(canvasDomainInput) canvasDomainInput.value = canvasDomain;
     if(canvasTokenInput) canvasTokenInput.value = canvasToken;
     const savedNotificationSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY));
     if (savedNotificationSettings) { notificationSettings = { ...notificationSettings, ...savedNotificationSettings }; }
}
function saveSettings(showMsg = true, type = 'general') {
    if(workerUrlInput) localStorage.setItem(WORKER_URL_KEY, workerUrlInput.value.trim());
    if(urlInput) localStorage.setItem(CALENDAR_URL_KEY, urlInput.value.trim());
    localStorage.setItem(CLASS_MAPPINGS_KEY, JSON.stringify(classMappings));
    localStorage.setItem(CLASS_COLORS_KEY, JSON.stringify(classColors));
    if(backgroundUrlInput) localStorage.setItem(BACKGROUND_URL_KEY, backgroundUrlInput.value.trim());
    if(canvasDomainInput) localStorage.setItem(CANVAS_DOMAIN_KEY, canvasDomainInput.value.trim());
    if(canvasTokenInput) localStorage.setItem(CANVAS_TOKEN_KEY, canvasTokenInput.value.trim());
    localStorage.setItem(CANVAS_COURSE_MAPPINGS_KEY, JSON.stringify(canvasCourseMappings));
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notificationSettings));
    loadSettings(); applyBackground();
    if (showMsg) showMessage('Settings saved.', 'success', 'settings');
    if (type === 'general' && allParsedEvents.length > 0) { previousProcessedClassEvents = [...processedClassEvents]; processAndClassifyEvents(allParsedEvents); isAutoRefreshing = false; renderViews();
    } else if (type === 'canvasAuth' || type === 'canvasMap') { if (compassWorkerUrl && canvasDomain && canvasToken && typeof fetchCanvasData === 'function') { fetchCanvasData(true); }
    } else if (type === 'compass') { const currentCompassUrl = urlInput ? urlInput.value.trim() : null; if (compassWorkerUrl && currentCompassUrl) { isFirstLoad = true; startAutoRefresh(currentCompassUrl); }
    } else if (type === 'notifications') { if (notificationSettings.classesEnabled || notificationSettings.assignmentsEnabled1 || notificationSettings.assignmentsEnabled2 || notificationSettings.timetableChangesEnabled) { requestNotificationPermission(); } }
}
function applyBackground() { document.body.style.backgroundImage = `url('${backgroundUrl || DEFAULT_BACKGROUND_URL}')`; }
function handleSaveBackground() { const newUrl = backgroundUrlInput.value.trim(); localStorage.setItem(BACKGROUND_URL_KEY, newUrl); backgroundUrl = newUrl || DEFAULT_BACKGROUND_URL; applyBackground(); showMessage('Background saved.', 'success', 'settings'); }
function handleResetBackground() { if(backgroundUrlInput) backgroundUrlInput.value = ''; localStorage.removeItem(BACKGROUND_URL_KEY); backgroundUrl = DEFAULT_BACKGROUND_URL; applyBackground(); showMessage('Background reset to default.', 'success', 'settings'); }
function handleSaveCanvasSettings() { saveSettings(true, 'canvasAuth'); }

function renderMappingsList() {
    if (!mappingsListDiv) return; mappingsListDiv.innerHTML = ''; const sortedCodes = Object.keys(classMappings).sort();
    sortedCodes.forEach(code => { const name = classMappings[code]; const color = classColors[name] || '#374151'; const item = document.createElement('div'); item.className = 'mapping-item p-2 border rounded-md bg-slate-700 border-slate-600';
        item.innerHTML = `<input type="text" value="${code}" data-code="${code}" class="mapping-code bg-slate-600 w-20 text-slate-100" readonly><span>&rarr;</span><input type="text" value="${name}" data-code="${code}" class="mapping-name input-field flex-grow"><input type="color" value="${color}" data-code="${code}" data-name="${name}" class="mapping-color"><button data-action="remove" data-code="${code}" title="Remove Mapping">&times;</button>`;
        mappingsListDiv.appendChild(item); });
    mappingsListDiv.querySelectorAll('.mapping-name, .mapping-color').forEach(input => input.addEventListener('change', handleMappingEdit));
}
function handleAddMapping() {
    if (!newMappingCodeInput || !newMappingNameInput || !newMappingColorInput || !newMappingPastelColorSelect) return; const code = newMappingCodeInput.value.trim().toUpperCase(); const name = newMappingNameInput.value.trim(); let color = newMappingColorInput.value; if (newMappingPastelColorSelect.value) { color = newMappingPastelColorSelect.value; } if (!code || !name) { showMessage('Both Code and Full Name are required.', 'error', 'settings'); return; } if (classMappings[code]) { showMessage(`Code "${code}" already exists.`, 'error', 'settings'); return; } classMappings[code] = name; classColors[name] = color; newMappingCodeInput.value = ''; newMappingNameInput.value = ''; newMappingColorInput.value = '#374151'; newMappingPastelColorSelect.value = ''; renderMappingsList(); saveSettings(true, 'general');
}
function handleMappingListClick(event) { const target = event.target; const action = target.getAttribute('data-action'); const code = target.getAttribute('data-code'); if (action === 'remove' && code) { const name = classMappings[code]; delete classMappings[code]; delete classColors[name]; renderMappingsList(); saveSettings(true, 'general'); } }
function handleMappingEdit(event) { const input = event.target; const code = input.getAttribute('data-code'); const originalName = classMappings[code]; if (input.classList.contains('mapping-name')) { const newName = input.value.trim(); if (newName && newName !== originalName) { classMappings[code] = newName; if (classColors[originalName]) { classColors[newName] = classColors[originalName]; delete classColors[originalName]; } const colorInput = input.closest('.mapping-item').querySelector('.mapping-color'); if(colorInput) colorInput.setAttribute('data-name', newName); renderMappingsList(); saveSettings(true, 'general'); } else { input.value = originalName; } } else if (input.classList.contains('mapping-color')) { const name = input.getAttribute('data-name'); const newColor = input.value; if (name) { classColors[name] = newColor; saveSettings(true, 'general'); } } }
function renderCanvasCourseMappingsList() {
    if (!canvasCourseMappingsListDiv) return; canvasCourseMappingsListDiv.innerHTML = ''; const sortedCompassNames = Object.keys(canvasCourseMappings).sort();
    sortedCompassNames.forEach(compassName => { const canvasId = canvasCourseMappings[compassName]; const item = document.createElement('div'); item.className = 'mapping-item p-2 border rounded-md bg-slate-700 border-slate-600';
        item.innerHTML = `<input type="text" value="${compassName}" data-compass-name="${compassName}" class="canvas-map-compass-name bg-slate-600 text-slate-100 flex-grow" readonly><span>&rarr;</span><input type="text" value="${canvasId}" data-compass-name="${compassName}" class="canvas-map-id input-field w-32"><button data-action="remove-canvas-map" data-compass-name="${compassName}" title="Remove Mapping">&times;</button>`;
        canvasCourseMappingsListDiv.appendChild(item); });
    canvasCourseMappingsListDiv.querySelectorAll('.canvas-map-id').forEach(input => input.addEventListener('change', handleCanvasMappingEdit));
}
function handleAddCanvasCourseMapping() { if (!compassClassNameForCanvasInput || !canvasCourseIdForMappingInput) return; const compassName = compassClassNameForCanvasInput.value.trim(); const canvasId = canvasCourseIdForMappingInput.value.trim(); if (!compassName || !canvasId) { showMessage('Compass Class Name and Canvas Course ID are required.', 'error', 'settings'); return; } if (canvasCourseMappings[compassName]) { showMessage(`Mapping for "${compassName}" already exists.`, 'error', 'settings'); return; } canvasCourseMappings[compassName] = canvasId; compassClassNameForCanvasInput.value = ''; canvasCourseIdForMappingInput.value = ''; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); }
function handleCanvasMappingListClick(event) { const target = event.target; const action = target.getAttribute('data-action'); const compassName = target.getAttribute('data-compass-name'); if (action === 'remove-canvas-map' && compassName) { delete canvasCourseMappings[compassName]; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); } }
function handleCanvasMappingEdit(event) { const input = event.target; const compassName = input.getAttribute('data-compass-name'); const newCanvasId = input.value.trim(); if (compassName && newCanvasId) { canvasCourseMappings[compassName] = newCanvasId; saveSettings(true, 'canvasMap'); } else if (compassName && !newCanvasId) { delete canvasCourseMappings[compassName]; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); } }

function handleNavClick(event) { const section = event.target.getAttribute('data-section'); switchSection(section); }
function switchSection(section) {
    isAutoRefreshing = false;
    if(settingsSection) settingsSection.classList.add('hidden');
    if(calendarSection) calendarSection.classList.add('hidden');
    if(canvasSection) canvasSection.classList.add('hidden');
    if(navLinks) navLinks.forEach(link => link.classList.remove('active'));

    let activeNavLink = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeNavLink) activeNavLink.classList.add('active');

    if (section === 'settings' && settingsSection) { settingsSection.classList.remove('hidden');
    } else if (section === 'canvas' && canvasSection) {
        canvasSection.classList.remove('hidden');
        if (compassWorkerUrl && canvasDomain && canvasToken && typeof fetchCanvasData === 'function') { fetchCanvasData(); }
        else { if(typeof showMessageForCanvas === 'function') showMessageForCanvas('Please set Worker URL, Canvas Domain, and API Token in Settings.', 'info'); }
    } else if (calendarSection) { // Default to calendar
        calendarSection.classList.remove('hidden');
        if (allParsedEvents.length > 0) { renderViews(); }
        else { const savedUrl = localStorage.getItem(CALENDAR_URL_KEY); if (!savedUrl && !compassWorkerUrl) showMessage('Go to Settings to enter Worker & Compass URLs.', 'info', 'calendar'); }
    }
}
function switchViewMode(mode) {
    currentViewMode = mode;
    if(dayViewBtn) dayViewBtn.classList.toggle('active', mode === 'day');
    if(listViewBtn) listViewBtn.classList.toggle('active', mode === 'list');
    if(weekViewBtn) weekViewBtn.classList.toggle('active', mode === 'week');

    if(calendarDisplayDay) calendarDisplayDay.classList.toggle('hidden', mode !== 'day');
    if(calendarDisplayList) calendarDisplayList.classList.toggle('hidden', mode !== 'list');
    if(calendarDisplayWeek) calendarDisplayWeek.classList.toggle('hidden', mode !== 'week');

    if(listControls) listControls.classList.toggle('hidden', mode !== 'list' && mode !== 'day');
    isAutoRefreshing = false;
    renderViews();
}

function handleSaveAndLoad() {
    const workerURLValue = workerUrlInput ? workerUrlInput.value.trim() : '';
    const compassURLValue = urlInput ? urlInput.value.trim() : '';
    if (!workerURLValue) { showMessage('Cloudflare Worker URL is required.', 'error', 'settings'); return; }
    if (!compassURLValue) { showMessage('Compass Calendar Feed URL is required.', 'error', 'settings'); return; }
    try { new URL(workerURLValue); new URL(compassURLValue); }
    catch (_) { showMessage('Invalid URL format for Worker or Compass URL.', 'error', 'settings'); return; }
    saveSettings(false, 'compass');
    showMessage('Settings saved. Starting auto-refresh...', 'loading', 'settings');
}
function startAutoRefresh(compassCalUrl) {
    stopAutoRefresh();
    if (!compassWorkerUrl) { showMessage('Worker URL not set. Cannot start auto-refresh.', 'error', 'calendar'); updateStatusIndicator('failed'); return; }
    fetchAndProcessCalendar(compassCalUrl, true);
    refreshIntervalId = setInterval(() => fetchAndProcessCalendar(compassCalUrl, false), REFRESH_INTERVAL);
    initializeStatusIndicator();
}
function stopAutoRefresh() { if (refreshIntervalId) clearInterval(refreshIntervalId); if (statusUpdateIntervalId) clearInterval(statusUpdateIntervalId); refreshIntervalId = null; statusUpdateIntervalId = null; }

async function fetchAndProcessCalendar(compassCalUrl, isInitialLoadForThisCall = false) {
    if (!compassCalUrl || !compassWorkerUrl) { console.warn("Compass or Worker URL missing, skipping fetch."); return; }
    isAutoRefreshing = !isInitialLoadForThisCall;
    if (isFirstLoad && isInitialLoadForThisCall) { showMessage('Loading calendar data...', 'loading', 'calendar'); updateStatusIndicator('loading'); }
    try {
        const fetchUrl = `${compassWorkerUrl}/compass?url=${encodeURIComponent(compassCalUrl)}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` })); throw new Error(errorData.error || `Failed to fetch from worker: ${response.status} ${response.statusText}`); }
        const icsData = await response.text(); if (!icsData) throw new Error('Fetched data from worker is empty.');
        const newParsedCompassEvents = parseCalendarData(icsData);

        if (isFirstLoad && isInitialLoadForThisCall) {
            showMessage(`Successfully loaded ${newParsedCompassEvents.length} Compass events.`, 'success', 'calendar');
            isFirstLoad = false;
        }
        lastSuccessfulUpdateTime = Date.now(); updateStatusIndicator('live');

        if (!isInitialLoadForThisCall && notificationSettings.timetableChangesEnabled) {
            detectAndNotifyTimetableChanges(newParsedCompassEvents, previousProcessedClassEvents);
        }

        previousProcessedClassEvents = newParsedCompassEvents.filter(e => !e.isCanvasAssignment);
        allParsedEvents = newParsedCompassEvents;

        if (compassWorkerUrl && canvasDomain && canvasToken && typeof processCanvasAssignmentsIntoEvents === 'function') {
            await processCanvasAssignmentsIntoEvents();
        }
        processAndClassifyEvents(allParsedEvents);
        renderViews();
    } catch (error) {
        console.error('Error fetching/processing Compass data via worker:', error); showMessage(`Error fetching Compass data: ${error.message}.`, 'error', 'calendar'); updateStatusIndicator('failed');
        if (isInitialLoadForThisCall) isFirstLoad = false;
    }
}
function parseCalendarData(icsData) {
    try {
        const jcalData = ICAL.parse(icsData); const comp = new ICAL.Component(jcalData); const vevents = comp.getAllSubcomponents('vevent'); if (!vevents || vevents.length === 0) return [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return vevents.map(vevent => { const event = new ICAL.Event(vevent); const startDate = event.startDate.toJSDate(); return { id: event.uid || `${event.summary}-${startDate.toISOString()}`, summary: event.summary || 'No Title', originalSummary: event.summary || 'No Title', startDate: startDate, endDate: event.endDate.toJSDate(), location: event.location || null, description: event.description || '', teacher: extractTeacher(event.description || '') }; }).filter(event => event.startDate >= today);
    } catch (parseError) { console.error('Error parsing iCal data:', parseError); showMessage(`Error parsing calendar data: ${parseError.message}`, 'error', 'calendar'); return []; }
}

function applyMappings(originalSummary) {
    const sortedCodes = Object.keys(classMappings).sort((a, b) => b.length - a.length);
    for (const code of sortedCodes) { const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regex = new RegExp(escapedCode, 'i'); if (regex.test(originalSummary)) { return classMappings[code]; } }
    return originalSummary;
}
function getClassColor(originalSummary, mappedSummary) {
     if (originalSummary !== mappedSummary) { return classColors[mappedSummary] || 'var(--surface-1-dark)';
     } else { const sortedCodes = Object.keys(classMappings).sort((a, b) => b.length - a.length); for (const code of sortedCodes) { const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regex = new RegExp(escapedCode, 'i'); if (regex.test(originalSummary)) { return classColors[classMappings[code]] || 'var(--surface-1-dark)'; } } }
     return 'var(--surface-1-dark)';
 }
function processAndClassifyEvents(events) {
    const newProcessedClasses = []; const newProcessedSidebar = []; const prevEventMap = new Map(previousProcessedClassEvents.map(e => [e.id, e]));
    events.forEach(event => {
        const newEvent = { ...event };
        if (!newEvent.isCanvasAssignment) { newEvent.summary = applyMappings(newEvent.originalSummary); newEvent.color = getClassColor(newEvent.originalSummary, newEvent.summary); }
        const previousEvent = prevEventMap.get(newEvent.id); if (previousEvent && previousEvent.location !== newEvent.location) { newEvent.oldLocation = previousEvent.location; } else { delete newEvent.oldLocation; }
        const summaryLower = newEvent.summary.toLowerCase(); const originalSummaryLower = newEvent.originalSummary.toLowerCase();
        const containsNonClassKeyword = /\b(due|assignment|meeting|event|holiday|assembly|whole school|carnival)\b/i;
        const isLikelyClass = newEvent.location && !containsNonClassKeyword.test(summaryLower) && !containsNonClassKeyword.test(originalSummaryLower) && !newEvent.isCanvasAssignment;
        if (isLikelyClass) { newProcessedClasses.push(newEvent); } else { newProcessedSidebar.push(newEvent); }
    });
    processedClassEvents = newProcessedClasses;
    processedSidebarEvents = newProcessedSidebar.sort((a, b) => a.startDate - b.startDate);
}


function renderViews() {
    if (currentViewMode === 'list') renderListView();
    else if (currentViewMode === 'week') renderWeeklyView();
    else if (currentViewMode === 'day') renderDayView();
    if (typeof renderSidebar === "function") renderSidebar(); // Check if canvas.js defined it
    if(calendarDisplayDay) calendarDisplayDay.classList.toggle('hidden', currentViewMode !== 'day');
    if(calendarDisplayList) calendarDisplayList.classList.toggle('hidden', currentViewMode !== 'list');
    if(calendarDisplayWeek) calendarDisplayWeek.classList.toggle('hidden', currentViewMode !== 'week');
}

function renderDayView() {
    if (!calendarDisplayDay) return;
    clearDisplayAreaOnly('day');

    const today = new Date();
    const todayString = today.toDateString();

    const combinedEvents = [...processedClassEvents, ...processedSidebarEvents.filter(e => e.isCanvasAssignment && e.startDate >= new Date())];
    const todayEvents = combinedEvents.filter(event => event.startDate.toDateString() === todayString)
                                   .sort((a,b) => a.startDate - b.startDate);

    const dayHeader = document.createElement('h3');
    dayHeader.className = 'text-xl font-semibold text-slate-100 mb-4 text-center';
    dayHeader.textContent = `Today's Schedule - ${formatDateHeading(today)}`;
    calendarDisplayDay.appendChild(dayHeader);

    if (todayEvents.length === 0) {
        calendarDisplayDay.innerHTML += '<p class="text-slate-400 text-center italic">No events scheduled for today.</p>';
        return;
    }

    const now = new Date();
    todayEvents.forEach((event, eventIndex) => {
        const card = document.createElement('div');
        const isCustomColor = event.color && event.color !== 'var(--surface-1-dark)' && !event.color.startsWith('#e5e7eb') && !event.color.startsWith('#fed7d7') && !event.color.startsWith('hsl(0, 50%, 30%)');
        card.className = `event-card p-4 rounded-lg border shadow-lg mb-3 ${event.isCanvasAssignment ? 'canvas-assignment-event' : ''}`;
        card.style.backgroundColor = event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--surface-1-dark)');
        card.style.borderColor = darkenColor(event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--border-dark)'), 15);
        if (!isAutoRefreshing) { card.classList.add('fade-in'); card.style.animationDelay = `${eventIndex * 0.05}s`; }
        else { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }

        const startTime = formatTime(event.startDate);
        const endTime = formatTime(event.endDate);
        const textColorClass = isCustomColor && !event.isCanvasAssignment ? 'text-on-color' : 'text-slate-100';
        const iconColorClass = isCustomColor && !event.isCanvasAssignment ? 'icon-on-color' : 'text-slate-400';

        const clockIcon = ICONS.clock.replace('text-slate-400', iconColorClass);
        const locationIcon = ICONS.location.replace('text-slate-400', iconColorClass);
        const teacherIcon = ICONS.teacher.replace('text-slate-400', iconColorClass);
        const assignmentIcon = ICONS.assignment.replace('text-slate-400', iconColorClass);

        let summaryHtml = event.summary;
        const canvasCourseId = canvasCourseMappings[event.summary]; // Use mapped summary for lookup
        if (!event.isCanvasAssignment && canvasCourseId && canvasDomain) {
            summaryHtml = `<span class="clickable-class-link hover:text-indigo-400 cursor-pointer" data-canvas-course-id="${canvasCourseId}">${event.summary}${ICONS.link}</span>`;
            card.addEventListener('click', (e) => {
                if (e.target.closest('span[data-canvas-course-id]')) {
                    if (typeof showCanvasDetailModal === "function") showCanvasDetailModal(canvasCourseId);
                } else if (e.target.closest('a')) { return; }
            });
        } else if (event.isCanvasAssignment && event.html_url) {
            summaryHtml = `<a href="${event.html_url}" target="_blank" class="clickable-class-link hover:text-red-400">${event.summary}${ICONS.link}</a>`;
        }


        let timeIndicatorHtml = '';
        if (now >= event.startDate && now <= event.endDate && !event.isCanvasAssignment) {
            timeIndicatorHtml = `<span class="time-indicator time-indicator-now">NOW</span>`;
        } else if (event.startDate > now && !event.isCanvasAssignment) {
            const diffMins = Math.round((event.startDate.getTime() - now.getTime()) / 60000);
            if (diffMins > 0) { timeIndicatorHtml = `<span class="time-indicator time-indicator-upcoming">In ${diffMins} min${diffMins > 1 ? 's' : ''}</span>`; }
        }

        let locationHtml = ''; if (event.oldLocation) { locationHtml += `<span class="text-red-500 line-through mr-1 opacity-80">${event.oldLocation}</span>`; } locationHtml += (event.location || 'N/A');
        card.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h4 class="text-lg font-semibold ${textColorClass} flex-grow pr-2">${summaryHtml} ${timeIndicatorHtml}</h4>
                <span class="text-sm font-medium ${textColorClass} mt-1 whitespace-nowrap">${event.isCanvasAssignment ? assignmentIcon : clockIcon} ${startTime}${event.isCanvasAssignment ? '' : ' - ' + endTime}</span>
            </div>
            <div class="text-sm ${textColorClass} space-y-1 opacity-90">
                <p>${locationIcon} <span class="font-medium">${event.isCanvasAssignment ? 'Course' : 'Room'}:</span> ${locationHtml}</p>
                ${event.teacher && !event.isCanvasAssignment ? `<p>${teacherIcon} <span class="font-medium">Teacher:</span> ${event.teacher}</p>` : ''}
                 ${event.isCanvasAssignment && event.description && event.description !== event.html_url ? `<p class="mt-1 text-xs">${event.description.substring(0,100)}...</p>` : ''}
            </div>`;
        calendarDisplayDay.appendChild(card);
    });
}


function renderListView() {
    if (!calendarDisplayList) return;
    clearDisplayAreaOnly('list');
    const combinedEvents = [...processedClassEvents, ...processedSidebarEvents.filter(e => e.isCanvasAssignment && e.startDate >= new Date())];
    const eventsToDisplay = filterAndSortEvents(combinedEvents);
    const eventsByDay = groupEventsByDay(eventsToDisplay);
    const sortedDays = Object.keys(eventsByDay).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDays.length === 0 && !isFirstLoad) { if (combinedEvents.length > 0 && currentSearchTerm) { showMessage(`No items found matching "${currentSearchTerm}".`, 'info', 'calendar'); } else if (combinedEvents.length === 0 && allParsedEvents.length > 0) { showMessage('No upcoming classes or assignments.', 'info', 'calendar'); } else if (allParsedEvents.length === 0) { if (!localStorage.getItem(CALENDAR_URL_KEY)) { showMessage('Go to Settings to enter your calendar URL.', 'info', 'calendar'); } else if (!calendarMessageArea.textContent.includes('Failed')) { showMessage('No upcoming events found.', 'info', 'calendar');}} return; }

    const now = new Date();
    sortedDays.forEach((dayString, dayIndex) => {
        const dayEvents = eventsByDay[dayString]; const dayDate = new Date(dayString); const dayHeader = document.createElement('h3'); dayHeader.className = 'text-lg font-semibold text-slate-200 mt-5 mb-2 border-b border-slate-700 pb-1'; if (!isAutoRefreshing) { dayHeader.classList.add('fade-in'); dayHeader.style.animationDelay = `${dayIndex * 0.05}s`; } dayHeader.textContent = formatDateHeading(dayDate); calendarDisplayList.appendChild(dayHeader);
        dayEvents.forEach((event, eventIndex) => {
            const card = document.createElement('div');
            const isCustomColor = event.color && event.color !== 'var(--surface-1-dark)' && !event.color.startsWith('#e5e7eb') && !event.color.startsWith('#fed7d7') && !event.color.startsWith('hsl(0, 50%, 30%)');
            card.className = `event-card p-3 rounded-lg border shadow-sm ${event.isCanvasAssignment ? 'canvas-assignment-event' : ''}`;
            card.style.backgroundColor = event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--surface-1-dark)');
            card.style.borderColor = darkenColor(event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--border-dark)'), 15);
            if (!isAutoRefreshing) { card.classList.add('fade-in'); card.style.animationDelay = `${(dayIndex * 50) + (eventIndex * 30) + 50}ms`; } else { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }

            const startTime = formatTime(event.startDate); const endTime = formatTime(event.endDate);
            const textColorClass = isCustomColor && !event.isCanvasAssignment ? 'text-on-color' : 'text-slate-100';
            const iconColorClass = isCustomColor && !event.isCanvasAssignment ? 'icon-on-color' : 'text-slate-400';

            const clockIcon = ICONS.clock.replace('text-slate-400', iconColorClass);
            const locationIcon = ICONS.location.replace('text-slate-400', iconColorClass);
            const teacherIcon = ICONS.teacher.replace('text-slate-400', iconColorClass);
            const assignmentIcon = ICONS.assignment.replace('text-slate-400', iconColorClass);

            let summaryHtml = event.summary;
            const canvasCourseId = canvasCourseMappings[event.summary];
            if (!event.isCanvasAssignment && canvasCourseId && canvasDomain) {
                summaryHtml = `<span class="clickable-class-link hover:text-indigo-400 cursor-pointer" data-canvas-course-id="${canvasCourseId}">${event.summary}${ICONS.link}</span>`;
                 card.addEventListener('click', (e) => {
                    if (e.target.closest('span[data-canvas-course-id]')) {
                        if (typeof showCanvasDetailModal === "function") showCanvasDetailModal(canvasCourseId);
                    } else if (e.target.closest('a')) { return; }
                });
            } else if (event.isCanvasAssignment && event.html_url) {
                summaryHtml = `<a href="${event.html_url}" target="_blank" class="clickable-class-link hover:text-red-400">${event.summary}${ICONS.link}</a>`;
            }

            let timeIndicatorHtml = '';
            if (now >= event.startDate && now <= event.endDate && !event.isCanvasAssignment) {
                timeIndicatorHtml = `<span class="time-indicator time-indicator-now">NOW</span>`;
            } else if (event.startDate > now && event.startDate.toDateString() === now.toDateString() && !event.isCanvasAssignment) {
                const diffMins = Math.round((event.startDate.getTime() - now.getTime()) / 60000);
                if (diffMins > 0 && diffMins <= 240) {
                     timeIndicatorHtml = `<span class="time-indicator time-indicator-upcoming">In ${diffMins} min${diffMins > 1 ? 's' : ''}</span>`;
                }
            }

            let locationHtml = ''; if (event.oldLocation) { locationHtml += `<span class="text-red-500 line-through mr-1 opacity-80">${event.oldLocation}</span>`; } locationHtml += (event.location || 'N/A');
            card.innerHTML = `<div class="flex flex-col sm:flex-row justify-between sm:items-start mb-1"><h4 class="text-md font-semibold ${textColorClass} flex-grow pr-2">${summaryHtml} ${timeIndicatorHtml}</h4><span class="text-xs font-medium ${textColorClass} mt-1 sm:mt-0 whitespace-nowrap">${event.isCanvasAssignment ? assignmentIcon : clockIcon} ${startTime}${event.isCanvasAssignment ? '' : ' - ' + endTime}</span></div><div class="text-xs ${textColorClass} space-y-1 opacity-90"><p>${locationIcon} <span class="font-medium">${event.isCanvasAssignment ? 'Course' : 'Room'}:</span> ${locationHtml}</p>${event.teacher && !event.isCanvasAssignment ? `<p>${teacherIcon} <span class="font-medium">Teacher:</span> ${event.teacher}</p>` : ''}</div>`;
            calendarDisplayList.appendChild(card);
        });
    });
}
function renderWeeklyView() {
    if (!weeklyViewGrid) return;
    clearDisplayAreaOnly('week'); weeklyViewGrid.innerHTML = ''; const hourStart = 8; const hourEnd = 16; const slotHeight = 60;
    for (let h = hourStart; h < hourEnd; h++) { const timeDiv = document.createElement('div'); timeDiv.className = 'time-slot'; timeDiv.textContent = formatTime(new Date(0,0,0, h, 0)); timeDiv.style.gridRow = `${h - hourStart + 1} / span 1`; weeklyViewGrid.appendChild(timeDiv); for(let dayIndex=0; dayIndex < 5; dayIndex++) { const cell = document.createElement('div'); cell.className = 'day-column-bg'; cell.style.gridRow = `${h - hourStart + 1} / span 1`; cell.style.gridColumn = `${dayIndex + 2} / span 1`; weeklyViewGrid.appendChild(cell); } }
    const dayContentContainers = []; for(let dayIndex=0; dayIndex < 5; dayIndex++) { const container = document.createElement('div'); container.className = 'day-column-content'; container.setAttribute('data-day-index', dayIndex.toString()); weeklyViewGrid.appendChild(container); dayContentContainers.push(container); }
    const today = new Date(); const currentDayOfWeek = (today.getDay() + 6) % 7; const monday = new Date(today); monday.setDate(today.getDate() - currentDayOfWeek); monday.setHours(0, 0, 0, 0); const friday = new Date(monday); friday.setDate(monday.getDate() + 4); friday.setHours(23, 59, 59, 999);

    const combinedEventsForWeek = [...processedClassEvents, ...processedSidebarEvents.filter(e => e.isCanvasAssignment && e.startDate >= new Date())]
        .filter(event => event.startDate >= monday && event.startDate <= friday);

    const nowTime = new Date().getTime();
    combinedEventsForWeek.forEach((event, eventIndex) => {
        const eventDayIndex = (event.startDate.getDay() + 6) % 7;
        if (eventDayIndex >= 0 && eventDayIndex < 5) {
            const startHour = event.startDate.getHours(); const startMinutes = event.startDate.getMinutes(); const endHour = event.endDate.getHours(); const endMinutes = event.endDate.getMinutes();
            const startOffsetMinutes = Math.max(0, (startHour - hourStart) * 60 + startMinutes); const topPx = (startOffsetMinutes / 60) * slotHeight;
            const eventStartMillis = Math.max(event.startDate.getTime(), new Date(event.startDate).setHours(hourStart, 0, 0, 0)); const eventEndMillis = Math.min(event.endDate.getTime(), new Date(event.startDate).setHours(hourEnd, 0, 0, 0));
            const durationMinutes = Math.max(15, (eventEndMillis - eventStartMillis) / (1000 * 60)); const heightPx = (durationMinutes / 60) * slotHeight;
            if (eventEndMillis > new Date(event.startDate).setHours(hourStart, 0, 0, 0) && eventStartMillis < new Date(event.startDate).setHours(hourEnd, 0, 0, 0)) {
                const eventDiv = document.createElement('div');
                let isClickable = false; let linkUrl = ''; let isCanvasCourseLink = false; let courseIdForModal = null;

                if (event.isCanvasAssignment && event.html_url) { isClickable = true; linkUrl = event.html_url;
                } else if (!event.isCanvasAssignment && canvasCourseMappings[event.summary] && canvasDomain) {
                    isClickable = true; isCanvasCourseLink = true; courseIdForModal = canvasCourseMappings[event.summary];
                    linkUrl = `https://${canvasDomain}/courses/${courseIdForModal}`;
                }

                const isCustomColor = event.color && event.color !== 'var(--surface-1-dark)' && !event.color.startsWith('#e5e7eb') && !event.color.startsWith('#fed7d7') && !event.color.startsWith('hsl(0, 50%, 30%)');
                eventDiv.className = `week-event ${event.isCanvasAssignment ? 'canvas-assignment-event' : ''} ${isClickable ? 'clickable-week-event' : ''}`;
                eventDiv.style.top = `${topPx}px`; eventDiv.style.height = `${heightPx}px`;
                eventDiv.style.backgroundColor = event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--surface-1-dark)');
                eventDiv.style.borderColor = darkenColor(event.color || (event.isCanvasAssignment ? 'hsl(0, 50%, 30%)' : 'var(--border-dark)'), 15);
                const textColorClass = isCustomColor && !event.isCanvasAssignment ? 'text-on-color' : 'text-slate-100';

                if (!isAutoRefreshing) { eventDiv.classList.add('fade-in'); eventDiv.style.animationDelay = `${eventIndex * 0.03}s`; } else { eventDiv.style.opacity = '1'; eventDiv.style.transform = 'translateY(0)'; }

                let locationHtml = ''; if (event.oldLocation) { locationHtml += `<span class="text-red-500 line-through mr-1 opacity-80">${event.oldLocation}</span>`; } locationHtml += (event.location || '');
                let summaryText = event.summary;
                if(isClickable) summaryText += ` ${ICONS.link.replace('text-indigo-400', textColorClass === 'text-on-color' ? 'text-black' : 'text-indigo-400')}`;

                let timeIndicatorHtml = '';
                if (nowTime >= event.startDate.getTime() && nowTime <= event.endDate.getTime() && !event.isCanvasAssignment) {
                    timeIndicatorHtml = `<span class="time-indicator time-indicator-now !text-xs !px-1 !py-0.5">NOW</span>`;
                } else if (event.startDate.getTime() > nowTime && event.startDate.toDateString() === new Date(nowTime).toDateString() && !event.isCanvasAssignment) {
                    const diffMins = Math.round((event.startDate.getTime() - nowTime) / 60000);
                    if (diffMins > 0 && diffMins <= 240) {
                         timeIndicatorHtml = `<span class="time-indicator time-indicator-upcoming !text-xs !px-1 !py-0.5">In ${diffMins}m</span>`;
                    }
                }

                eventDiv.innerHTML = `<strong class="${textColorClass}">${summaryText} ${timeIndicatorHtml}</strong><br><span class="text-xs ${textColorClass} opacity-80">${locationHtml}</span>`;
                eventDiv.title = `${event.summary}\n${formatTime(event.startDate)} - ${formatTime(event.endDate)}\nRoom: ${event.location || 'N/A'}${event.teacher ? '\nTeacher: ' + event.teacher : ''}`;
                if (isClickable) {
                    if (isCanvasCourseLink) { eventDiv.onclick = () => { if (typeof showCanvasDetailModal === "function") showCanvasDetailModal(courseIdForModal); }; }
                    else { eventDiv.onclick = () => window.open(linkUrl, '_blank'); }
                }
                const targetContainer = dayContentContainers[eventDayIndex]; if (targetContainer) { targetContainer.appendChild(eventDiv); }
            }
        }
    });
}
function renderSidebar() { /* ... same as before ... */ }

function handleSearch(event) { currentSearchTerm = event.target.value.toLowerCase(); renderViews(); }
function handleSort(event) { currentSortOrder = event.target.value; renderViews(); }
function filterAndSortEvents(events) { /* ... same as before ... */ }
function groupEventsByDay(events) { /* ... same as before ... */ }

function initializeStatusIndicator() { /* ... same as before ... */ }
function updateStatusIndicator(status) { /* ... same as before ... */ }
function updateAgoText() { /* ... same as before ... */ }
function getAgoText() { /* ... same as before ... */ }

function clearDisplay() { if(calendarDisplayList) calendarDisplayList.innerHTML = ''; if(weeklyViewGrid) weeklyViewGrid.innerHTML = ''; if(sidebarEventsDiv) sidebarEventsDiv.innerHTML = ''; if(typeof clearCanvasDisplay === "function") clearCanvasDisplay(); if(calendarDisplayDay) calendarDisplayDay.innerHTML = '';} // Added clear for day view and canvas
function clearDisplayAreaOnly(view = 'list') {
    if (view === 'list' && calendarDisplayList) calendarDisplayList.innerHTML = '';
    else if (view === 'week' && weeklyViewGrid) weeklyViewGrid.innerHTML = '';
    else if (view === 'day' && calendarDisplayDay) calendarDisplayDay.innerHTML = '';
    else if (view === 'canvas' && typeof clearCanvasDisplay === "function") clearCanvasDisplay(); // Call function in canvas.js
}
function showMessage(msg, type = 'info', location = 'calendar') { /* ... same as before ... */ }
function formatTime(date) { /* ... same as before ... */ }
function formatDateHeading(date) { /* ... same as before ... */ }
function extractTeacher(description) { /* ... same as before ... */ }
function isColorDark(hexColor) { /* ... same as before ... */ }
function darkenColor(hexColor, percent) { /* ... same as before ... */ }

// --- Notification Functions ---
function renderNotificationSettings() { /* ... same as before ... */ }
function handleSaveNotificationSettings() { /* ... same as before ... */ }
function setupNotificationPermission() { /* ... same as before ... */ }
function requestNotificationPermission() { /* ... same as before ... */ }
function updateNotificationPermissionStatus() { /* ... same as before ... */ }
function sendBrowserNotification(title, body, tag = null) { /* ... same as before ... */ }
function detectAndNotifyTimetableChanges(newEvents, oldCompassEvents) { /* ... same as before ... */ }
function checkAndSendNotifications() { /* ... same as before ... */ }
function startNotificationChecker() { /* ... same as before ... */ }
