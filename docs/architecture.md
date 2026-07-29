# Browser Engine and Platform Specification

This document details the architectural decisions and system design for **Notscape Nostalgia Gold(ish)**, focusing on the runtime environment and browser rendering engine.

## 1. Browser Engine Analysis

To construct a functioning browser wrapper, we must choose a runtime platform that can render modern web pages while giving the container full control over navigation history, request headers, cookies, and visual layout.

Three primary options were evaluated:

### Option A: Electron (Recommended)
*   **Rendering Core:** Chromium (Blink & V8 engine, packaged with the application).
*   **Integration Model:** Uses the `<webview>` tag, which runs the guest page in a separate sandboxed process.
*   **Pros:**
    - **Total UI Customization:** The browser chrome (menus, toolbars, retro styling) can be built using HTML/CSS/JS and wrap around the `<webview>` container.
    - **Header Manipulation:** Easy to intercept requests to mock the user agent (e.g., pretending to be `Mozilla/3.0 (Win95; I)`) and manage cookies.
    - **Robust Control APIs:** Simple APIs to manage back/forward navigation, listen to load events, toggle developer tools, and capture load progress.
    - **File Access:** Straightforward access to local files for configuration storage or opening local HTML files in the browser.
*   **Cons:** Large download footprint (~80-100MB) and high memory usage (Chromium overhead).

### Option B: Tauri
*   **Rendering Core:** System webview (WebView2 on Windows, WebKitGTK on Linux, WebKit/Safari on macOS).
*   **Integration Model:** Native multi-window layouts or system webview injection.
*   **Pros:** Tiny distribution size (~5-10MB) and lower memory utilization.
*   **Cons:**
    - Managing a web-based chrome interface alongside a native guest page is extremely complex in Tauri. Overlaying native webviews or configuring sub-windows lacks uniform cross-platform support.
    - Restricted APIs for overriding cross-origin header rules and intercepting sub-frame web requests.

### Option C: Pure Web-Based Simulator (Iframe-Based)
*   **Rendering Core:** Host browser engine.
*   **Integration Model:** Standard HTML `<iframe>` element.
*   **Pros:** No installation required; runs directly in any modern browser.
*   **Cons:**
    - **Fatal Limitation:** Almost all modern websites block iframe embedment via `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`.
    - **Proxy Overhead:** Bypassing this restriction requires routing all traffic through a custom proxy server that strips headers and rewrites HTML links. This breaks dynamic JavaScript, secure sessions, and authentication.

---

## 2. Selected Architecture: Electron + Chromium `<webview>`

Based on the evaluation and finalized design choices:
*   **Platform Runtime:** **Electron** is selected to host the application.
*   **Codebase Structure:** **Vanilla JavaScript** (with standard HTML5/CSS3) will be used to build the browser frame UI for optimal load speeds, light memory consumption, and pixel-perfect styling.
*   **Interface menus:** Standard OS-native menu bars are bypassed in favor of **custom HTML-based menus** inside the page frame, allowing a cross-platform emulation of Windows 95 menu behaviors.
*   **Configuration & Bookmarks:** Bookmarks and browser options are stored in a simple, flat JSON format (`preferences.json`).

```mermaid
graph LR
    subgraph Main Process
        M[Main Process main.js]
        M -->|Manages| W1[Browser Window]
        M -->|Config| S[Preferences Storage]
    end
    
    subgraph Renderer Process (Browser Chrome)
        W1 -->|Loads| C[Chrome UI index.html]
        C -->|Controls| WV[Chromium <webview>]
    end
    
    subgraph Guest Process (Web Page)
        WV -->|Renders| G[External Website]
    end
    
    C <-->|IPC / Preload| M
```

### Process Separation and Security
1.  **Main Process (`main.js`):** Runs in a Node.js context. It manages window lifecycles and configuration read/writes.
2.  **Renderer Process (Chrome UI):** Displays the retro Netscape browser skin. Runs with `nodeIntegration: false` and `contextIsolation: true` for security, communicating with the Main process via IPC using a safe `preload.js` bridge.
3.  **Guest Webview:** Completely isolated from Node.js. It behaves like a standard web browser tab, executing sandboxed client-side script in a secure partition.

---

## 3. Webview Control API Integration

The retro UI will drive navigation by hook-binding events to the `<webview>` element:

| Native WebView Event | Retro UI Reaction |
| :--- | :--- |
| `did-start-loading` | Start playing the meteor-shower animation on the Netscape "N" logo. |
| `did-stop-loading` | Stop logo animation. Update status bar to "Document: Done". |
| `page-title-updated` | Update the window title bar format: `[Page Title] - Notscape Nostalgia Gold(ish)`. |
| `will-navigate` / `did-navigate` | Update URL text in the location bar. Push url into history stack. Update status bar message. |
| `update-target-url` | Update status bar with link preview when hovering over anchor tags. |
| `new-window` | Intercept and open in a new Notscape Nostalgia Gold(ish) window instead of a default browser. |

---

## 4. Nostalgic User Agent Mocking

To complete the retro experience, the browser engine will allow the user to select their User-Agent. By default, it will inject a custom user-agent header that resembles historical strings, while maintaining fallback modern browser tokens so modern servers still accept the traffic:

*   *Default Retro UA String:*
    `Mozilla/5.0 (Linux; x86_64; Notscape Nostalgia Gold(ish)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
