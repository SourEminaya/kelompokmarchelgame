import React, { useState, useEffect, useRef } from "react";
import homeBg from "../assets/Indoor/Home.jpeg";

export default function Home({
  onExitHome,
  state,
  setState,
  selectedAvatar,
  keyboardEnabled,
}) {
  const [player, setPlayer] = useState({ x: 188, y: 448 });

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const activityTimerRef = useRef(null);
  const moveInterval = useRef(null);
  const lastDir = useRef(null);

  const [dir, setDir] = useState("idle");
  const [activity, setActivity] = useState(null);

  const [actionPanel, setActionPanel] = useState({
    visible: false,
    actions: [],
  });

  const [effectType, setEffectType] = useState(null);
  const currentPerTickEffectRef = useRef(null);

  const MAP_W = 736;
  const MAP_H = 552;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      const newScale = containerWidth / MAP_W;
      setScale(newScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  function perTickEffectMultiple(ticks) {
    if (!currentPerTickEffectRef.current) return;
    for (let i = 0; i < ticks; i++) currentPerTickEffectRef.current();
  }

  function startActivity(name, duration, perTickEffect) {
    setActivity({ name, total: duration, remaining: duration });

    setState((s) => ({ ...s, activitiesDone: s.activitiesDone + 1 }));

    currentPerTickEffectRef.current = perTickEffect;

    if (name === "Bathing") setEffectType("bath-effect");
    else if (name === "Sleeping") setEffectType("sleep-effect");
    else if (name === "Eating") setEffectType("eat-effect");
    else if (name === "Relaxing") setEffectType("relax-effect");

    activityTimerRef.current = setInterval(() => {
      setActivity((a) => {
        if (!a) return null;

        const left = a.remaining - 1;
        perTickEffect();

        if (left <= 0) {
          clearInterval(activityTimerRef.current);
          currentPerTickEffectRef.current = null;
          setEffectType(null);
          showMessage(`${name} finished!`);
          return null;
        }

        return { ...a, remaining: left };
      });
    }, 1000);
  }

  const areas = [
    {
      id: "bath",
      label: "Bathroom",
      x: 42,
      y: 42,
      w: 42,
      h: 42,
      action: () =>
        startActivity("Bathing", 8, () =>
          setState((s) => ({
            ...s,
            hygiene: Math.min(100, s.hygiene + 5),
            happy: s.happy + 0.5,
          }))
        ),
    },

    {
      id: "sleep",
      label: "Bed",
      x: 91,
      y: 184,
      w: 47,
      h: 92,
      action: () =>
        startActivity("Sleeping", 10, () =>
          setState((s) => ({
            ...s,
            sleep: s.sleep + 4,
            happy: s.happy + 0.8,
            hygiene: s.hygiene - 1,
          }))
        ),
    },

    {
      id: "eat",
      label: "Dining Table",
      x: 274,
      y: 373,
      w: 93,
      h: 133,
      action: () =>
        startActivity("Eating", 6, () =>
          setState((s) => ({ ...s, meal: s.meal + 6, happy: s.happy + 1 }))
        ),
    },

    {
      id: "relax",
      label: "Relax Zone",
      x: 460,
      y: 367,
      w: 234,
      h: 142,
      action: () =>
        startActivity("Relaxing", 5, () =>
          setState((s) => ({ ...s, happy: s.happy + 4 }))
        ),
    },

    {
      id: "exit",
      label: "Exit Door",
      x: 186,
      y: 508,
      w: 43,
      h: 43,
      action: () => onExitHome(),
    },
  ];

  function move(dir) {
    const speed = 20;

    setPlayer((prev) => {
      let { x, y } = prev;

      if (dir === "up") y -= speed;
      if (dir === "down") y += speed;
      if (dir === "left") x -= speed;
      if (dir === "right") x += speed;

      x = Math.max(0, Math.min(MAP_W - 40, x));
      y = Math.max(0, Math.min(MAP_H - 60, y));

      setDir(
        dir === "up"
          ? "back"
          : dir === "down"
          ? "idle"
          : dir === "right"
          ? "right"
          : "left"
      );

      return { x, y };
    });
  }

  function startHold(d) {
    lastDir.current = d;
    move(d);
    if (moveInterval.current) clearInterval(moveInterval.current);
    moveInterval.current = setInterval(() => move(d), 120);
  }

  function stopHold() {
    if (moveInterval.current) clearInterval(moveInterval.current);
    moveInterval.current = null;
  }

  function onKeyDown(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
      e.preventDefault();
    if (e.repeat) return;

    if (e.key === "ArrowUp") startHold("up");
    if (e.key === "ArrowDown") startHold("down");
    if (e.key === "ArrowLeft") startHold("left");
    if (e.key === "ArrowRight") startHold("right");
  }
  function onKeyUp() {
    stopHold();
  }

  useEffect(() => {
    if (!keyboardEnabled) return;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keyboardEnabled]);

  function isOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  useEffect(() => {
    const pRect = {
      left: player.x,
      top: player.y,
      right: player.x + 40,
      bottom: player.y + 60,
    };

    let inside = null;

    for (const a of areas) {
      const aRect = {
        left: a.x,
        top: a.y,
        right: a.x + a.w,
        bottom: a.y + a.h,
      };
      if (isOverlap(pRect, aRect)) inside = a;
    }

    if (!inside) {
      setActionPanel({ visible: false });
      return;
    }

    setActionPanel({
      visible: true,
      actions: [
        {
          label: inside.id === "exit" ? "Exit Home 🚪" : `Use ${inside.label}`,
          exec: inside.action,
        },
      ],
    });
  }, [player]);

  function showMessage(text) {
    const msg = document.createElement("div");
    msg.className = "random-event-msg";
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  return (
    <div className="home-container" ref={containerRef}>
      <div
        className="home-map-wrapper"
        style={{
          width: MAP_W,
          height: MAP_H,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="home-map"
          ref={mapRef}
          style={{
            backgroundImage: `url(${homeBg})`,
          }}
        >
          <img
            src={
              dir === "left"
                ? selectedAvatar.left
                : dir === "right"
                ? selectedAvatar.right
                : dir === "back"
                ? selectedAvatar.back
                : selectedAvatar.idle
            }
            className="player-avatar"
            style={{
              left: player.x,
              top: player.y,
            }}
          />
        </div>
      </div>

      <div className="controls">
        <button onMouseDown={() => startHold("up")} onMouseUp={stopHold}>
          ▲
        </button>

        <div>
          <button onMouseDown={() => startHold("left")} onMouseUp={stopHold}>
            ◀
          </button>
          <button onMouseDown={() => startHold("down")} onMouseUp={stopHold}>
            ▼
          </button>
          <button onMouseDown={() => startHold("right")} onMouseUp={stopHold}>
            ▶
          </button>
        </div>
      </div>

      {effectType && (
        <div
          className={`player-effect ${effectType}`}
          style={{
            left: player.x * scale,
            top: player.y * scale,
          }}
        ></div>
      )}

      {activity && (
        <div className="box activity-overlay">
          <h2>{activity.name}</h2>
          <div>
            {activity.remaining} / {activity.total}
          </div>

          <button
            className="fast-forward-btn"
            onClick={() => {
              clearInterval(activityTimerRef.current);
              perTickEffectMultiple(activity.remaining);
              setActivity(null);
              setEffectType(null);
              showMessage(`${activity.name} completed instantly!`);
            }}
          >
            Fast Forward ⏩
          </button>
        </div>
      )}

      {actionPanel.visible && (
        <div className="home-action-panel">
          {actionPanel.actions.map((a, i) => (
            <button key={i} className="action-btn" onClick={a.exec}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
