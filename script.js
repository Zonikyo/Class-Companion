// --- Constants & DOM Elements ---
const CALENDAR_URL_KEY = 'compassCalendarUrl';
const WORKER_URL_KEY = 'compassWorkerUrl';
const CLASS_MAPPINGS_KEY = 'compassClassMappings';
const CLASS_COLORS_KEY = 'compassClassColors';
const BACKGROUND_URL_KEY = 'compassBackgroundUrl';
const CANVAS_DOMAIN_KEY = 'canvasDomain';
const CANVAS_TOKEN_KEY = 'canvasToken';
const CANVAS_COURSE_MAPPINGS_KEY = 'canvasCourseMappings';
const NOTIFICATION_SETTINGS_KEY = 'classCompanionNotificationSettings';

const DEFAULT_WORKER_URL = 'https://class-companion.thebestmate100.workers.dev';
const DEFAULT_BACKGROUND_URL = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.motionbolt.com%2Fwp-content%2Fuploads%2F2021%2F12%2FBackground_2.jpg&f=1&nofb=1&ipt=fb1e82a0f77bb090f3f284f3dee0d6b334a89a1437206a52786427eff0f2c650';
const REFRESH_INTERVAL = 10000; // 10 seconds
const STATUS_UPDATE_INTERVAL = 1000; // 1 second for 'ago' text
const NOTIFICATION_CHECK_INTERVAL = 30000; // Check for notifications every 30 seconds

const PASTEL_COLORS = [
    { name: 'Mint', value: '#a2d2ff' }, { name: 'Lavender', value: '#bde0fe' },
    { name: 'Peach', value: '#ffafcc' }, { name: 'Sky Blue', value: '#cdb4db' },
    { name: 'Baby Pink', value: '#ffc8dd' }, { name: 'Periwinkle', value: '#a0c4ff' },
    { name: 'Light Yellow', value: '#fff1a0' }, { name: 'Seafoam', value: '#99d98c' },
    { name: 'Coral', value: '#ffb3a7' }, { name: 'Lilac', value: '#dcb0ff' }
];


const workerUrlInput = document.getElementById('workerUrl');
const urlInput = document.getElementById('calendarUrl');
const loadButton = document.getElementById('loadCalendarBtn');
const calendarDisplayList = document.getElementById('calendarDisplayList');
const calendarDisplayWeek = document.getElementById('calendarDisplayWeek');
const weeklyViewGrid = document.getElementById('weeklyViewGrid');
const calendarMessageArea = document.getElementById('calendarMessageArea');

const settingsMessageArea = document.getElementById('settingsMessageArea');
const searchBox = document.getElementById('searchBox');
const sortOrderSelect = document.getElementById('sortOrder');
const navLinks = document.querySelectorAll('.nav-link');
const settingsSection = document.getElementById('settingsSection');
const calendarSection = document.getElementById('calendarSection');
const canvasSection = document.getElementById('canvasSection');
const listControls = document.getElementById('listControls');
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
const canvasDataMessageArea = document.getElementById('canvasDataMessageArea');
const canvasCoursesDisplay = document.getElementById('canvasCoursesDisplay');
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
let canvasDomain = '';
let canvasToken = '';
let canvasCourseMappings = {};
let fetchedCanvasCourses = [];
let notificationSettings = {
    classesEnabled: false, classesLeadTime: 5,
    assignmentsEnabled1: false, assignmentsLeadTime1: 60,
    assignmentsEnabled2: false, assignmentsLeadTime2: 5,
    timetableChangesEnabled: false
};
let notificationPermission = Notification.permission;
let sentNotifications = new Set();
let notificationCheckIntervalId = null;

let messageTimeout = null;
let refreshIntervalId = null;
let statusUpdateIntervalId = null;
let isFirstLoad = true;
let isAutoRefreshing = false;
let lastSuccessfulUpdateTime = null;
let currentStatus = 'idle';

