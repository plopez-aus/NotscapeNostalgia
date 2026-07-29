// Global state variables
let currentPrefs = {};
let navigationHistory = [];
const maxHistorySize = 10;

// DOM Elements
const webview = document.getElementById('browser-webview');
const urlInput = document.getElementById('url-input');
const urlLabel = document.getElementById('location-bar-label');
const historyDropdownBtn = document.getElementById('btn-history-dropdown');
const historyDropdownList = document.getElementById('history-dropdown-list');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('status-progress-bar');
const progressContainer = document.getElementById('status-progress-container');
const padlockIcon = document.getElementById('padlock-icon');
const throbber = document.getElementById('btn-throbber');
const throbberAnim = document.getElementById('throbber-animation');

// Toolbar Buttons
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnHome = document.getElementById('btn-home');
const btnReload = document.getElementById('btn-reload');
const btnOpen = document.getElementById('btn-open');
const btnPrint = document.getElementById('btn-print');
const btnFind = document.getElementById('btn-find');
const btnStop = document.getElementById('btn-stop');

// Dropdowns & Modals
const prefOverlay = document.getElementById('preferences-overlay');
const aboutOverlay = document.getElementById('about-overlay');

// Initialize Configuration
async function initApp() {
  // Fetch settings from main process
  currentPrefs = await window.notscapeAPI.getPreferences();
  
  // Apply saved appearance preferences
  applyAppearancePreferences();
  
  // Draw bookmarks lists
  renderBookmarksMenu();
  
  // Load default startup page
  let startUrl = currentPrefs.navigator.homepage_url;
  if (currentPrefs.navigator.start_mode === 'blank') {
    startUrl = 'about:blank';
  }
  
  webview.src = startUrl;
  urlInput.value = startUrl;
}

// Apply visual appearance rules based on preferences
function applyAppearancePreferences() {
  const mode = currentPrefs.appearance.toolbar_mode;
  const body = document.body;
  
  // Clear appearance classes
  body.classList.remove('toolbar-pics-text', 'toolbar-pics-only', 'toolbar-text-only');
  
  // Apply selected appearance stylesheet toggles
  const btnTexts = document.querySelectorAll('.btn-text');
  const btnIcons = document.querySelectorAll('.btn-icon');
  const throbberBox = document.getElementById('btn-throbber');

  if (mode === 'pictures_only') {
    btnTexts.forEach(el => el.style.display = 'none');
    btnIcons.forEach(el => el.style.display = 'block');
    throbberBox.style.height = '36px'; // smaller throbber
  } else if (mode === 'text_only') {
    btnTexts.forEach(el => el.style.display = 'block');
    btnIcons.forEach(el => el.style.display = 'none');
    throbberBox.style.height = '24px';
  } else { // pictures_and_text
    btnTexts.forEach(el => el.style.display = 'block');
    btnIcons.forEach(el => el.style.display = 'block');
    throbberBox.style.height = '48px';
  }

  // Underline Links option is injected directly to webview page on load
  injectHyperlinkUnderlines();
}

// Inject hyperlink formatting directly into the guest DOM stylesheet
function injectHyperlinkUnderlines() {
  try {
    const underline = currentPrefs.appearance.underline_links;
    const cssStyle = underline 
      ? "a { text-decoration: underline !important; }" 
      : "a { text-decoration: none !important; } a:hover { text-decoration: underline !important; }";
    
    webview.addEventListener('dom-ready', () => {
      webview.insertCSS(cssStyle);
    });
  } catch(err) {
    console.error("Failed to inject CSS styles:", err);
  }
}

// Render dynamic bookmarks lists in File dropdowns
function renderBookmarksMenu() {
  const dropdown = document.getElementById('bookmarks-dropdown-list');
  
  // Clear previous dynamic items (everything below the add bookmark button and separator)
  const itemsToRemove = dropdown.querySelectorAll('.dynamic-bookmark-item');
  itemsToRemove.forEach(item => item.remove());
  
  if (currentPrefs.bookmarks && currentPrefs.bookmarks.length > 0) {
    currentPrefs.bookmarks.forEach(bm => {
      const option = document.createElement('div');
      option.className = 'dropdown-option dynamic-bookmark-item';
      
      // Bookmark text with folder icon styling
      option.innerHTML = `&#128196; ${bm.title}`;
      option.addEventListener('click', () => {
        navigate(bm.url);
      });
      dropdown.appendChild(option);
    });
  }
}

