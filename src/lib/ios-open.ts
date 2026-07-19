// iOS Safari-safe way to open a signed URL in a new tab.
// window.open(url, "_blank") can be blocked (returns null) and Safari can
// then navigate the current tab to the cross-origin URL, which disrupts
// the SPA and the Supabase auth listener. Anchor-click + noopener is
// reliable across iOS/Android/desktop.
export function openInNewTab(url: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  } catch {
    // Last resort — do NOT replace the current tab.
    window.location.assign(url);
  }
}

// Force a download instead of an inline render (nicer on iOS Safari where
// inline PDFs sometimes hijack the tab).
export async function downloadUrl(url: string, filename?: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename || "medsafe-document";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(objUrl); }, 200);
  } catch {
    openInNewTab(url);
  }
}