const ICONS = {
     clock: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
     location: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
     teacher: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
     event: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
     assignment: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline-block text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`,
     cloudError: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>`,
     link: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block ml-1 text-blue-500 hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>`
};

loadButton.addEventListener('click', handleSaveAndLoad);
searchBox.addEventListener('input', handleSearch);
sortOrderSelect.addEventListener('change', handleSort);
navLinks.forEach(link => link.addEventListener('click', handleNavClick));
listViewBtn.addEventListener('click', () => switchViewMode('list'));
weekViewBtn.addEventListener('click', () => switchViewMode('week'));
addMappingBtn.addEventListener('click', handleAddMapping);
mappingsListDiv.addEventListener('click', handleMappingListClick);
saveBackgroundBtn.addEventListener('click', handleSaveBackground);
resetBackgroundBtn.addEventListener('click', handleResetBackground);
saveCanvasSettingsBtn.addEventListener('click', handleSaveCanvasSettings);
addCanvasCourseMappingBtn.addEventListener('click', handleAddCanvasCourseMapping);
canvasCourseMappingsListDiv.addEventListener('click', handleCanvasMappingListClick);
newMappingPastelColorSelect.addEventListener('change', () => { if (newMappingPastelColorSelect.value) { newMappingColorInput.value = newMappingPastelColorSelect.value; }});
saveNotificationSettingsBtn.addEventListener('click', handleSaveNotificationSettings);
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    populatePastelColorOptions();
    loadSettings();
    applyBackground();
    renderMappingsList();
    renderCanvasCourseMappingsList();
    renderNotificationSettings();
    initializeStatusIndicator();
    setupNotificationPermission();
    startNotificationChecker();

    const savedCompassUrl = localStorage.getItem(CALENDAR_URL_KEY);
    if (compassWorkerUrl && savedCompassUrl) { urlInput.value = savedCompassUrl; startAutoRefresh(savedCompassUrl);
    } else if (!compassWorkerUrl) { showMessage('Please set your Cloudflare Worker URL in Settings.', 'error', 'settings'); updateStatusIndicator('idle');
    } else if (!savedCompassUrl) { showMessage('Go to Settings to enter your Compass calendar URL.', 'info', 'calendar'); updateStatusIndicator('idle'); }
    switchSection('calendar'); switchViewMode(currentViewMode);
}

function populatePastelColorOptions() { PASTEL_COLORS.forEach(color => { const option = document.createElement('option'); option.value = color.value; option.textContent = color.name; option.style.backgroundColor = color.value; newMappingPastelColorSelect.appendChild(option); }); }

function loadSettings() {
     compassWorkerUrl = localStorage.getItem(WORKER_URL_KEY) || DEFAULT_WORKER_URL;
     workerUrlInput.value = compassWorkerUrl;
     classMappings = JSON.parse(localStorage.getItem(CLASS_MAPPINGS_KEY) || '{}');
     classColors = JSON.parse(localStorage.getItem(CLASS_COLORS_KEY) || '{}');
     backgroundUrl = localStorage.getItem(BACKGROUND_URL_KEY) || DEFAULT_BACKGROUND_URL;
     backgroundUrlInput.value = localStorage.getItem(BACKGROUND_URL_KEY) || '';
     canvasDomain = localStorage.getItem(CANVAS_DOMAIN_KEY) || '';
     canvasToken = localStorage.getItem(CANVAS_TOKEN_KEY) || '';
     canvasCourseMappings = JSON.parse(localStorage.getItem(CANVAS_COURSE_MAPPINGS_KEY) || '{}');
     canvasDomainInput.value = canvasDomain;
     canvasTokenInput.value = canvasToken;
     const savedNotificationSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY));
     if (savedNotificationSettings) {
        notificationSettings = { ...notificationSettings, ...savedNotificationSettings };
     }
}

function saveSettings(showMsg = true, type = 'general') {
    localStorage.setItem(WORKER_URL_KEY, workerUrlInput.value.trim());
    localStorage.setItem(CALENDAR_URL_KEY, urlInput.value.trim());
    localStorage.setItem(CLASS_MAPPINGS_KEY, JSON.stringify(classMappings));
    localStorage.setItem(CLASS_COLORS_KEY, JSON.stringify(classColors));
    localStorage.setItem(BACKGROUND_URL_KEY, backgroundUrlInput.value.trim());
    localStorage.setItem(CANVAS_DOMAIN_KEY, canvasDomainInput.value.trim());
    localStorage.setItem(CANVAS_TOKEN_KEY, canvasTokenInput.value.trim());
    localStorage.setItem(CANVAS_COURSE_MAPPINGS_KEY, JSON.stringify(canvasCourseMappings));
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notificationSettings));

    loadSettings();
    applyBackground();

    if (showMsg) showMessage('Settings saved.', 'success', 'settings');

    if (type === 'general' && allParsedEvents.length > 0) {
        previousProcessedClassEvents = [...processedClassEvents];
        processAndClassifyEvents(allParsedEvents);
        isAutoRefreshing = false;
        renderViews();
    } else if (type === 'canvasAuth' || type === 'canvasMap') {
        if (compassWorkerUrl && canvasDomain && canvasToken) {
            fetchCanvasData();
        }
    } else if (type === 'compass') {
        const currentCompassUrl = urlInput.value.trim();
        if (compassWorkerUrl && currentCompassUrl) {
            isFirstLoad = true;
            startAutoRefresh(currentCompassUrl);
        }
    } else if (type === 'notifications') {
        if (notificationSettings.classesEnabled || notificationSettings.assignmentsEnabled1 || notificationSettings.assignmentsEnabled2 || notificationSettings.timetableChangesEnabled) {
            requestNotificationPermission();
        }
    }
}
function applyBackground() { document.body.style.backgroundImage = `url('${backgroundUrl || DEFAULT_BACKGROUND_URL}')`; }
function handleSaveBackground() { const newUrl = backgroundUrlInput.value.trim(); localStorage.setItem(BACKGROUND_URL_KEY, newUrl); backgroundUrl = newUrl || DEFAULT_BACKGROUND_URL; applyBackground(); showMessage('Background saved.', 'success', 'settings'); }
function handleResetBackground() { backgroundUrlInput.value = ''; localStorage.removeItem(BACKGROUND_URL_KEY); backgroundUrl = DEFAULT_BACKGROUND_URL; applyBackground(); showMessage('Background reset to default.', 'success', 'settings'); }
function handleSaveCanvasSettings() {
    saveSettings(true, 'canvasAuth');
    if (compassWorkerUrl && canvasDomainInput.value.trim() && canvasTokenInput.value.trim()) {
         fetchCanvasData();
    } else {
        showMessage('Worker URL, Canvas Domain and Token are required to fetch data.', 'error', 'settings');
    }
 }

function renderMappingsList() {
    mappingsListDiv.innerHTML = ''; const sortedCodes = Object.keys(classMappings).sort();
    sortedCodes.forEach(code => { const name = classMappings[code]; const color = classColors[name] || '#e5e7eb'; const item = document.createElement('div'); item.className = 'mapping-item p-2 border rounded-md bg-gray-50';
        item.innerHTML = `<input type="text" value="${code}" data-code="${code}" class="mapping-code bg-gray-200 w-20" readonly><span>&rarr;</span><input type="text" value="${name}" data-code="${code}" class="mapping-name flex-grow"><input type="color" value="${color}" data-code="${code}" data-name="${name}" class="mapping-color"><button data-action="remove" data-code="${code}" title="Remove Mapping">&times;</button>`;
        mappingsListDiv.appendChild(item); });
    mappingsListDiv.querySelectorAll('.mapping-name, .mapping-color').forEach(input => input.addEventListener('change', handleMappingEdit));
}
function handleAddMapping() {
    const code = newMappingCodeInput.value.trim().toUpperCase();
    const name = newMappingNameInput.value.trim();
    let color = newMappingColorInput.value;
    if (newMappingPastelColorSelect.value) { color = newMappingPastelColorSelect.value; }
    if (!code || !name) { showMessage('Both Code and Full Name are required.', 'error', 'settings'); return; }
    if (classMappings[code]) { showMessage(`Code "${code}" already exists.`, 'error', 'settings'); return; }
    classMappings[code] = name; classColors[name] = color;
    newMappingCodeInput.value = ''; newMappingNameInput.value = ''; newMappingColorInput.value = '#e5e7eb'; newMappingPastelColorSelect.value = '';
    renderMappingsList(); saveSettings(true, 'general');
}
function handleMappingListClick(event) { const target = event.target; const action = target.getAttribute('data-action'); const code = target.getAttribute('data-code'); if (action === 'remove' && code) { const name = classMappings[code]; delete classMappings[code]; delete classColors[name]; renderMappingsList(); saveSettings(true, 'general'); } }
function handleMappingEdit(event) { const input = event.target; const code = input.getAttribute('data-code'); const originalName = classMappings[code]; if (input.classList.contains('mapping-name')) { const newName = input.value.trim(); if (newName && newName !== originalName) { classMappings[code] = newName; if (classColors[originalName]) { classColors[newName] = classColors[originalName]; delete classColors[originalName]; } const colorInput = input.closest('.mapping-item').querySelector('.mapping-color'); if(colorInput) colorInput.setAttribute('data-name', newName); renderMappingsList(); saveSettings(true, 'general'); } else { input.value = originalName; } } else if (input.classList.contains('mapping-color')) { const name = input.getAttribute('data-name'); const newColor = input.value; if (name) { classColors[name] = newColor; saveSettings(true, 'general'); } } }
function renderCanvasCourseMappingsList() {
    canvasCourseMappingsListDiv.innerHTML = ''; const sortedCompassNames = Object.keys(canvasCourseMappings).sort();
    sortedCompassNames.forEach(compassName => { const canvasId = canvasCourseMappings[compassName]; const item = document.createElement('div'); item.className = 'mapping-item p-2 border rounded-md bg-gray-50';
        item.innerHTML = `<input type="text" value="${compassName}" data-compass-name="${compassName}" class="canvas-map-compass-name bg-gray-200 flex-grow" readonly><span>&rarr;</span><input type="text" value="${canvasId}" data-compass-name="${compassName}" class="canvas-map-id w-32"><button data-action="remove-canvas-map" data-compass-name="${compassName}" title="Remove Mapping">&times;</button>`;
        canvasCourseMappingsListDiv.appendChild(item); });
    canvasCourseMappingsListDiv.querySelectorAll('.canvas-map-id').forEach(input => input.addEventListener('change', handleCanvasMappingEdit));
}
function handleAddCanvasCourseMapping() { const compassName = compassClassNameForCanvasInput.value.trim(); const canvasId = canvasCourseIdForMappingInput.value.trim(); if (!compassName || !canvasId) { showMessage('Compass Class Name and Canvas Course ID are required.', 'error', 'settings'); return; } if (canvasCourseMappings[compassName]) { showMessage(`Mapping for "${compassName}" already exists.`, 'error', 'settings'); return; } canvasCourseMappings[compassName] = canvasId; compassClassNameForCanvasInput.value = ''; canvasCourseIdForMappingInput.value = ''; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); }
function handleCanvasMappingListClick(event) { const target = event.target; const action = target.getAttribute('data-action'); const compassName = target.getAttribute('data-compass-name'); if (action === 'remove-canvas-map' && compassName) { delete canvasCourseMappings[compassName]; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); } }
function handleCanvasMappingEdit(event) { const input = event.target; const compassName = input.getAttribute('data-compass-name'); const newCanvasId = input.value.trim(); if (compassName && newCanvasId) { canvasCourseMappings[compassName] = newCanvasId; saveSettings(true, 'canvasMap'); } else if (compassName && !newCanvasId) { delete canvasCourseMappings[compassName]; renderCanvasCourseMappingsList(); saveSettings(true, 'canvasMap'); } }

function handleNavClick(event) { const section = event.target.getAttribute('data-section'); switchSection(section); }
function switchSection(section) {
    isAutoRefreshing = false; settingsSection.classList.add('hidden'); calendarSection.classList.add('hidden'); canvasSection.classList.add('hidden'); navLinks.forEach(link => link.classList.remove('active'));
    let activeNavLink = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeNavLink) activeNavLink.classList.add('active');

    if (section === 'settings') { settingsSection.classList.remove('hidden');
    } else if (section === 'canvas') {
        canvasSection.classList.remove('hidden');
        if (compassWorkerUrl && canvasDomain && canvasToken) { fetchCanvasData(); }
        else { showMessageForCanvas('Please set Worker URL, Canvas Domain, and API Token in Settings.', 'info'); }
    } else {
        calendarSection.classList.remove('hidden');
        if (allParsedEvents.length > 0) { renderViews(); }
        else { const savedUrl = localStorage.getItem(CALENDAR_URL_KEY); if (!savedUrl && !compassWorkerUrl) showMessage('Go to Settings to enter Worker & Compass URLs.', 'info', 'calendar'); }
    }
}
function switchViewMode(mode) { currentViewMode = mode; listViewBtn.classList.toggle('active', mode === 'list'); weekViewBtn.classList.toggle('active', mode === 'week'); calendarDisplayList.classList.toggle('hidden', mode !== 'list'); calendarDisplayWeek.classList.toggle('hidden', mode !== 'week'); listControls.classList.toggle('hidden', mode !== 'list'); isAutoRefreshing = false; renderViews(); }

function handleSaveAndLoad() {
    const workerURLValue = workerUrlInput.value.trim();
    const compassURLValue = urlInput.value.trim();
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

        previousProcessedClassEvents = newParsedCompassEvents.filter(e => !e.isCanvasAssignment); // Store only Compass events
        allParsedEvents = newParsedCompassEvents;

        if (compassWorkerUrl && canvasDomain && canvasToken) {
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
     if (originalSummary !== mappedSummary) { return classColors[mappedSummary] || '#e5e7eb';
     } else { const sortedCodes = Object.keys(classMappings).sort((a, b) => b.length - a.length); for (const code of sortedCodes) { const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regex = new RegExp(escapedCode, 'i'); if (regex.test(originalSummary)) { return classColors[classMappings[code]] || '#e5e7eb'; } } }
     return '#e5e7eb';
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


function renderViews() { if (currentViewMode === 'list') { renderListView(); } else { renderWeeklyView(); } renderSidebar(); calendarDisplayList.classList.toggle('hidden', currentViewMode !== 'list'); calendarDisplayWeek.classList.toggle('hidden', currentViewMode !== 'week');}
function renderListView() {
    clearDisplayAreaOnly('list');
    const combinedEvents = [...processedClassEvents, ...processedSidebarEvents.filter(e => e.isCanvasAssignment && e.startDate >= new Date())];
    const eventsToDisplay = filterAndSortEvents(combinedEvents);
    const eventsByDay = groupEventsByDay(eventsToDisplay);
    const sortedDays = Object.keys(eventsByDay).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDays.length === 0 && !isFirstLoad) { if (combinedEvents.length > 0 && currentSearchTerm) { showMessage(`No items found matching "${currentSearchTerm}".`, 'info', 'calendar'); } else if (combinedEvents.length === 0 && allParsedEvents.length > 0) { showMessage('No upcoming classes or assignments.', 'info', 'calendar'); } else if (allParsedEvents.length === 0) { if (!localStorage.getItem(CALENDAR_URL_KEY)) { showMessage('Go to Settings to enter your calendar URL.', 'info', 'calendar'); } else if (!calendarMessageArea.textContent.includes('Failed')) { showMessage('No upcoming events found.', 'info', 'calendar');}} return; }

    const now = new Date();
    sortedDays.forEach((dayString, dayIndex) => {
        const dayEvents = eventsByDay[dayString]; const dayDate = new Date(dayString); const dayHeader = document.createElement('h3'); dayHeader.className = 'text-lg font-semibold text-gray-700 mt-5 mb-2 border-b pb-1'; if (!isAutoRefreshing) { dayHeader.classList.add('fade-in'); dayHeader.style.animationDelay = `${dayIndex * 0.05}s`; } dayHeader.textContent = formatDateHeading(dayDate); calendarDisplayList.appendChild(dayHeader);
        dayEvents.forEach((event, eventIndex) => {
            const card = document.createElement('div');
            card.className = `event-card p-3 rounded-lg border shadow-sm ${event.isCanvasAssignment ? 'canvas-assignment-event' : ''}`;
            card.style.backgroundColor = event.color || (event.isCanvasAssignment ? '#fed7d7' : '#ffffff');
            card.style.borderColor = darkenColor(event.color || (event.isCanvasAssignment ? '#fed7d7' : '#e5e7eb'), 15);
            if (!isAutoRefreshing) { card.classList.add('fade-in'); card.style.animationDelay = `${(dayIndex * 50) + (eventIndex * 30) + 50}ms`; } else { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }

            const startTime = formatTime(event.startDate); const endTime = formatTime(event.endDate);
            const textColor = isColorDark(event.color || (event.isCanvasAssignment ? '#fed7d7' : '#ffffff')) ? 'text-white' : 'text-gray-800';
            const iconColor = isColorDark(event.color || (event.isCanvasAssignment ? '#fed7d7' : '#ffffff')) ? 'text-gray-300' : 'text-gray-500';
            const clockIcon = ICONS.clock.replace('text-gray-500', iconColor);
            const locationIcon = ICONS.location.replace('text-gray-500', iconColor);
            const teacherIcon = ICONS.teacher.replace('text-gray-500', iconColor);
            const assignmentIcon = ICONS.assignment.replace('text-gray-500', iconColor);

            let summaryHtml = event.summary;
            const canvasCourseId = canvasCourseMappings[event.summary];
            if (!event.isCanvasAssignment && canvasCourseId && canvasDomain) {
                const canvasLink = `https://${canvasDomain}/courses/${canvasCourseId}`;
                summaryHtml = `<a href="${canvasLink}" target="_blank" class="clickable-class-link hover:text-indigo-500">${event.summary}${ICONS.link}</a>`;
            } else if (event.isCanvasAssignment && event.html_url) {
                summaryHtml = `<a href="${event.html_url}" target="_blank" class="clickable-class-link hover:text-red-500">${event.summary}${ICONS.link}</a>`;
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
            card.innerHTML = `<div class="flex flex-col sm:flex-row justify-between sm:items-start mb-1"><h4 class="text-md font-semibold ${textColor} flex-grow pr-2">${summaryHtml} ${timeIndicatorHtml}</h4><span class="text-xs font-medium ${textColor} mt-1 sm:mt-0 whitespace-nowrap">${event.isCanvasAssignment ? assignmentIcon : clockIcon} ${startTime}${event.isCanvasAssignment ? '' : ' - ' + endTime}</span></div><div class="text-xs ${textColor} space-y-1 opacity-90"><p>${locationIcon} <span class="font-medium">${event.isCanvasAssignment ? 'Course' : 'Room'}:</span> ${locationHtml}</p>${event.teacher && !event.isCanvasAssignment ? `<p>${teacherIcon} <span class="font-medium">Teacher:</span> ${event.teacher}</p>` : ''}</div>`;
            calendarDisplayList.appendChild(card);
        });
    });
}
function renderWeeklyView() {
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
                let isClickable = false; let linkUrl = '';
                if (event.isCanvasAssignment && event.html_url) { isClickable = true; linkUrl = event.html_url;
                } else if (!event.isCanvasAssignment && canvasCourseMappings[event.summary] && canvasDomain) { isClickable = true; linkUrl = `https://${canvasDomain}/courses/${canvasCourseMappings[event.summary]}`; }

                eventDiv.className = `week-event ${event.isCanvasAssignment ? 'canvas-assignment-event' : ''} ${isClickable ? 'clickable-week-event' : ''}`;
                eventDiv.style.top = `${topPx}px`; eventDiv.style.height = `${heightPx}px`;
                eventDiv.style.backgroundColor = event.color || (event.isCanvasAssignment ? '#fed7d7' : '#e5e7eb');
                eventDiv.style.borderColor = darkenColor(event.color || (event.isCanvasAssignment ? '#fed7d7' : '#e5e7eb'), 15);
                const textColor = isColorDark(event.color || (event.isCanvasAssignment ? '#fed7d7' : '#ffffff')) ? 'text-white' : 'text-gray-800';

                if (!isAutoRefreshing) { eventDiv.classList.add('fade-in'); eventDiv.style.animationDelay = `${eventIndex * 0.03}s`; } else { eventDiv.style.opacity = '1'; eventDiv.style.transform = 'translateY(0)'; }

                let locationHtml = ''; if (event.oldLocation) { locationHtml += `<span class="text-red-500 line-through mr-1 opacity-80">${event.oldLocation}</span>`; } locationHtml += (event.location || '');
                let summaryText = event.summary;
                if(isClickable) summaryText += ` ${ICONS.link.replace('text-blue-500', textColor).replace('hover:text-blue-700', '')}`;

                let timeIndicatorHtml = '';
                if (nowTime >= event.startDate.getTime() && nowTime <= event.endDate.getTime() && !event.isCanvasAssignment) {
                    timeIndicatorHtml = `<span class="time-indicator time-indicator-now !text-xs !px-1 !py-0.5">NOW</span>`;
                } else if (event.startDate.getTime() > nowTime && event.startDate.toDateString() === new Date(nowTime).toDateString() && !event.isCanvasAssignment) {
                    const diffMins = Math.round((event.startDate.getTime() - nowTime) / 60000);
                    if (diffMins > 0 && diffMins <= 240) {
                         timeIndicatorHtml = `<span class="time-indicator time-indicator-upcoming !text-xs !px-1 !py-0.5">In ${diffMins}m</span>`;
                    }
                }

                eventDiv.innerHTML = `<strong class="${textColor}">${summaryText} ${timeIndicatorHtml}</strong><br><span class="text-xs ${textColor} opacity-80">${locationHtml}</span>`;
                eventDiv.title = `${event.summary}\n${formatTime(event.startDate)} - ${formatTime(event.endDate)}\nRoom: ${event.location || 'N/A'}${event.teacher ? '\nTeacher: ' + event.teacher : ''}`;
                if (isClickable) { eventDiv.onclick = () => window.open(linkUrl, '_blank'); }
                const targetContainer = dayContentContainers[eventDayIndex]; if (targetContainer) { targetContainer.appendChild(eventDiv); }
            }
        }
    });
}
function renderSidebar() {
    sidebarEventsDiv.innerHTML = '';
    const relevantSidebarEvents = processedSidebarEvents.filter(e => e.startDate >= new Date());
    if (relevantSidebarEvents.length === 0) { sidebarEventsDiv.innerHTML = '<p class="text-sm text-gray-500 italic">No other events or due dates found.</p>'; sidebar.classList.add('hidden'); return; }
    sidebar.classList.remove('hidden');
    relevantSidebarEvents.forEach((event, index) => {
        const card = document.createElement('div');
        card.className = `sidebar-event-card p-2.5 rounded-md border shadow-sm ${event.isCanvasAssignment ? 'canvas-assignment' : ''}`;
        if (!isAutoRefreshing) { card.classList.add('fade-in'); card.style.animationDelay = `${index * 0.04}s`; } else { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }
        const startTime = formatTime(event.startDate); const startDateStr = event.startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const isAssignmentIcon = event.isCanvasAssignment || /\b(due|assignment)\b/i.test(event.summary) || /\b(due|assignment)\b/i.test(event.originalSummary);
        const icon = isAssignmentIcon ? ICONS.assignment : ICONS.event;
        let summaryHtml = event.summary;
        if (event.isCanvasAssignment && event.html_url) {
            summaryHtml = `<a href="${event.html_url}" target="_blank" class="hover:underline">${event.summary}${ICONS.link}</a>`;
        }
        card.innerHTML = `<h4 class="text-sm font-semibold text-gray-800 mb-1">${summaryHtml}</h4><p class="text-xs text-gray-600">${icon} ${startDateStr} ${event.startDate.getHours() !== 0 || event.startDate.getMinutes() !== 0 ? 'at ' + startTime : ''}</p>${event.location ? `<p class="text-xs text-gray-600">${ICONS.location} ${event.location}</p>` : ''}`;
        sidebarEventsDiv.appendChild(card);
    });
}

