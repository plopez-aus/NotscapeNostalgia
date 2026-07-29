# Settings and Preferences Specification

This document details the configuration options and storage mechanism for **Notscape Nostalgia Gold(ish)**, focusing only on the basic, nostalgic settings that make sense for this remake.

## 1. Preferences Dialog Layout

Settings are configured via a tabbed Preferences Dialog (accessible via the `Options -> General Preferences` menu). In keeping with the retro aesthetic, the preferences window uses standard tab headers at the top, a card-like body with grey borders, and `OK`, `Cancel`, and `Apply` command buttons at the bottom.

---

## 2. Configurable Settings

### A. Appearance Tab
Controls the look and styling of the browser shell.

*   **Toolbar Display Mode:**
    - Option A: *Pictures and Text* (Default) - Displays the toolbar buttons with both their retro graphic and the title text beneath.
    - Option B: *Pictures Only* - Displays only the 3D-bevel icons.
    - Option C: *Text Only* - Displays flat text links in place of button boxes.
*   **Hyperlink Presentation:**
    - *Underline Links:* Checkbox (Default: True). When unchecked, client-side CSS will inject rules to hide underlines on standard hyperlinks unless hovered.

### B. Navigator Tab (Startup & Navigation)
Determines what the browser loads when first launched.

*   **Browser Starts With:**
    - Radio Option 1: *Blank Page* (`about:blank`).
    - Radio Option 2: *Home Page* (Loads the designated home page URL).
*   **Home Page URL:**
    - Input text box (Default: `https://archive.org` or a built-in nostalgic portal `http://localhost:port/retro-portal`). Clicking the animated Netscape logo throbber navigates to this URL.
*   **History retention:**
    - Input numeric box: *Expire history after [ X ] days* (Default: 9 days).
    - Command Button: *Clear History Now* (Purges navigation logs).

---

## 3. Configuration Storage (Data Persistence)

All settings are stored locally in a standard JSON format inside the application directory. 

*   **Storage Path:**
    - Windows: `%APPDATA%/NotScapeExplorer/preferences.json`
    - macOS/Linux: `~/.config/NotScapeExplorer/preferences.json`

### JSON Schema Example
```json
{
  "appearance": {
    "toolbar_mode": "pictures_and_text",
    "underline_links": true
  },
  "navigator": {
    "start_mode": "homepage",
    "homepage_url": "http://localhost:8080/retro-portal",
    "history_expiration_days": 9
  },
  "bookmarks": [
    {
      "title": "Welcome to NotScape",
      "url": "http://localhost:8080/retro-portal"
    },
    {
      "title": "Internet Archive",
      "url": "https://archive.org"
    }
  ]
}
```
If the file does not exist, the browser falls back to the default preferences shown above.
