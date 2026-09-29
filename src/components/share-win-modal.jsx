// Share-your-win modal: previews the generated win card and shares it
// through the native share sheet, with save-image / copy-text fallbacks.
import { drawWinCard, buildWinShareText, winCardFilename, sharePngFile, downloadPng, copyText, canShareFiles } from "./share-card.js";

export function ShareWinModal({ winText, onClose }) {
  const clean = String(winText || "").trim().slice(0, 280);
  const canvasRef = React.useRef(null);
  const dialogRef = React.useRef(null);
  const [phase, setPhase] = React.useState("preview"); // preview | shared | error
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const nativeShare = canShareFiles();

  React.useEffect(() => {
    try {
      if (canvasRef.current) drawWinCard(canvasRef.current, { winText: clean });
    } catch (err) { console.warn("PlushLife: win card render failed", err); }
  }, [clean]);

  React.useEffect(() => {
    if (phase !== "shared") return;
    const timer = window.setTimeout(() => { if (onClose) onClose(); }, 1400);
    return () => window.clearTimeout(timer);
  }, [phase, onClose]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap: move focus into dialog on mount, restore on unmount
  React.useEffect(() => {
    const previouslyFocused = document.activeElement;
    if (dialogRef.current) {
      const firstButton = dialogRef.current.querySelector("button");
      if (firstButton) firstButton.focus();
    }
    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        try { previouslyFocused.focus(); } catch (_e) { /* silent: element may have been removed */ }
      }
    };
  }, []);

  const getCanvas = () => {
    if (canvasRef.current) return canvasRef.current;
    const fallback = document.createElement("canvas");
    drawWinCard(fallback, { winText: clean });
    return fallback;
  };

  const doShare = async () => {
    setBusy(true);
    setNotice("");
    try {
      const result = await sharePngFile({
        canvas: getCanvas(),
        filename: winCardFilename(),
        title: "My one good thing",
        text: buildWinShareText(clean),
      });
      if (result === "shared") {
        setPhase("shared");
      } else if (result === "dismissed") {
        // User closed the sheet — stay put, nothing to report.
      } else {
        setNotice("Your device can't share images directly — save it or copy the text instead.");
      }
    } catch (err) {
      console.warn("PlushLife: share failed", err);
      setPhase("error");
    } finally {
      setBusy(false);
    }
  };

  const doSave = async () => {
    setBusy(true);
    try {
      await downloadPng(getCanvas(), winCardFilename());
      setNotice("Saved — check your photos. 💜");
    } catch (err) {
      console.warn("PlushLife: image save failed", err);
      setNotice("Couldn't save the image on this device.");
    } finally {
      setBusy(false);
    }
  };

  const doCopy = async () => {
    const ok = await copyText(buildWinShareText(clean));
    setNotice(ok ? "Copied — paste it anywhere. 💜" : "Couldn't copy on this device.");
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Share your win" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.5)", backdropFilter: "blur(5px)" }}>
      <div ref={dialogRef} onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 380px)", maxHeight: "min(92vh, 780px)", overflowY: "auto", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)", padding: "20px 18px" }}>
        {phase === "shared" ? (
          <div style={{ textAlign: "center", padding: "34px 10px" }} role="status">
            <div style={{ fontSize: 44 }} aria-hidden="true">💜</div>
            <div style={{ marginTop: 10, fontSize: 17, fontWeight: 900, color: "#3E2458" }}>Shared!</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#6B5A7D", lineHeight: 1.55 }}>Thanks for carrying a little softness<br />out into the world.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>SHARE YOUR WIN</div>
            <div style={{ marginTop: 4, fontSize: 17, fontWeight: 900, color: "#3E2458" }}>This one's worth celebrating 🌟</div>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.55, color: "#8C6B9E" }}>
              Heads up: sharing posts this outside your private journal. Only share what you're happy posting publicly.
            </p>
            <div style={{ marginTop: 12, borderRadius: 18, overflow: "hidden", border: "1px solid #E4CFF0", boxShadow: "0 10px 28px rgba(101,63,115,.12)" }}>
              <canvas ref={canvasRef} width={1080} height={1350} style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
            {notice && <div role="status" aria-live="polite" style={{ marginTop: 10, fontSize: 12.5, color: "#6B5A7D", lineHeight: 1.5 }}>{notice}</div>}
            {phase === "error" && <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: "#A4446B" }}>Something went wrong making the image — you can still copy the text below.</div>}
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              {nativeShare && (
                <button type="button" onClick={doShare} disabled={busy} aria-busy={busy} style={{ padding: "13px 16px", minHeight: 48, borderRadius: 14, border: 0, background: "linear-gradient(135deg,#B95DCA,#DB78BF)", color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
                  {busy ? "Working…" : "Share 💜"}
                </button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={doSave} disabled={busy} aria-busy={busy} style={{ flex: 1, padding: "11px 10px", minHeight: 46, borderRadius: 14, border: "1px solid #D994E7", background: "white", color: "#75428C", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                  Save image
                </button>
                <button type="button" onClick={doCopy} style={{ flex: 1, padding: "11px 10px", minHeight: 46, borderRadius: 14, border: "1px solid #D994E7", background: "white", color: "#75428C", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                  Copy text
                </button>
              </div>
              <button type="button" onClick={onClose} style={{ padding: "10px", borderRadius: 12, border: 0, background: "transparent", color: "#8C6B9E", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                Keep it private
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
