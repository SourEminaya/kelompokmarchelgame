import React, { useState, useEffect, useRef } from "react";
import dungeonBg from "../assets/Indoor/Dungeon.jpg";

export default function Dungeon({
  onExitDungeon,
  state,
  setState,
  selectedAvatar,
  keyboardEnabled,
}) {
  const MAP_W = 925;
  const MAP_H = 529;

  const [player, setPlayer] = useState({ x: 623, y: 235 });
  const containerRef = useRef(null);

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

  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    function updateScale() {
      const containerWidth = containerRef.current?.offsetWidth || MAP_W;
      const containerHeight = containerRef.current?.offsetHeight || MAP_H;

      if (window.innerWidth <= 768) {
        setScale(1); // CSS mobile sudah mengatur
        setIsMobile(true);
      } else {
        setScale(Math.min(containerWidth / MAP_W, containerHeight / MAP_H));
        setIsMobile(false);
      }
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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

  const areas = [
    {
      id: "fight",
      label: "Fight",
      x: 109,
      y: 360,
      w: 159,
      h: 109,
      action: () =>
        startActivity("Fight", 5, () =>
          setState((s) => ({
            ...s,
            happy: Math.min(100, s.happy + 4),
            hygiene: Math.min(100, s.hygiene - 5),
          }))
        ),
    },
    {
      id: "loot",
      label: "Loot",
      x: 623,
      y: 366,
      w: 161,
      h: 127,
      action: () =>
        startActivity("Loot", 4, () =>
          setState((s) => ({ ...s, money: s.money + 15 }))
        ),
    },
    {
      id: "explore",
      label: "Explore",
      x: 5,
      y: 5,
      w: 192,
      h: 165,
      action: () =>
        startActivity("Explore", 6, () =>
          setState((s) => ({
            ...s,
            happy: Math.min(100, s.happy + 5),
            hygiene: Math.min(100, s.hygiene - 1),
          }))
        ),
    },
    {
      id: "exit",
      label: "Exit Dungeon",
      x: 277,
      y: 37,
      w: 121,
      h: 98,
      action: () => onExitDungeon(),
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
      const areaRect = getScaledRect(a);
      if (
        !(
          playerRect.right < areaRect.left ||
          playerRect.left > areaRect.right ||
          playerRect.bottom < areaRect.top ||
          playerRect.top > areaRect.bottom
        )
      )
        inside = a;
    }

    if (!inside) return setActionPanel({ visible: false });
    setActionPanel({
      visible: true,
      actions: [
        {
          label: inside.id === "exit" ? "Exit Dungeon 🚪" : inside.label,
          exec: inside.action,
        },
      ],
    });
  }, [player, scale, isMobile]);

  function perTickEffectMultiple(ticks) {
    if (!currentPerTickEffectRef.current) return;
    for (let i = 0; i < ticks; i++) currentPerTickEffectRef.current();
  }

  function startActivity(name, duration, perTickEffect) {
    setActivity({ name, total: duration, remaining: duration });
    setState((s) => ({ ...s, activitiesDone: s.activitiesDone + 1 }));
    currentPerTickEffectRef.current = perTickEffect;

    if (name === "Fight") setEffectType("attack-effect");
  else if (name === "Loot") setEffectType("gold-effect");
  else if (name === "Explore") setEffectType("explore-effect");
  else setEffectType(null);

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

  function showMessage(text) {
    const msg = document.createElement("div");
    msg.className = "random-event-msg";
    msg.textContent = tsext;
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
    <div className="dungeon-container" ref={containerRef}>
      <div
        className="dungeon-map-wrapper"
        style={{
          width: MAP_W,
          height: MAP_H,
          transform: !isMobile ? `scale(${scale})` : "none",
          transformOrigin: "top center",
        }}
      >
        <div
          className="dungeon-map"
          style={{ backgroundImage: `url(${dungeonBg})` }}
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
              className={`dungeon-player-effect ${effectType}`}
              style={{
                left: scaledPlayerRender.x,
                top: scaledPlayerRender.y,
              }}
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
        <div className="dungeon-action-panel">
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