async function fetchCanvasAPI(canvasApiEndpointWithPathAndQuery) {
    if (!compassWorkerUrl) { showMessageForCanvas('Cloudflare Worker URL not set in Settings.', 'error'); return null; }
    if (!canvasDomain || !canvasToken) { showMessageForCanvas('Canvas Domain and API Token not set in Settings.', 'error'); return null; }
    const workerPath = `${compassWorkerUrl}/canvas/${canvasApiEndpointWithPathAndQuery}`;
    const finalWorkerUrl = new URL(workerPath);
    finalWorkerUrl.searchParams.append('domain', canvasDomain);
    try {
        const response = await fetch(finalWorkerUrl.toString(), { headers: { 'Authorization': `Bearer ${canvasToken}` } });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ error: `Worker error: ${response.status} ${response.statusText}` })); throw new Error(errorData.error || `Failed to fetch from Canvas via worker: ${response.status}`); }
        return await response.json();
    } catch (error) { console.error('Canvas API Fetch Error via Worker:', error); showMessageForCanvas(`Error fetching from Canvas: ${error.message}. Check worker logs if issue persists.`, 'error'); return null; }
}
async function fetchCanvasCourses() { const courses = await fetchCanvasAPI('api/v1/courses?enrollment_state=active&per_page=50'); if (courses) { fetchedCanvasCourses = courses.map(course => ({ id: course.id, name: course.name, course_code: course.course_code })); return fetchedCanvasCourses; } return []; }
async function fetchAssignmentsForCourse(courseId) { const assignments = await fetchCanvasAPI(`api/v1/courses/${courseId}/assignments?order_by=due_at&bucket=upcoming&per_page=50`); return assignments || []; }

