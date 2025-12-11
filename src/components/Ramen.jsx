import React, { useState, useEffect, useRef } from "react";
import ramenBg from "../assets/Indoor/Ramen.jpg";

export default function Ramen({
  onExitRamen,
  state,
  setState,
  selectedAvatar,
  keyboardEnabled,
}) {
  const [player, setPlayer] = useState({ x: 193, y: 454 });
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const activityTimerRef = useRef(null);
  const moveInterval = useRef(null);
  const lastDir = useRef(null);
  const currentPerTickEffectRef = useRef(null);

  const [dir, setDir] = useState("idle");
  const [activity, setActivity] = useState(null);
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    actions: [],
  });
  const [effectType, setEffectType] = useState(null);

  const MAP_W = 720;
  const MAP_H = 562;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      setScale(containerWidth / MAP_W);
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

    if (name === "Buy Ramen") setEffectType("eat-effect");
    else if (name === "Chat with Owner") setEffectType("chat-effect");
    else if (name === "Work Part Time") setEffectType("work-effect");

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
      id: "buy",
      label: "Buy Ramen",
      x: 475,
      y: 110,
      w: 242,
      h: 355,
      action: () =>
        startActivity("Buy Ramen", 4, () =>
          setState((s) => ({
            ...s,
            meal: Math.min(100, s.meal + 20),
            money: Math.max(0, s.money - 10),
          }))
        ),
    },
    {
      id: "chat",
      label: "Chat with Owner",
      x: 7,
      y: 381,
      w: 134,
      h: 153,
      action: () =>
        startActivity("Chat with Owner", 3, () =>
          setState((s) => ({ ...s, happy: Math.min(100, s.happy + 5) }))
        ),
    },
    {
      id: "work",
      label: "Work Part Time",
      x: 5,
      y: 124,
      w: 417,
      h: 219,
      action: () =>
        startActivity("Work Part Time", 6, () =>
          setState((s) => ({
            ...s,
            money: s.money + 20,
            happy: Math.min(100, s.happy - 2),
            meal: Math.max(0, s.meal - 5),
          }))
        ),
    },
    {
      id: "exit",
      label: "Exit Ramen Shop",
      x: 160,
      y: 508,
      w: 105,
      h: 51,
      action: () => onExitRamen(),
    },
  ];

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
      setActionPanel({ visible: false, actions: [] });
      return;
    }
    setActionPanel({
      visible: true,
      actions: [
        {
          label: inside.id === "exit" ? "Exit Ramen Shop 🚪" : inside.label,
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
    <div className="ramen-container" ref={containerRef}>
      <div
        className="ramen-map-wrapper"
        style={{
          width: MAP_W,
          height: MAP_H,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="ramen-map"
          ref={mapRef}
          style={{ backgroundImage: `url(${ramenBg})` }}
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
            style={{ left: player.x, top: player.y }}
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
          className={`ramen-player-effect ${effectType}`}
          style={{ left: player.x * scale, top: player.y * scale }}
        />
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
        <div className="ramen-action-panel box">
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
