import { useState } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import { I18nProvider }          from "./context/I18nContext";
import { ThemeProvider }         from "./context/ThemeContext";
import AppHeader                 from "./components/layout/AppHeader";
import EditorView                from "./components/editor/EditorView";
import LiveView                  from "./components/live/LiveView";
import AboutDialog               from "./components/layout/AboutDialog";
import NewGameWizard             from "./components/dialogs/NewGameWizard";
import GameListView              from "./components/home/GameListView";

function AppContent() {
  // "home" | "editor" | "live"
  const [view,          setView]          = useState("home");
  const [sidebarTab,    setSidebarTab]    = useState("map");
  const [role,          setRole]          = useState("Organizátor");
  const [modal,         setModal]         = useState(null);
  const [activeDay,     setActiveDay]     = useState(-1);
  const [activeStage,   setActiveStage]   = useState(-1);
  const [activeEventId, setActiveEventId] = useState(null);

  const { events } = useGame();

  // Resolve active event (may have been deleted)
  const eventData = activeEventId ? events[activeEventId] : null;
  const resolvedId = eventData
    ? activeEventId
    : Object.keys(events)[0] ?? null;
  const resolvedData = resolvedId ? events[resolvedId] : null;

  function handleSetActiveDay(day) {
    setActiveDay(day);
    setActiveStage(-1); // reset stage when day changes
  }

  function openGame(id) {
    setActiveEventId(id);
    setActiveDay(-1);
    setActiveStage(-1);
    setSidebarTab("map");
    setView("editor");
  }

  function goHome() {
    setView("home");
  }

  // ── Home screen ────────────────────────────────────────────────────────────
  if (view === "home") {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <AppHeader
          view={view}
          onGoHome={goHome}
          onNewGame={() => setModal("newgame")}
          onAbout={() => setModal("about")}
        />
        <GameListView onOpenGame={openGame} />
        {modal === "about"   && <AboutDialog   onClose={() => setModal(null)} />}
        {modal === "newgame" && (
          <NewGameWizard
            onClose={() => setModal(null)}
            onCreated={openGame}
          />
        )}
      </div>
    );
  }

  // ── No game selected guard ─────────────────────────────────────────────────
  if (!resolvedData) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        <AppHeader
          view={view}
          onGoHome={goHome}
          onNewGame={() => setModal("newgame")}
          onAbout={() => setModal("about")}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Žádné hry. Vytvořte novou nebo se vraťte na seznam.
            </p>
            <button className="cm-btn-primary" onClick={goHome}>← Zpět na seznam</button>
          </div>
        </div>
        {modal === "newgame" && (
          <NewGameWizard onClose={() => setModal(null)} onCreated={openGame} />
        )}
      </div>
    );
  }

  // ── Editor / Live ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <AppHeader
        view={view}             setView={setView}
        activeDay={activeDay}   setActiveDay={handleSetActiveDay}
        activeStage={activeStage} setActiveStage={setActiveStage}
        activeEventId={resolvedId}
        setActiveEventId={id => { setActiveEventId(id); setActiveDay(-1); setActiveStage(-1); }}
        role={role}             setRole={setRole}
        eventData={resolvedData}
        onGoHome={goHome}
        onNewGame={() => setModal("newgame")}
        onAbout={() => setModal("about")}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-hidden" style={{ background: "var(--bg-base)" }}>
          {view === "editor" && (
            <EditorView
              key={resolvedId}
              sidebarTab={sidebarTab}
              setSidebarTab={setSidebarTab}
              activeDay={activeDay}
              activeStage={activeStage}
              eventId={resolvedId}
              eventData={resolvedData}
              role={role}
            />
          )}
          {view === "live" && (
            <LiveView
              key={resolvedId + role}
              eventId={resolvedId}
              eventData={resolvedData}
              role={role}
            />
          )}
        </main>
      </div>

      {modal === "about"   && <AboutDialog   onClose={() => setModal(null)} />}
      {modal === "newgame" && (
        <NewGameWizard onClose={() => setModal(null)} onCreated={openGame} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