// Navigation wrapper
function navigate(url) {
  let targetUrl = url.trim();
  
  // Clean empty URLs
  if (!targetUrl) return;

  // Auto-prefix domains without schemes
  if (!/^(http|https|notscape):\/\//i.test(targetUrl) && !/^view-source:/i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }
  
  webview.loadURL(targetUrl);
  urlInput.value = targetUrl;
}

// Update Back/Forward button disabled states
function updateNavigationButtonStates() {
  try {
    if (webview.canGoBack()) {
      btnBack.classList.remove('disabled');
    } else {
      btnBack.classList.add('disabled');
    }
    
    if (webview.canGoForward()) {
      btnForward.classList.remove('disabled');
    } else {
      btnForward.classList.add('disabled');
    }
  } catch (err) {
    // Webview is not fully ready
  }
}

// History Tracker helper
function addPageToHistory(url, title) {
  // Avoid duplicating top page in logs
  if (navigationHistory.length > 0 && navigationHistory[0].url === url) {
    return;
  }
  
  // Filter homepages from dropdown logs
  if (url === 'about:blank' || url.startsWith('notscape://')) return;
  
  navigationHistory.unshift({ url, title });
  if (navigationHistory.length > maxHistorySize) {
    navigationHistory.pop();
  }
  
  renderHistoryDropdown();
}

// Render historical links in the location bar dropdown list
function renderHistoryDropdown() {
  historyDropdownList.innerHTML = '';
  
  if (navigationHistory.length === 0) {
    const item = document.createElement('div');
    item.className = 'history-list-item disabled';
    item.textContent = '(No navigation history)';
    historyDropdownList.appendChild(item);
    return;
  }
  
  navigationHistory.forEach(hist => {
    const item = document.createElement('div');
    item.className = 'history-list-item';
    item.textContent = hist.url;
    item.title = `${hist.title} (${hist.url})`;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate(hist.url);
      historyDropdownList.style.display = 'none';
    });
    
    historyDropdownList.appendChild(item);
  });
}

// WebView Event Handlers
webview.addEventListener('did-start-loading', () => {
  throbber.classList.add('loading');
  statusText.textContent = "Connecting to website...";
  progressContainer.style.display = 'block';
  progressBar.style.width = '15%';
});

webview.addEventListener('did-stop-loading', () => {
  throbber.classList.remove('loading');
  statusText.textContent = "Document: Done";
  progressBar.style.width = '100%';
  
  setTimeout(() => {
    progressContainer.style.display = 'none';
  }, 350);
  
  // Update browser bar URL
  const currentUrl = webview.getURL();
  urlInput.value = currentUrl;
  
  // Update Security padlock and Netsite labels
  if (currentUrl.startsWith('https://')) {
    urlLabel.textContent = "Netsite:";
    padlockIcon.className = "security-padlock locked";
    padlockIcon.parentElement.title = "Secure HTTPS Connection";
  } else {
    urlLabel.textContent = "Location:";
    padlockIcon.className = "security-padlock unlocked";
    padlockIcon.parentElement.title = "Insecure HTTP/Local Connection";
  }

  // Log in session history list
  const title = webview.getTitle() || "Web Page";
  addPageToHistory(currentUrl, title);
  updateNavigationButtonStates();
  injectHyperlinkUnderlines();
});

webview.addEventListener('did-fail-load', (event) => {
  throbber.classList.remove('loading');
  statusText.textContent = `Connect: Failed to load page (${event.errorDescription})`;
  progressContainer.style.display = 'none';
});