async function processCanvasAssignmentsIntoEvents() {
    if (!compassWorkerUrl || !canvasDomain || !canvasToken) return;
    const courses = await fetchCanvasCourses();
    if (!courses || courses.length === 0) return;
    let newCanvasAssignmentEvents = [];
    for (const course of courses) {
        const assignments = await fetchAssignmentsForCourse(course.id);
        if (assignments && assignments.length > 0) {
            assignments.forEach(assignment => {
                if (assignment.due_at) {
                    const dueDate = new Date(assignment.due_at);
                    newCanvasAssignmentEvents.push({
                        id: `canvas-asgn-${assignment.id}`,
                        summary: `(Canvas) ${assignment.name}`,
                        originalSummary: `(Canvas) ${assignment.name} - ${course.name}`,
                        startDate: dueDate,
                        endDate: new Date(dueDate.getTime() + 30 * 60000),
                        location: `Canvas: ${course.name}`,
                        description: assignment.html_url,
                        isCanvasAssignment: true,
                        html_url: assignment.html_url,
                        color: '#FFCDD2'
                    });
                }
            });
        }
    }
    allParsedEvents = allParsedEvents.filter(event => !event.isCanvasAssignment);
    allParsedEvents.push(...newCanvasAssignmentEvents);
}

async function fetchCanvasData() {
    if (!compassWorkerUrl || !canvasDomain || !canvasToken) { showMessageForCanvas('Please set Worker URL, Canvas Domain and API Token in Settings.', 'info'); return; }
    showMessageForCanvas('Loading Canvas data for Canvas Tab...', 'loading');
    const courses = fetchedCanvasCourses.length > 0 ? fetchedCanvasCourses : await fetchCanvasCourses();
    if (!courses || courses.length === 0) { if (!canvasDataMessageArea.textContent.includes('Error')) { showMessageForCanvas('No active Canvas courses found or failed to load courses.', 'info');} return; }
    canvasCoursesDisplay.innerHTML = ''; let assignmentsFound = 0;
    for (const course of courses) {
        const courseDiv = document.createElement('div'); courseDiv.className = 'canvas-item-card p-4 rounded-lg shadow mb-4';
        courseDiv.innerHTML = `<h3 class="text-lg font-semibold text-indigo-700 mb-2">${course.name} <span class="text-sm text-gray-500">(${course.course_code || 'ID: ' + course.id})</span></h3>`;
        const assignmentsList = document.createElement('ul'); assignmentsList.className = 'list-disc list-inside space-y-1 pl-2 text-sm';
        const assignments = await fetchAssignmentsForCourse(course.id);
        if (assignments && assignments.length > 0) {
            assignmentsFound += assignments.length;
            assignments.forEach(assignment => { const li = document.createElement('li'); const dueDate = assignment.due_at ? new Date(assignment.due_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour:'numeric', minute:'2-digit' }) : 'No due date'; li.innerHTML = `<a href="${assignment.html_url}" target="_blank" class="text-blue-600 hover:underline">${assignment.name}${ICONS.link}</a> - Due: ${dueDate}`; assignmentsList.appendChild(li); });
        } else { assignmentsList.innerHTML = '<li class="text-gray-500 italic">No upcoming assignments.</li>'; }
        courseDiv.appendChild(assignmentsList); canvasCoursesDisplay.appendChild(courseDiv);
    }
    if (assignmentsFound > 0) { showMessageForCanvas(`Loaded ${courses.length} courses and ${assignmentsFound} upcoming assignments.`, 'success');
    } else if (courses.length > 0) { showMessageForCanvas(`Loaded ${courses.length} courses. No upcoming assignments found for these courses.`, 'info'); }
}
function showMessageForCanvas(msg, type = 'info') {
    canvasDataMessageArea.innerHTML = ''; const msgElement = document.createElement('div'); let bgColor, textColor, borderColor, loader = ''; let autoDismiss = (type === 'success' || type === 'info');
    switch (type) { case 'error': bgColor = 'bg-red-100'; textColor = 'text-red-700'; borderColor = 'border-red-500'; break; case 'success': bgColor = 'bg-green-100'; textColor = 'text-green-700'; borderColor = 'border-green-500'; break; case 'loading': bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; borderColor = 'border-blue-500'; loader = '<div class="loader !w-5 !h-5 !border-2 !inline-block !mr-2 !align-middle"></div>'; break; default: bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; borderColor = 'border-blue-500';}
    msgElement.className = `p-3 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-md shadow-sm text-sm fade-in`; msgElement.innerHTML = loader + msg; canvasDataMessageArea.appendChild(msgElement);
    if (autoDismiss) { setTimeout(() => { if (canvasDataMessageArea.contains(msgElement)) { msgElement.classList.remove('fade-in'); msgElement.classList.add('fade-out'); msgElement.addEventListener('animationend', () => { if(canvasDataMessageArea.contains(msgElement)) canvasDataMessageArea.removeChild(msgElement); }, { once: true }); } }, 3000); }
}

