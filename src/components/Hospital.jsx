import React, { useState, useEffect, useRef } from "react";
import hospitalBg from "../assets/Indoor/Hospital.jpg";

export default function Hospital({
  onExitHospital,
  state,
  setState,
  selectedAvatar,
  keyboardEnabled,
}) {
  const MAP_W = 736;
  const MAP_H = 736;

  const [player, setPlayer] = useState({ x: 344, y: 623 });
  const containerRef = useRef(null);

  const moveInterval = useRef(null);
  const lastDir = useRef(null);
  const activityTimerRef = useRef(null);
  const currentPerTickEffectRef = useRef(null);

  const [dir, setDir] = useState("idle");
  const [activity, setActivity] = useState(null);
  const [effectType, setEffectType] = useState(null);
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    actions: [],
  });

  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // =============================
  // RESPONSIVE SCALE
  // =============================
  useEffect(() => {
    function updateScale() {
      const width = containerRef.current?.offsetWidth || MAP_W;
      if (window.innerWidth <= 768) {
        setScale(1);
        setIsMobile(true);
      } else {
        setScale(width / MAP_W);
        setIsMobile(false);
      }
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // =============================
  // MOVEMENT
  // =============================
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

  // =============================
  // KEYBOARD
  // =============================
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

  // =============================
  // ACTIVITY SYSTEM
  // =============================
  function perTickEffectMultiple(ticks) {
    if (!currentPerTickEffectRef.current) return;
    for (let i = 0; i < ticks; i++) currentPerTickEffectRef.current();
  }

  function startActivity(name, duration, perTickEffect) {
    setActivity({ name, total: duration, remaining: duration });
    setState((s) => ({ ...s, activitiesDone: s.activitiesDone + 1 }));
    currentPerTickEffectRef.current = perTickEffect;

    if (name === "Checkup") setEffectType("clean-effect");
    else if (name === "Rest") setEffectType("rest-effect");
    else if (name === "Donate Blood") setEffectType("mine-effect");

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
      id: "checkup",
      label: "Checkup",
      x: 258,
      y: 102,
      w: 158,
      h: 164,
      action: () =>
        startActivity("Checkup", 4, () =>
          setState((s) => ({
            ...s,
            hygiene: Math.min(100, s.hygiene + 10),
            money: Math.max(0, s.money - 20),
          }))
        ),
    },
    {
      id: "rest",
      label: "Rest",
      x: 41,
      y: 431,
      w: 232,
      h: 189,
      action: () =>
        startActivity("Rest", 3, () =>
          setState((s) => ({
            ...s,
            sleep: Math.min(100, s.sleep + 20),
            happy: Math.min(100, s.happy + 5),
            hygiene: Math.min(100, s.hygiene - 1),
          }))
        ),
    },
    {
      id: "donate",
      label: "Donate Blood",
      x: 483,
      y: 476,
      w: 213,
      h: 210,
      action: () =>
        startActivity("Donate Blood", 5, () =>
          setState((s) => ({
            ...s,
            money: s.money + 20,
            hygiene: Math.max(0, s.hygiene - 8),
          }))
        ),
    },
    {
      id: "exit",
      label: "Exit Hospital",
      x: 284,
      y: 659,
      w: 150,
      h: 78,
      action: () => onExitHospital(),
    },
  ];

  const getScaledRect = (rect) => {
    const width = containerRef.current?.offsetWidth || MAP_W;
    const height = containerRef.current?.offsetHeight || MAP_H;
    return {
      left: isMobile ? (rect.x / MAP_W) * width : rect.x * scale,
      top: isMobile ? (rect.y / MAP_H) * height : rect.y * scale,
      right: isMobile
        ? ((rect.x + rect.w) / MAP_W) * width
        : (rect.x + rect.w) * scale,
      bottom: isMobile
        ? ((rect.y + rect.h) / MAP_H) * height
        : (rect.y + rect.h) * scale,
    };
  };

  useEffect(() => {
    const playerRect = getScaledRect({
      x: player.x,
      y: player.y,
      w: 40,
      h: 60,
    });
    let inside = null;
    for (const a of areas) {
      if (
        !(
          playerRect.right < getScaledRect(a).left ||
          playerRect.left > getScaledRect(a).right ||
          playerRect.bottom < getScaledRect(a).top ||
          playerRect.top > getScaledRect(a).bottom
        )
      )
        inside = a;
    }
    if (!inside) return setActionPanel({ visible: false });
    setActionPanel({
      visible: true,
      actions: [
        {
          label: inside.id === "exit" ? "Exit Hospital 🚪" : inside.label,
          exec: inside.action,
        },
      ],
    });
  }, [player, scale, isMobile]);

  function showMessage(text) {
    const msg = document.createElement("div");
    msg.className = "random-event-msg";
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  const scaledPlayerRender = {
    x: isMobile
      ? (player.x / MAP_W) * (containerRef.current?.offsetWidth || MAP_W)
      : player.x * scale,
    y: isMobile
      ? (player.y / MAP_H) * (containerRef.current?.offsetHeight || MAP_H)
      : player.y * scale,
  };

  return (
    <div className="hospital-container" ref={containerRef}>
      <div
        className="hospital-map-wrapper"
        style={{
          width: MAP_W,
          height: MAP_H,
          transform: !isMobile ? `scale(${scale})` : "none",
          transformOrigin: "top center",
        }}
      >
        <div
          className="hospital-map"
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${hospitalBg})`,
            backgroundSize: "cover",
            position: "relative",
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
            style={{ left: scaledPlayerRender.x, top: scaledPlayerRender.y }}
          />

          {effectType && (
            <div
              className={`hospital-player-effect ${effectType}`}
              style={{ left: scaledPlayerRender.x, top: scaledPlayerRender.y }}
            />
          )}
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
        <div className="hospital-action-panel">
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