webview.addEventListener('page-title-updated', (e) => {
  const fullTitle = `${e.title} - Notscape Nostalgia Gold(ish)`;
  document.title = fullTitle;
  const winTitleEl = document.getElementById('window-title');
  if (winTitleEl) {
    winTitleEl.textContent = fullTitle;
  }
});

// Update status text on webview hyperlink hover (link preview)
webview.addEventListener('update-target-url', (e) => {
  if (e.url) {
    statusText.textContent = `Connect: Go to ${e.url}`;
  } else {
    statusText.textContent = "Document: Done";
  }
});

// Intercept window opens inside webview to load them in the same container
webview.addEventListener('new-window', (e) => {
  navigate(e.url);
});

// Event Binding: Toolbar buttons
btnBack.addEventListener('click', () => {
  if (webview.canGoBack()) webview.goBack();
});

btnForward.addEventListener('click', () => {
  if (webview.canGoForward()) webview.goForward();
});

btnHome.addEventListener('click', () => {
  navigate(currentPrefs.navigator.homepage_url);
});

btnReload.addEventListener('click', () => {
  webview.reload();
});

btnOpen.addEventListener('click', () => {
  urlInput.focus();
  urlInput.select();
});

btnPrint.addEventListener('click', () => {
  webview.print();
});

btnFind.addEventListener('click', () => {
  const query = prompt("Find text in page:");
  if (query) {
    webview.findInPage(query);
  }
});

btnStop.addEventListener('click', () => {
  webview.stop();
});

throbber.addEventListener('click', () => {
  navigate(currentPrefs.navigator.homepage_url);
});

// Bookmark drag helper shortcut
document.getElementById('btn-bookmark-helper').addEventListener('click', () => {
  addBookmarkAction();
});

// Address Bar Input Events
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    navigate(urlInput.value);
    urlInput.blur();
  }
});

// Address Bar History Dropdown toggle
historyDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const show = historyDropdownList.style.display === 'block';
  historyDropdownList.style.display = show ? 'none' : 'block';
  if (!show) {
    renderHistoryDropdown();
  }
});

// Close history list clicking anywhere else
document.addEventListener('click', () => {
  historyDropdownList.style.display = 'none';
});

// Event Binding: Menu Options
document.getElementById('opt-new-window').addEventListener('click', () => {
  window.notscapeAPI.newWindow();
});

document.getElementById('opt-open-location').addEventListener('click', () => {
  urlInput.focus();
  urlInput.select();
});

document.getElementById('opt-print').addEventListener('click', () => {
  webview.print();
});

document.getElementById('opt-close').addEventListener('click', () => {
  window.notscapeAPI.closeApp();
});

document.getElementById('opt-reload-view').addEventListener('click', () => {
  webview.reload();
});

document.getElementById('opt-source-view').addEventListener('click', () => {
  // Classic Netscape behavior was opening the raw page structure. We can inspect via alerts or load in view source mode.
  const currentUrl = webview.getURL();
  navigate(`view-source:${currentUrl}`);
});

document.getElementById('opt-go-back').addEventListener('click', () => {
  if (webview.canGoBack()) webview.goBack();
});

document.getElementById('opt-go-forward').addEventListener('click', () => {
  if (webview.canGoForward()) webview.goForward();
});

document.getElementById('opt-go-home').addEventListener('click', () => {
  navigate(currentPrefs.navigator.homepage_url);
});

// Bookmarks actions
function addBookmarkAction() {
  const url = webview.getURL();
  const title = webview.getTitle() || "Bookmarked Page";
  
  // Avoid saving default portals
  if (url === 'about:blank') return;

  // Check if bookmark already exists
  const exists = currentPrefs.bookmarks.some(bm => bm.url === url);
  if (!exists) {
    currentPrefs.bookmarks.push({ title, url });
    window.notscapeAPI.savePreferences(currentPrefs);
    renderBookmarksMenu();
    statusText.textContent = `Bookmark added: ${title}`;
  } else {
    statusText.textContent = "This page is already bookmarked.";
  }
}

document.getElementById('opt-add-bookmark').addEventListener('click', addBookmarkAction);