function renderNotificationSettings() {
    notifyClassesEnabledCheckbox.checked = notificationSettings.classesEnabled;
    notifyClassesLeadTimeInput.value = notificationSettings.classesLeadTime;
    notifyAssignmentsEnabled1Checkbox.checked = notificationSettings.assignmentsEnabled1;
    notifyAssignmentsLeadTime1Input.value = notificationSettings.assignmentsLeadTime1;
    notifyAssignmentsEnabled2Checkbox.checked = notificationSettings.assignmentsEnabled2;
    notifyAssignmentsLeadTime2Input.value = notificationSettings.assignmentsLeadTime2;
    notifyTimetableChangesEnabledCheckbox.checked = notificationSettings.timetableChangesEnabled;
    updateNotificationPermissionStatus();
}
function handleSaveNotificationSettings() {
    notificationSettings.classesEnabled = notifyClassesEnabledCheckbox.checked;
    notificationSettings.classesLeadTime = parseInt(notifyClassesLeadTimeInput.value) || 5;
    notificationSettings.assignmentsEnabled1 = notifyAssignmentsEnabled1Checkbox.checked;
    notificationSettings.assignmentsLeadTime1 = parseInt(notifyAssignmentsLeadTime1Input.value) || 60;
    notificationSettings.assignmentsEnabled2 = notifyAssignmentsEnabled2Checkbox.checked;
    notificationSettings.assignmentsLeadTime2 = parseInt(notifyAssignmentsLeadTime2Input.value) || 5;
    notificationSettings.timetableChangesEnabled = notifyTimetableChangesEnabledCheckbox.checked;
    saveSettings(true, 'notifications');
}
function setupNotificationPermission() {
    if (!("Notification" in window)) { notificationPermissionStatusDiv.textContent = "This browser does not support desktop notification."; return; }
    updateNotificationPermissionStatus();
    [notifyClassesEnabledCheckbox, notifyAssignmentsEnabled1Checkbox, notifyAssignmentsEnabled2Checkbox, notifyTimetableChangesEnabledCheckbox].forEach(cb => {
        cb.addEventListener('change', () => { if (cb.checked && Notification.permission === 'default') { requestNotificationPermission(); } });
    });
}
function requestNotificationPermission() { Notification.requestPermission().then(permission => { notificationPermission = permission; updateNotificationPermissionStatus(); if (permission === 'granted') { new Notification("Class Companion", { body: "Notifications enabled!" }); } }); }
function updateNotificationPermissionStatus() {
    if (Notification.permission === "granted") { notificationPermissionStatusDiv.textContent = "Notifications are enabled."; notificationPermissionStatusDiv.className = "text-sm text-green-600 mb-3";
    } else if (Notification.permission === "denied") { notificationPermissionStatusDiv.textContent = "Notifications are disabled by browser. Please enable them in your browser settings."; notificationPermissionStatusDiv.className = "text-sm text-red-600 mb-3";
    } else { notificationPermissionStatusDiv.textContent = "Click 'Save Notification Preferences' after enabling to request permission."; notificationPermissionStatusDiv.className = "text-sm text-gray-600 mb-3"; }
}
function sendBrowserNotification(title, body, tag = null) { if (notificationPermission !== 'granted') return; const options = { body: body, icon: './favicon.ico' }; if (tag) options.tag = tag; new Notification(title, options); }

