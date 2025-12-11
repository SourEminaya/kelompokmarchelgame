import React, { useState, useEffect, useRef } from "react";
import mineBg from "../assets/Indoor/Mine.jpg";

export default function Mine({
  onExitMine,
  state,
  setState,
  selectedAvatar,
  keyboardEnabled,
}) {
  const [player, setPlayer] = useState({ x: 522, y: 263 });

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

  const MAP_W = 900;
  const MAP_H = 520;

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

    if (name === "Cleaning Tools") setEffectType("clean-effect");
    else if (name === "Mining Ores") setEffectType("mine-effect");
    else if (name === "Selling Ores") setEffectType("sell-effect");
    else if (name === "Resting") setEffectType("rest-effect");

    activityTimerRef.current = setInterval(() => {
      setActivity((a) => {
        if (!a) return null;

        const left = a.remaining - 1;
        perTickEffect();

        if (left <= 0) {
          clearInterval(activityTimerRef.current);
          showMessage(`${name} finished!`);
          currentPerTickEffectRef.current = null;
          setEffectType(null);
          return null;
        }

        return { ...a, remaining: left };
      });
    }, 1000);
  }

  const areas = [
    {
      id: "clean",
      label: "Clean Tools",
      x: 195,
      y: 1,
      w: 174,
      h: 166,
      action: () =>
        startActivity("Cleaning Tools", 5, () =>
          setState((s) => ({
            ...s,
            hygiene: Math.min(100, s.hygiene + 5),
            happy: Math.min(100, s.happy + 2),
          }))
        ),
    },
    {
      id: "sell",
      label: "Sell Ores",
      x: 455,
      y: 1,
      w: 182,
      h: 111,
      action: () =>
        setState((s) => {
          if (s.ore <= 0) {
            showMessage("You have no ore to sell!");
            return s;
          }

          startActivity("Selling Ores", 4, () =>
            setState((s2) => {
              if (s2.ore <= 0) return s2;
              const inv = { ...s2.inventory };
              inv.ore = Math.max(0, (inv.ore || 0) - 1);
              if (inv.ore <= 0) delete inv.ore;

              return {
                ...s2,
                ore: s2.ore - 1,
                money: s2.money + 20,
                inventory: inv,
                happy: Math.min(100, s2.happy + 1),
              };
            })
          );

          return s;
        }),
    },
    {
      id: "mine",
      label: "Mine Ores",
      x: 33,
      y: 113,
      w: 116,
      h: 159,
      action: () =>
        startActivity("Mining Ores", 8, () =>
          setState((s) => {
            const inv = { ...s.inventory };
            inv.ore = (inv.ore || 0) + 1;

            return {
              ...s,
              ore: s.ore + 1,
              inventory: inv,
              hygiene: s.hygiene - 2,
              happy: s.happy - 3,
            };
          })
        ),
    },
    {
      id: "rest",
      label: "Rest",
      x: 767,
      y: 160,
      w: 98,
      h: 190,
      action: () =>
        startActivity("Resting", 6, () =>
          setState((s) => ({
            ...s,
            sleep: Math.min(100, s.sleep + 6),
            happy: Math.min(100, s.happy + 2),
            hygiene: Math.min(100, s.hygiene - 1),
          }))
        ),
    },
    {
      id: "exit",
      label: "Exit Mine",
      x: 521,
      y: 198,
      w: 82,
      h: 65,
      action: () => onExitMine(),
    },
  ];

  function isOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function move(dir) {
    const speed = 20;

    setPlayer((prev) => {
      let x = prev.x;
      let y = prev.y;

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

  function startHold(dir) {
    lastDir.current = dir;
    move(dir);
    if (moveInterval.current) clearInterval(moveInterval.current);
    moveInterval.current = setInterval(() => move(dir), 120);
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

  useEffect(() => {
    const pRect = {
      left: player.x,
      top: player.y,
      right: player.x + 40,
      bottom: player.y + 60,
    };

    let inside = null;

    for (const a of areas) {
      const rect = {
        left: a.x,
        top: a.y,
        right: a.x + a.w,
        bottom: a.y + a.h,
      };
      if (isOverlap(pRect, rect)) inside = a;
    }

    if (!inside) {
      setActionPanel({ visible: false });
      return;
    }

    setActionPanel({
      visible: true,
      actions: [
        {
          label: inside.id === "exit" ? "Exit Mine 🚪" : inside.label,
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
    <div className="mine-container" ref={containerRef}>
      <div
        className="mine-map-wrapper"
        style={{
          width: MAP_W,
          height: MAP_H,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="mine-map"
          ref={mapRef}
          style={{
            width: MAP_W,
            height: MAP_H,
            backgroundImage: `url(${mineBg})`,
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
        <button
          className="mine-controls-button"
          onMouseDown={() => startHold("up")}
          onMouseUp={stopHold}
        >
          ▲
        </button>

        <div className="controls-row">
          <button
            className="mine-controls-button"
            onMouseDown={() => startHold("left")}
            onMouseUp={stopHold}
          >
            ◀
          </button>

          <button
            className="mine-controls-button"
            onMouseDown={() => startHold("down")}
            onMouseUp={stopHold}
          >
            ▼
          </button>

          <button
            className="mine-controls-button"
            onMouseDown={() => startHold("right")}
            onMouseUp={stopHold}
          >
            ▶
          </button>
        </div>
      </div>

      {effectType && (
        <div
          className={`mine-player-effect ${effectType}`}
          style={{
            left: player.x * scale,
            top: player.y * scale,
          }}
        ></div>
      )}

      {activity && (
        <div className="box mine-activity-overlay">
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
        <div className="mine-action-panel">
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
