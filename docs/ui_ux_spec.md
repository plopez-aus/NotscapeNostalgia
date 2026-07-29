# Interface Layout and Visual Design Specification

This document details the UI/UX design specifications for **Notscape Nostalgia Gold(ish)**, recreating the classic mid-90s Windows 95 and Netscape Navigator 3.x styling using modern web standards.

## 1. Visual Theme and Styling System

The user interface utilizes a retro-flat-3D theme (often called the Windows 95 or Classic UI style). It relies on solid gray tones and sharp light/dark bevel borders to create depth.

### Color Palette

| Name | Color Value | CSS Variable | Purpose |
| :--- | :--- | :--- | :--- |
| Window Gray | `#d4d0c8` or `#c0c0c0` | `--win-gray` | Main background color for frames, panels, and menu bars. |
| Bevel Highlight | `#ffffff` | `--bevel-light`| Top and left borders of raised elements. |
| Bevel Shadow | `#808080` | `--bevel-shadow`| Bottom and right borders of raised elements. |
| Bevel Dark Shadow | `#404040` | `--bevel-dark`  | Outer bottom/right shadow for deep 3D effects. |
| Window White | `#ffffff` | `--win-white`   | Background for URL inputs, search fields, and guest page wrapper. |
| Menu Text | `#000000` | `--text-color`  | Standard text color. |
| Hyperlink Blue | `#0000ee` | `--link-color`  | Standard unvisited links. |
| Netscape Blue | `#000080` | `--navy-blue`   | Retro header accent/active title bars. |

### Bevel Border Utilities (CSS Classes)
To maintain visual consistency, UI elements use specific border shadow rules:

```css
/* Raised Bevel (Buttons, Toolbars) */
.bevel-outset {
  border-top: 1.5px solid var(--bevel-light);
  border-left: 1.5px solid var(--bevel-light);
  border-bottom: 1.5px solid var(--bevel-shadow);
  border-right: 1.5px solid var(--bevel-shadow);
  background-color: var(--win-gray);
}

/* Deep Outset (Default Windows 95 command buttons) */
.bevel-outset-deep {
  border-top: 2px solid var(--bevel-light);
  border-left: 2px solid var(--bevel-light);
  border-bottom: 2px solid var(--bevel-dark);
  border-right: 2px solid var(--bevel-dark);
  box-shadow: inset -1px -1px 0 var(--bevel-shadow), inset 1px 1px 0 var(--bevel-light);
}

/* Inset Bevel (Text Fields, Status Windows, Content Area wrapper) */
.bevel-inset {
  border-top: 2px solid var(--bevel-shadow);
  border-left: 2px solid var(--bevel-shadow);
  border-bottom: 2px solid var(--bevel-light);
  border-right: 2px solid var(--bevel-light);
  background-color: var(--win-white);
}
```

### Typography
- **UI Element Font:** Standard system default sans-serif font stack representing legacy system interfaces:
  `font-family: "MS Sans Serif", "Tahoma", "Segoe UI", -apple-system, sans-serif; font-size: 12px;`
- **Browsing Default Serif:** Standard HTML text in 1996 rendered in Times New Roman. The system will set default serif options for basic HTML views:
  `font-family: "Times New Roman", Times, Georgia, serif;`

---

## 2. Layout Structure

The main browser window is structured in a vertical stack:

```
+--------------------------------------------------------------+
| [Title Bar] Page Title - Notscape Nostalgia Gold(ish)         |
+--------------------------------------------------------------+
| [Menu Bar] File  Edit  View  Go  Bookmarks  Options ... Help |
+--------------------------------------------------------------+
| [Main Toolbar]                                   +---------+ |
| [Back] [Forward] [Home] [Reload] [Stop]           | Throbber| |
|                                                  +---------+ |
+--------------------------------------------------------------+
| [Location Bar] Netsite: [ url input text field           |V] |
+--------------------------------------------------------------+
| [Directory Buttons]                                          |
| [What's New?] [What's Cool?] [Net Search] [People] [Software]|
+--------------------------------------------------------------+
|                                                              |
|                     [Browser Web View]                       |
|                                                              |
+--------------------------------------------------------------+
| [Status Bar] Loading... [=========     ] [Security Padlock]  |
+--------------------------------------------------------------+
```

### Key Components:

1. **Title Bar:**
   - Dark blue gradient/solid background (`#000080` to `#1080d0`).
   - White bold title text.
   - Standard minimize, maximize, and close buttons on the right.

2. **Menu Bar:**
   - Rendered using **Custom HTML-based elements** inside the application canvas (bypassing the host OS native menu wrapper) to ensure Windows 95 visual consistency on all operating systems.
   - Standard dropdowns: **File**, **Edit**, **View**, **Go**, **Bookmarks**, **Options**, **Directory**, **Window**, **Help**.
   - Keyboard mnemonics are styled with underlines (e.g. `<u>F</u>ile`).
   - Dropdown options appear in a raise-beveled box with a standard grey background.

3. **Main Toolbar:**
   - Houses the core navigation buttons. Each button features a beveled grey background, an icon on top, and descriptive text underneath.
   - Core buttons:
     - **Back:** Navigates back in current session history.
     - **Forward:** Navigates forward in history.
     - **Home:** Navigates to configured homepage.
     - **Reload:** Refreshes the web view contents.
     - **Open:** Prompts for URL input (or local file paths).
     - **Print:** Prints the current web page.
     - **Find:** Searches text inside the web view.
     - **Stop:** Aborts active request/download.
   - **Classic Animated Logo (Throbber):** 
     - Positioned at the far right.
     - Loops an animation of meteor showers hitting the "N" logo during network loads.
     - Serves as a link: clicking the logo navigates back to the homepage.

4. **Location/URL Bar:**
   - Standard label: `Netsite:` if loading over secure HTTPS, `Location:` if HTTP.
   - The URL input field uses an inset bevel border.
   - History dropdown icon on the right lists the last 10 visited URLs.

5. **Directory Buttons:**
   - Shortcut row for retro destinations.
   - Flat beveled buttons styled with standard dark blue font coloring.
   - Links lead to specific nostalgic portals (e.g., `What's Cool?` goes to a curated list of retro websites or Web 1.0 mirrors).

6. **Status Bar:**
   - Divided into three sections:
     - **Status Text:** Left aligned, showing download details or URL hover previews.
     - **Progress Indicator:** Inset progress container displaying green rectangular ticks representing download percentage.
     - **Security Key/Padlock:**
       - Uses the iconic Netscape security indicator: A gold padlock on a dark blue background.
       - A closed shackle indicates secure HTTPS connection; an open shackle indicates insecure HTTP connection.