function detectAndNotifyTimetableChanges(newEvents, oldCompassEvents) { // oldCompassEvents should be just Compass events
    if (!notificationSettings.timetableChangesEnabled || notificationPermission !== 'granted') return;
    const oldEventsMap = new Map(oldCompassEvents.map(e => [e.id, e]));
    const newEventsMap = new Map(newEvents.filter(e => !e.isCanvasAssignment).map(e => [e.id, e])); // Only compare new Compass events

    oldCompassEvents.forEach(oldEvent => {
        const newEvent = newEventsMap.get(oldEvent.id);
        const notificationIdBase = `tt_change_${oldEvent.id}`;
        if (!newEvent) {
            const notificationId = `${notificationIdBase}_cancelled`;
            if (!sentNotifications.has(notificationId)) { sendBrowserNotification("Class Cancelled", `${oldEvent.summary} at ${formatTime(oldEvent.startDate)} has been cancelled.`, notificationId); sentNotifications.add(notificationId); }
        } else {
            if (oldEvent.location !== newEvent.location) {
                const notificationId = `${notificationIdBase}_room_${newEvent.location}`;
                if (!sentNotifications.has(notificationId)) { sendBrowserNotification("Room Change", `${newEvent.summary} at ${formatTime(newEvent.startDate)} is now in ${newEvent.location || 'N/A'} (was ${oldEvent.location || 'N/A'}).`, notificationId); sentNotifications.add(notificationId); }
            }
            if (oldEvent.startDate.getTime() !== newEvent.startDate.getTime() || oldEvent.endDate.getTime() !== newEvent.endDate.getTime()) {
                const notificationId = `${notificationIdBase}_time_${newEvent.startDate.getTime()}`;
                if (!sentNotifications.has(notificationId)) { sendBrowserNotification("Class Time Change", `${newEvent.summary} is now at ${formatTime(newEvent.startDate)} - ${formatTime(newEvent.endDate)} (was ${formatTime(oldEvent.startDate)} - ${formatTime(oldEvent.endDate)}).`, notificationId); sentNotifications.add(notificationId); }
            }
        }
    });
}