// Options Preference Overlay Control
document.getElementById('opt-pref').addEventListener('click', () => {
  // Populate options with current parameters
  document.querySelector(`input[name="toolbar_appearance"][value="${currentPrefs.appearance.toolbar_mode}"]`).checked = true;
  document.getElementById('pref-underline-links').checked = currentPrefs.appearance.underline_links;
  document.querySelector(`input[name="start_mode"][value="${currentPrefs.navigator.start_mode}"]`).checked = true;
  document.getElementById('pref-homepage-url').value = currentPrefs.navigator.homepage_url;
  document.getElementById('pref-history-days').value = currentPrefs.navigator.history_expiration_days;
  document.getElementById('pref-enable-adblock').checked = currentPrefs.navigator.enable_adblock !== false;
  
  // Open modal card
  prefOverlay.classList.add('active');
});

// Tabs toggling in Preference Dialog
const tabAppearanceBtn = document.getElementById('tab-appearance-btn');
const tabNavigatorBtn = document.getElementById('tab-navigator-btn');
const tabAppearanceContent = document.getElementById('tab-appearance');
const tabNavigatorContent = document.getElementById('tab-navigator');

tabAppearanceBtn.addEventListener('click', () => {
  tabAppearanceBtn.classList.add('active');
  tabNavigatorBtn.classList.remove('active');
  tabAppearanceContent.classList.add('active');
  tabNavigatorContent.classList.remove('active');
});

tabNavigatorBtn.addEventListener('click', () => {
  tabNavigatorBtn.classList.add('active');
  tabAppearanceBtn.classList.remove('active');
  tabNavigatorContent.classList.add('active');
  tabAppearanceContent.classList.remove('active');
});

// Close Prefs Modals
function closePrefModal() {
  prefOverlay.classList.remove('active');
}

document.getElementById('pref-title-close').addEventListener('click', closePrefModal);
document.getElementById('pref-cancel-btn').addEventListener('click', closePrefModal);

// Save Preferences logic
document.getElementById('pref-ok-btn').addEventListener('click', async () => {
  // Fetch values from settings form inputs
  const toolbarMode = document.querySelector('input[name="toolbar_appearance"]:checked').value;
  const underlineLinks = document.getElementById('pref-underline-links').checked;
  const startMode = document.querySelector('input[name="start_mode"]:checked').value;
  const homepageUrl = document.getElementById('pref-homepage-url').value.trim();
  const historyDays = parseInt(document.getElementById('pref-history-days').value) || 9;
  const enableAdblock = document.getElementById('pref-enable-adblock').checked;

  // Save updates in runtime state object
  currentPrefs.appearance.toolbar_mode = toolbarMode;
  currentPrefs.appearance.underline_links = underlineLinks;
  currentPrefs.navigator.start_mode = startMode;
  currentPrefs.navigator.homepage_url = homepageUrl;
  currentPrefs.navigator.history_expiration_days = historyDays;
  currentPrefs.navigator.enable_adblock = enableAdblock;

  // Send updates to main.js for write operations
  await window.notscapeAPI.savePreferences(currentPrefs);
  
  // Apply styles dynamically in browser wrapper
  applyAppearancePreferences();
  closePrefModal();
  statusText.textContent = "Preferences saved.";
});

// Clear history action
document.getElementById('btn-clear-history').addEventListener('click', () => {
  navigationHistory = [];
  renderHistoryDropdown();
  alert("Browsing history logs cleared successfully.");
});

// About Modal Control (shows the launch splash screen)
document.getElementById('opt-about').addEventListener('click', () => {
  window.notscapeAPI.showSplash();
});

// Native title bar controls
document.getElementById('title-btn-min').addEventListener('click', () => {
  window.notscapeAPI.minimizeApp();
});
document.getElementById('title-btn-max').addEventListener('click', () => {
  window.notscapeAPI.maximizeApp();
});
document.getElementById('title-btn-close').addEventListener('click', () => {
  window.notscapeAPI.closeApp();
});

// App Startup execution
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