function checkAndSendNotifications() {
    if (notificationPermission !== 'granted') return;
    const now = new Date().getTime();
    const eventsToCheck = [...processedClassEvents, ...allParsedEvents.filter(e => e.isCanvasAssignment)]; // Use allParsedEvents for Canvas assignments

    eventsToCheck.forEach(event => {
        const eventTime = event.startDate.getTime();
        const eventIdBase = event.id;
        if (notificationSettings.classesEnabled && !event.isCanvasAssignment) {
            const notifyTime = eventTime - (notificationSettings.classesLeadTime * 60000);
            const notificationId = `${eventIdBase}_class_${notificationSettings.classesLeadTime}`;
            if (now >= notifyTime && now < eventTime && !sentNotifications.has(notificationId)) { sendBrowserNotification("Class Starting Soon!", `${event.summary} at ${formatTime(event.startDate)}${event.location ? ' in ' + event.location : ''}`, notificationId); sentNotifications.add(notificationId); }
        }
        if (event.isCanvasAssignment) {
            if (notificationSettings.assignmentsEnabled1) {
                const notifyTime1 = eventTime - (notificationSettings.assignmentsLeadTime1 * 60000);
                const notificationId1 = `${eventIdBase}_assign1_${notificationSettings.assignmentsLeadTime1}`;
                if (now >= notifyTime1 && now < eventTime && !sentNotifications.has(notificationId1)) { sendBrowserNotification("Assignment Due Soon!", `${event.summary} is due at ${formatTime(event.startDate)} (${notificationSettings.assignmentsLeadTime1} mins).`, notificationId1); sentNotifications.add(notificationId1); }
            }
            if (notificationSettings.assignmentsEnabled2) {
                const notifyTime2 = eventTime - (notificationSettings.assignmentsLeadTime2 * 60000);
                const notificationId2 = `${eventIdBase}_assign2_${notificationSettings.assignmentsLeadTime2}`;
                if (now >= notifyTime2 && now < eventTime && !sentNotifications.has(notificationId2)) { sendBrowserNotification("Assignment Due Very Soon!", `${event.summary} is due at ${formatTime(event.startDate)} (${notificationSettings.assignmentsLeadTime2} mins!).`, notificationId2); sentNotifications.add(notificationId2); }
            }
        }
    });
}
function startNotificationChecker() { if (notificationCheckIntervalId) clearInterval(notificationCheckIntervalId); notificationCheckIntervalId = setInterval(checkAndSendNotifications, NOTIFICATION_CHECK_INTERVAL); }

function handleSearch(event) { currentSearchTerm = event.target.value.toLowerCase(); renderListView(); }
function handleSort(event) { currentSortOrder = event.target.value; renderListView(); }
function filterAndSortEvents(events) { const filtered = events.filter(event => { if (!currentSearchTerm) return true; const teacherMatch = event.teacher ? event.teacher.toLowerCase().includes(currentSearchTerm) : false; return ( event.summary.toLowerCase().includes(currentSearchTerm) || event.originalSummary.toLowerCase().includes(currentSearchTerm) || (event.location && event.location.toLowerCase().includes(currentSearchTerm)) || teacherMatch ); }); return filtered; }
function groupEventsByDay(events) { const grouped = {}; events.forEach(event => { const dayKey = event.startDate.toDateString(); if (!grouped[dayKey]) grouped[dayKey] = []; grouped[dayKey].push(event); }); for (const dayKey in grouped) { grouped[dayKey].sort((a, b) => { switch (currentSortOrder) { case 'name': return a.summary.localeCompare(b.summary); case 'location': return (a.location || '').localeCompare(b.location || ''); case 'time': default: return a.startDate - b.startDate; } }); } return grouped; }

function initializeStatusIndicator() { if (statusUpdateIntervalId) clearInterval(statusUpdateIntervalId); statusUpdateIntervalId = setInterval(updateAgoText, STATUS_UPDATE_INTERVAL); updateStatusIndicator(currentStatus); }
function updateStatusIndicator(status) { currentStatus = status; statusIndicatorDiv.classList.remove('hidden'); let iconHtml = ''; let textPrefix = ''; let textClass = 'status-text'; let iconClass = 'status-icon'; switch (status) { case 'live': iconHtml = ''; iconClass += ' live'; textPrefix = 'LIVE'; break; case 'failed': iconHtml = ICONS.cloudError; iconClass += ' failed'; textClass += ' failed'; textPrefix = 'FAILED'; break; case 'loading': iconHtml = '<div class="loader !w-3 !h-3 !border-2 !border-t-blue-500 !m-0"></div>'; iconClass = ''; textPrefix = 'Loading...'; break; case 'idle': default: statusIndicatorDiv.classList.add('hidden'); return; } statusIconSpan.innerHTML = iconHtml; statusIconSpan.className = iconClass; statusTextSpan.className = textClass; statusTextSpan.textContent = `${textPrefix} - ${getAgoText()}`; }
function updateAgoText() { if (currentStatus === 'live' || currentStatus === 'failed') { statusTextSpan.textContent = `${currentStatus.toUpperCase()} - ${getAgoText()}`; } else if (currentStatus === 'loading') { statusTextSpan.textContent = 'Loading...'; } }
function getAgoText() { if (!lastSuccessfulUpdateTime) return 'never updated'; const now = Date.now(); const secondsAgo = Math.round((now - lastSuccessfulUpdateTime) / 1000); if (secondsAgo < 5) return 'updated just now'; if (secondsAgo < 60) return `updated ${secondsAgo}s ago`; const minutesAgo = Math.floor(secondsAgo / 60); if (minutesAgo < 60) return `updated ${minutesAgo}m ago`; const hoursAgo = Math.floor(minutesAgo / 60); return `updated ${hoursAgo}h ago`; }

function clearDisplay() { calendarDisplayList.innerHTML = ''; weeklyViewGrid.innerHTML = ''; sidebarEventsDiv.innerHTML = ''; canvasCoursesDisplay.innerHTML = ''; canvasDataMessageArea.innerHTML = '';}
function clearDisplayAreaOnly(view = 'list') { if (view === 'list') calendarDisplayList.innerHTML = ''; else if (view === 'week') weeklyViewGrid.innerHTML = ''; else if (view === 'canvas') canvasCoursesDisplay.innerHTML = '';}
function showMessage(msg, type = 'info', location = 'calendar') { const targetMessageArea = location === 'settings' ? settingsMessageArea : calendarMessageArea; if (messageTimeout && targetMessageArea.contains(messageTimeout.element)) { clearTimeout(messageTimeout.id); if (messageTimeout.element && targetMessageArea.contains(messageTimeout.element)) {targetMessageArea.removeChild(messageTimeout.element);} } targetMessageArea.innerHTML = ''; const msgElement = document.createElement('div'); let bgColor, textColor, borderColor, loader = ''; let autoDismiss = false; switch (type) { case 'error': bgColor = 'bg-red-100'; textColor = 'text-red-700'; borderColor = 'border-red-500'; break; case 'success': bgColor = 'bg-green-100'; textColor = 'text-green-700'; borderColor = 'border-green-500'; autoDismiss = true; break; case 'loading': bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; borderColor = 'border-blue-500'; loader = '<div class="loader !w-5 !h-5 !border-2 !inline-block !mr-2 !align-middle"></div>'; break; default: bgColor = 'bg-blue-100'; textColor = 'text-blue-700'; borderColor = 'border-blue-500'; autoDismiss = true;} msgElement.className = `p-3 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-md shadow-sm text-sm fade-in`; msgElement.innerHTML = loader + msg; targetMessageArea.appendChild(msgElement); if (autoDismiss) { const timeoutId = setTimeout(() => { if (targetMessageArea.contains(msgElement)) { msgElement.classList.remove('fade-in'); msgElement.classList.add('fade-out'); msgElement.addEventListener('animationend', () => { if(targetMessageArea.contains(msgElement)) {targetMessageArea.removeChild(msgElement);} }, { once: true }); } if (messageTimeout && messageTimeout.id === timeoutId) { messageTimeout = null; } }, 3000); messageTimeout = { id: timeoutId, element: msgElement }; } else { messageTimeout = { id: null, element: msgElement }; } }
function formatTime(date) { return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }); }
function formatDateHeading(date) { const options = { weekday: 'long', month: 'long', day: 'numeric' }; return date.toLocaleDateString(undefined, options); }
function extractTeacher(description) { const lines = description.split('\\n'); let teacherLine = lines.find(line => /^\s*teacher:/i.test(line)); if (teacherLine) return teacherLine.replace(/^\s*teacher:/i, '').trim(); return null; }
function isColorDark(hexColor) { if (!hexColor || hexColor.length < 4) return false; hexColor = hexColor.substring(1); if (hexColor.length === 3) hexColor = hexColor.split('').map(c => c + c).join(''); const r = parseInt(hexColor.substring(0, 2), 16); const g = parseInt(hexColor.substring(2, 4), 16); const b = parseInt(hexColor.substring(4, 6), 16); const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)); return hsp < 127.5; }
function darkenColor(hexColor, percent) { if (!hexColor || hexColor.length < 4) return '#cccccc'; let R = parseInt(hexColor.substring(1,3),16); let G = parseInt(hexColor.substring(3,5),16); let B = parseInt(hexColor.substring(5,7),16); R = parseInt(R * (100 - percent) / 100); G = parseInt(G * (100 - percent) / 100); B = parseInt(B * (100 - percent) / 100); R = (R<0)?0:R; G = (G<0)?0:G; B = (B<0)?0:B; const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16)); const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16)); const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16)); return "#"+RR+GG+BB; }
