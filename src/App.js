import { useEffect, useRef, useState } from "react";
import Home from "./components/Home";
import Mine from "./components/Mine";
import Dungeon from "./components/Dungeon";
import Ramen from "./components/Ramen";
import Hospital from "./components/Hospital";

import bgImg from "./assets/Outdoor/bg/utama.jpg";

import homeImg from "./assets/Outdoor/places/home.png";
import dungeonImg from "./assets/Outdoor/places/dungeon.png";
import mineImg from "./assets/Outdoor/places/mining.png";
import ramenImg from "./assets/Outdoor/places/ramen.png";
import hospitalImg from "./assets/Outdoor/places/hospital.png";

import char1Idle from "./assets/Outdoor/char1/idle.png";
import char1Left from "./assets/Outdoor/char1/kiri.png";
import char1Right from "./assets/Outdoor/char1/kanan.png";
import char1Back from "./assets/Outdoor/char1/back.png";

import char2Idle from "./assets/Outdoor/char2/idle.png";
import char2Left from "./assets/Outdoor/char2/kiri.png";
import char2Right from "./assets/Outdoor/char2/kanan.png";
import char2Back from "./assets/Outdoor/char2/back.png";

import char3Idle from "./assets/Outdoor/char3/idle.png";
import char3Left from "./assets/Outdoor/char3/kiri.png";
import char3Right from "./assets/Outdoor/char3/kanan.png";
import char3Back from "./assets/Outdoor/char3/back.png";

import char4Idle from "./assets/Outdoor/char4/idle.png";
import char4Left from "./assets/Outdoor/char4/kiri.png";
import char4Right from "./assets/Outdoor/char4/kanan.png";
import char4Back from "./assets/Outdoor/char4/back.png";

import char5Idle from "./assets/Outdoor/char5/idle.png";
import char5Left from "./assets/Outdoor/char5/kiri.png";
import char5Right from "./assets/Outdoor/char5/kanan.png";
import char5Back from "./assets/Outdoor/char5/back.png";

import char6Idle from "./assets/Outdoor/char6/idle.png";
import char6Left from "./assets/Outdoor/char6/kiri.png";
import char6Right from "./assets/Outdoor/char6/kanan.png";
import char6Back from "./assets/Outdoor/char6/back.png";

import LoginScreen from "./LoginScreen";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  saveProgressToFirebase,
  loadProgressFromFirebase,
} from "./firebaseSave";

const DEFAULT_STATE = {
  meal: 50,
  sleep: 50,
  hygiene: 50,
  happy: 50,
  money: 50,
  bandage: 0,
  inventory: {},

  activitiesDone: 0,
  itemsCollected: 0,
  itemsUsed: 0,
  visitedAreas: [],

  ore: 0,
};

function preloadImages(srcArray) {
  srcArray.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function pxToPercent(leftPx, topPx) {
  const map = document.getElementById("map");
  if (!map) return { leftPercent: 0, topPercent: 0 };

  const rect = map.getBoundingClientRect();
  return {
    leftPercent: (leftPx / rect.width) * 100,
    topPercent: (topPx / rect.height) * 100,
  };
}

function Header({
  timeText,
  greeting,
  onInventoryClick,
  money,
  user,
  onLoginClick,
  onLogoutClick,
}) {
  return (
    <header className="header">
      <div className="left">
        {/* Tombol login/logout */}
        {user ? (
          <button id="auth-btn" onClick={onLogoutClick}>
            Logout
          </button>
        ) : (
          <button id="auth-btn" onClick={onLoginClick}>
            Login
          </button>
        )}
        <div id="greeting">{greeting}</div>
        <div id="time">{timeText}</div>
      </div>
      <div className="title">UMN RPG Adventure Life</div>
      <div className="right">
        <button id="inventory-btn" onClick={onInventoryClick}>
          📦 Inventory
        </button>
        <div id="money">💰 {money}</div>
      </div>
    </header>
  );
}

function StatusPanel({ state }) {
  return (
    <aside id="status" className="status">
      <div className="stat">
        <div className="label">
          Meal 🍜 <span id="meal-val">{state.meal.toFixed(1)}</span>%
        </div>
        <div className="bar">
          <div id="meal-bar" style={{ width: state.meal + "%" }} />
        </div>
      </div>
      <div className="stat">
        <div className="label">
          Sleep 😴 <span id="sleep-val">{state.sleep.toFixed(1)}</span>%
        </div>
        <div className="bar">
          <div id="sleep-bar" style={{ width: state.sleep + "%" }} />
        </div>
      </div>
      <div className="stat">
        <div className="label">
          Hygiene 🧼 <span id="hygiene-val">{state.hygiene.toFixed(1)}</span>%
        </div>
        <div className="bar">
          <div id="hygiene-bar" style={{ width: state.hygiene + "%" }} />
        </div>
      </div>
      <div className="stat">
        <div className="label">
          Happiness 😊 <span id="happy-val">{state.happy.toFixed(1)}</span>%
        </div>
        <div className="bar">
          <div id="happy-bar" style={{ width: state.happy + "%" }} />
        </div>
      </div>
      <div className="inv">
        Bandage 🩹: <span id="bandage-count">{state.bandage}</span>
      </div>
    </aside>
  );
}

function StartScreen({
  visible,
  onStart,
  avatarSelection,
  onAvatarSelect,
  selectedAvatar,
}) {
  const [name, setName] = useState("");
  if (!visible) return null;
  return (
    <div id="start-screen" className="overlay">
      <div className="box start-box">
        <h1>UMN RPG Adventure Life</h1>
        <div className="avatar-box" id="avatar-box">
          <AvatarSelector
            avatars={avatarSelection}
            onSelect={onAvatarSelect}
            selected={selectedAvatar}
          />
        </div>
        <input
          id="player-name"
          placeholder="Masukkan nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="start-row">
          <button id="start-btn" onClick={() => onStart(name || "Player")}>
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarSelector({ avatars, onSelect, selected }) {
  return (
    <div className="avatar-box">
      {avatars.map((a, i) => (
        <div
          key={i}
          className={`avatar-item ${
            selected?.name === a.name ? "selected" : ""
          }`}
          onClick={() => onSelect(a)}
        >
          <img className="avatar-img" src={a.idle} alt={a.name} />
          <div className="avatar-name">{a.name}</div>
        </div>
      ))}
    </div>
  );
}

function Map({
  playerPos,
  setPlayerPos,
  droppedItems,
  onEnterLocation,
  locs,
  onPickupDropped,
}) {
  const mapRef = useRef();

  return (
    <div
      id="map"
      className="map"
      ref={mapRef}
      style={{ backgroundImage: `url(${bgImg})`, backgroundSize: "cover" }}
    >
      {locs.map((l) => (
        <div
          key={l.id}
          id={l.id}
          className="loc"
          style={{
            left: `${l.leftPercent}%`,
            top: `${l.topPercent}%`,
          }}
        >
          <div className="koko">
            <img src={l.img} alt={l.label} />
          </div>
          {l.label}
        </div>
      ))}

      <div
        id="player"
        className="player"
        style={{
          left: `${playerPos.leftPercent}%`,
          top: `${playerPos.topPercent}%`,
        }}
      >
        <img
          id="player-img"
          src={playerPos.sprite}
          alt="player"
          className="player-avatar"
        />
        <div className="player-name">{playerPos.name}</div>
      </div>

      {droppedItems.map((it, i) => {
        const map = mapRef.current;
        const mapWidth = map ? map.getBoundingClientRect().width : 900;
        const size = it.sizeRatio ? mapWidth * it.sizeRatio : 32;

        return (
          <div
            key={i}
            className="dropped-item"
            style={{
              left: `${it.xPercent}%`,
              top: `${it.yPercent}%`,
              width: `${size}px`,
              height: `${size}px`,
              fontSize: `${size}px`,
            }}
            onMouseEnter={() => onPickupDropped?.(i)}
          >
            {it.icon || "🎁"}
          </div>
        );
      })}
    </div>
  );
}

function Controls({ startHold, stopHold }) {
  return (
    <div id="controls" className="controls">
      <button
        data-dir="up"
        className="arrow"
        onMouseDown={() => startHold("up")}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
      >
        ▲
      </button>
      <div className="mid">
        <button
          data-dir="left"
          className="arrow"
          onMouseDown={() => startHold("left")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
        >
          ◀
        </button>
        <button
          data-dir="down"
          className="arrow"
          onMouseDown={() => startHold("down")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
        >
          ▼
        </button>
        <button
          data-dir="right"
          className="arrow"
          onMouseDown={() => startHold("right")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function ActionPanel({ visible, title, desc, actions }) {
  if (!visible) return null;
  return (
    <div id="action" className="box action-panel">
      <h3 id="loc-title">{title}</h3>
      <div id="loc-desc">{desc}</div>
      <div id="loc-actions" className="loc-actions">
        {(actions || []).map((a, i) => (
          <button
            key={i}
            className="action-btn"
            disabled={a.disabled}
            title={a.info || ""}
            onClick={a.exec}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function InventoryModal({ visible, state, onClose, onUseItem }) {
  if (!visible) return null;
  const items = Object.keys(state.inventory || {});
  return (
    <div id="inventory" className="overlay">
      <div className="box inventory-box">
        <h1>Inventory</h1>
        <div id="inventory-content">
          {items.length === 0 ? (
            <div>Your inventory is empty.</div>
          ) : (
            items.map((it, idx) => (
              <div key={idx} className="inventory-item">
                {it}: {state.inventory[it]}{" "}
                <button className="use-btn" onClick={() => onUseItem(it)}>
                  Use
                </button>
              </div>
            ))
          )}
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ---------- Main App ---------- */

export default function App() {
  useEffect(() => {
    signOut(auth).catch(() => {});
  }, []);

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const loadedDone = useRef(false);

  function handleLogin(user) {
    setUser(user);
    setShowLogin(false);
  }

  function handleLogout() {
    signOut(auth);
    setUser(null);
  }

  const [started, setStarted] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [actionPanelState, setActionPanelState] = useState({
    visible: false,
    title: "",
    desc: "",
    actions: [],
  });
  const [gameOver, setGameOver] = useState({ visible: false, reason: "" });

  const [state, setState] = useState(DEFAULT_STATE);
  const [playerPos, setPlayerPos] = useState({
    left: 290,
    top: 420,
    leftPercent: 32,
    topPercent: 82,
    sprite: char1Idle,
    name: "Player",
  });

  useEffect(() => {
    const map = document.getElementById("map");
    if (!map) return;

    const rect = map.getBoundingClientRect();
    setPlayerPos((p) => ({
      ...p,
      left: (p.leftPercent / 100) * rect.width,
      top: (p.topPercent / 100) * rect.height,
    }));
  }, []);

  const [selectedAvatar, setSelectedAvatar] = useState({
    name: "Hero",
    idle: char1Idle,
    left: char1Left,
    right: char1Right,
    back: char1Back,
  });

  const selectedAvatarRef = useRef(selectedAvatar);

  const [mode, setMode] = useState("outdoor");

  const [droppedItems, setDroppedItems] = useState([]);

  const [keyboardEnabled, setKeyboardEnabled] = useState(true);

  const [gameMinutes, setGameMinutes] = useState(0);
  const [greeting, setGreeting] = useState("Good morning");
  const lastMoveRef = useRef(Date.now());
  const tickRef = useRef(null);
  const timeRef = useRef(null);

  const avatars = [
    {
      name: "Hero",
      idle: char1Idle,
      left: char1Left,
      right: char1Right,
      back: char1Back,
    },
    {
      name: "Princess",
      idle: char2Idle,
      left: char2Left,
      right: char2Right,
      back: char2Back,
    },
    {
      name: "Mage",
      idle: char3Idle,
      left: char3Left,
      right: char3Right,
      back: char3Back,
    },
    {
      name: "Captain",
      idle: char4Idle,
      left: char4Left,
      right: char4Right,
      back: char4Back,
    },
    {
      name: "Warrior",
      idle: char5Idle,
      left: char5Left,
      right: char5Right,
      back: char5Back,
    },
    {
      name: "Barbarian",
      idle: char6Idle,
      left: char6Left,
      right: char6Right,
      back: char6Back,
    },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        loadedDone.current = false;
        return;
      }

      console.log("LOGIN:", u.uid);

      const res = await loadProgressFromFirebase(u.uid);
      if (!res?.data) {
        console.log("NO SAVE DATA");
        loadedDone.current = true;
        return;
      }

      const saved = res.data;

      if (saved.playerName)
        setPlayerPos((p) => ({ ...p, name: saved.playerName }));

      if (saved.selectedAvatar) {
        setSelectedAvatar(saved.selectedAvatar);
        selectedAvatarRef.current = saved.selectedAvatar;
      }

      if (saved.playerPos) setPlayerPos(saved.playerPos);
      if (saved.state) setState(saved.state);
      if (saved.mode) setMode(saved.mode);
      if (saved.gameMinutes !== undefined) {
        setGameMinutes(saved.gameMinutes);

        const hours = Math.floor(saved.gameMinutes / 60) % 24;

        if (hours >= 5 && hours < 12) setGreeting("Good morning 🌅");
        else if (hours >= 12 && hours < 18) setGreeting("Good afternoon ☀️");
        else if (hours >= 18 && hours < 22) setGreeting("Good evening 🌆");
        else setGreeting("Good night 🌙");
      }

      console.log("SAVE LOADED");

      loadedDone.current = true;
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    preloadImages([
      bgImg,
      homeImg,
      dungeonImg,
      mineImg,
      ramenImg,
      hospitalImg,

      // Avatar 1
      char1Idle,
      char1Left,
      char1Right,
      char1Back,
      // Avatar 2
      char2Idle,
      char2Left,
      char2Right,
      char2Back,
      // Avatar 3
      char3Idle,
      char3Left,
      char3Right,
      char3Back,
      // Avatar 4
      char4Idle,
      char4Left,
      char4Right,
      char4Back,
      // Avatar 5
      char5Idle,
      char5Left,
      char5Right,
      char5Back,
      // Avatar 6
      char6Idle,
      char6Left,
      char6Right,
      char6Back,
    ]);
  }, []);

  const locs = [
    {
      id: "home",
      label: "Home",
      img: homeImg,
      left: 100,
      top: 70,
      leftPercent: 11,
      topPercent: 13,
    },
    {
      id: "dungeon",
      label: "The Dungeon",
      img: dungeonImg,
      left: 590,
      top: 10,
      leftPercent: 65,
      topPercent: 2,
    },
    {
      id: "mine",
      label: "The Mine",
      img: mineImg,
      left: 740,
      top: 250,
      leftPercent: 82,
      topPercent: 46,
    },
    {
      id: "ramen",
      label: "The Ramen Shop",
      img: ramenImg,
      left: 210,
      top: 200,
      leftPercent: 23,
      topPercent: 38,
    },
    {
      id: "hospital",
      label: "The Hospital",
      img: hospitalImg,
      left: 620,
      top: 360,
      leftPercent: 69,
      topPercent: 68,
    },
  ];

  function openLocation(locId) {
    setActionPanelState({
      visible: true,
      title: locId.toUpperCase(),
      desc: `Enter ${locId} to explore.`,
      actions: [
        {
          label: "Enter",
          exec: () => {
            setActionPanelState({ visible: false });

            if (locId === "home") {
              setState((s) => {
                const visited = new Set(s.visitedAreas);
                visited.add(locId);
                return { ...s, visitedAreas: [...visited] };
              });

              setMode("home");
              setKeyboardEnabled(true);
              return;
            }

            if (locId === "mine") {
              setState((s) => {
                const visited = new Set(s.visitedAreas);
                visited.add(locId);
                return { ...s, visitedAreas: [...visited] };
              });

              setMode("mine");
              setKeyboardEnabled(true);
              return;
            }

            if (locId === "dungeon") {
              setState((s) => {
                const visited = new Set(s.visitedAreas);
                visited.add(locId);
                return { ...s, visitedAreas: [...visited] };
              });

              setMode("dungeon");
              setKeyboardEnabled(true);
              return;
            }

            if (locId === "ramen") {
              setState((s) => {
                const visited = new Set(s.visitedAreas);
                visited.add(locId);
                return { ...s, visitedAreas: [...visited] };
              });

              setMode("ramen");
              setKeyboardEnabled(true);
              return;
            }

            if (locId === "hospital") {
              setState((s) => {
                const visited = new Set(s.visitedAreas);
                visited.add(locId);
                return { ...s, visitedAreas: [...visited] };
              });

              setMode("hospital");
              setKeyboardEnabled(true);
              return;
            }

            showMessage(`Entering ${locId}`);
          },
        },
      ],
    });
  }

  const moveInterval = useRef(null);

  const playerImgIdleTimer = useRef(null);

  const lastDir = useRef(null);

  function startTicking() {
    clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      setState((s) => {
        const ns = {
          ...s,
          meal: clamp(s.meal - 0.8),
          sleep: clamp(s.sleep - 0.5),
          hygiene: clamp(s.hygiene - 0.3),
          happy: clamp(s.happy - 0.4),
          money: s.money,
        };

        if (
          ns.meal <= 0 ||
          ns.sleep <= 0 ||
          ns.hygiene <= 0 ||
          ns.happy <= 0 ||
          ns.money <= 0
        ) {
          setGameOver({
            visible: true,
            reason:
              ns.meal <= 0
                ? "Starvation"
                : ns.sleep <= 0
                ? "Exhaustion"
                : ns.hygiene <= 0
                ? "Infection"
                : ns.happy <= 0
                ? "Depression"
                : "Broke",
          });

          clearInterval(tickRef.current);
          clearInterval(timeRef.current);
        }

        return ns;
      });
    }, 2700);
  }

  function startTiming() {
    clearInterval(timeRef.current);

    timeRef.current = setInterval(() => {
      setGameMinutes((gm) => {
        const next = gm + 1;
        const hours = Math.floor(next / 60) % 24;
        let greet = "";

        if (hours >= 5 && hours < 12) greet = "Good morning 🌅";
        else if (hours >= 12 && hours < 18) greet = "Good afternoon ☀️";
        else if (hours >= 18 && hours < 22) greet = "Good evening 🌆";
        else greet = "Good night 🌙";

        setGreeting(greet);

        if (Math.random() < 0.05) spawnRandomItem();

        return next;
      });
    }, 1000);
  }

  useEffect(() => {
    startTicking();
    startTiming();

    return () => {
      clearInterval(tickRef.current);
      clearInterval(timeRef.current);
    };
  }, []);

  function spawnRandomItem() {
    setDroppedItems((prev) => {
      if (prev.length >= 5) return prev;

      const xPercent = Math.random() * 100;
      const yPercent = Math.random() * 100;

      return [...prev, { xPercent, yPercent, icon: "🎁", sizeRatio: 0.05 }];
    });
  }

  function startGame(name) {
    setPlayerPos((p) => ({ ...p, name }));
    setStarted(true);
  }

  const lastVisitedRef = useRef(null);

  function move(dir) {
    lastMoveRef.current = Date.now();
    const speed = 20;

    const avatar = selectedAvatarRef.current;

    setPlayerPos((prevPos) => {
      const map = document.getElementById("map");
      const player = document.getElementById("player");
      if (!map || !player) return prevPos;

      const rect = map.getBoundingClientRect();
      const pw = player.offsetWidth;
      const ph = player.offsetHeight;

      let dx = 0,
        dy = 0;
      if (dir === "up") dy = -speed;
      if (dir === "down") dy = speed;
      if (dir === "left") dx = -speed;
      if (dir === "right") dx = speed;

      let left = prevPos.left + dx;
      let top = prevPos.top + dy;
      left = Math.max(0, Math.min(rect.width - pw, left));
      top = Math.max(0, Math.min(rect.height - ph, top));

      let sprite = avatar.idle;
      if (dy < 0) sprite = avatar.back;
      else if (dy > 0) sprite = avatar.idle;
      else if (dx > 0) sprite = avatar.right;
      else if (dx < 0) sprite = avatar.left;

      const pRect = { left, top, right: left + 32, bottom: top + 48 };
      let found = null;
      for (const loc of locs) {
        const locLeft = (loc.leftPercent / 100) * rect.width;
        const locTop = (loc.topPercent / 100) * rect.height;

        const locRect = {
          left: locLeft,
          top: locTop,
          right: locLeft + 80 * (rect.width / 900),
          bottom: locTop + 80 * (rect.height / 520),
        };

        const overlap = !(
          pRect.right < locRect.left ||
          pRect.left > locRect.right ||
          pRect.bottom < locRect.top ||
          pRect.top > locRect.bottom
        );

        if (overlap) {
          found = loc.id;
          break;
        }
      }

      if (found) {
        if (lastVisitedRef.current !== found) {
          openLocation(found);
          lastVisitedRef.current = found;
        }
      } else {
        lastVisitedRef.current = null;
        setActionPanelState({
          visible: false,
          title: "",
          desc: "",
          actions: [],
        });
      }
      let removed = false;
      setDroppedItems((prev) =>
        prev.filter((it) => {
          const itemLeft = (it.xPercent / 100) * rect.width;
          const itemTop = (it.yPercent / 100) * rect.height;

          const r = {
            left: itemLeft,
            top: itemTop,
            right: itemLeft + 24 * (rect.width / 900),
            bottom: itemTop + 24 * (rect.height / 520),
          };

          const overlap = !(
            pRect.right < r.left ||
            pRect.left > r.right ||
            pRect.bottom < r.top ||
            pRect.top > r.bottom
          );
          if (overlap && !removed) {
            addItemRandom();
            removed = true;
            return false;
          }
          return true;
        })
      );

      const leftPercent = (left / rect.width) * 100;
      const topPercent = (top / rect.height) * 100;

      return {
        ...prevPos,
        left,
        top,
        leftPercent,
        topPercent,
        sprite,
      };
    });
  }

  function addItemRandom() {
    const randomItems = [
      "coconut",
      "herb",
      "bandage",
      "apple",
      "bread",
      "water",
      "medicine",
      "coin",
      "gem",
    ];
    setState((s) => ({ ...s, itemsCollected: s.itemsCollected + 1 }));

    const picked = randomItems[Math.floor(Math.random() * randomItems.length)];
    if (picked === "bandage") {
      setState((s) => {
        const inv = { ...s.inventory };
        inv.bandage = (inv.bandage || 0) + 1;

        return {
          ...s,
          bandage: s.bandage + 1,
          inventory: inv,
        };
      });
    } else {
      addItem(picked, 1);
    }
    showMessage(`Picked up a ${picked}!`);
  }

  function addItem(itemName, qty = 1) {
    setState((s) => {
      const inv = { ...s.inventory };
      inv[itemName] = (inv[itemName] || 0) + qty;

      const extra = itemName === "bandage" ? { bandage: s.bandage + qty } : {};

      return { ...s, inventory: inv, ...extra };
    });
  }

  function pickupDropped(index) {
    setDroppedItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const item = prev[index];
      if (item) addItemRandom();
      return prev.filter((_, i) => i !== index);
    });
  }

  function useItem(itemName) {
    setState((s) => {
      if (itemName === "ore") {
        showMessage("Can only be sold at the Mine");
        return s;
      }
      if (!s.inventory[itemName]) return s;
      const inv = { ...s.inventory };
      inv[itemName] = inv[itemName] - 1;
      if (inv[itemName] <= 0) delete inv[itemName];
      let ns = { ...s, inventory: inv };
      ns.itemsUsed = (ns.itemsUsed || 0) + 1;

      switch (itemName) {
        case "coconut":
          ns.meal = clamp(ns.meal + 20);
          ns.happy = clamp(ns.happy + 5);
          break;
        case "herb":
          ns.hygiene = clamp(ns.hygiene + 15);
          ns.happy = clamp(ns.happy + 3);
          break;
        case "bandage":
          ns.hygiene = clamp(ns.hygiene + 30);
          ns.bandage = Math.max(0, ns.bandage - 1);
          break;
        case "apple":
          ns.meal = clamp(ns.meal + 15);
          ns.happy = clamp(ns.happy + 5);
          break;
        case "bread":
          ns.meal = clamp(ns.meal + 25);
          break;
        case "water":
          ns.hygiene = clamp(ns.hygiene + 10);
          break;
        case "medicine":
          ns.hygiene = clamp(ns.hygiene + 20);
          ns.happy = clamp(ns.happy + 5);
          break;
        case "a bag of coin":
          ns.money += 10;
          break;
        case "gem":
          ns.money += 50;
          break;
        default:
          break;
      }
      showMessage(`Used ${itemName}`);
      return ns;
    });
  }

  function showMessage(text) {
    const msg = document.createElement("div");
    msg.className = "random-event-msg";
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  function startHold(dir) {
    lastDir.current = dir;
    move(dir);

    if (moveInterval.current) clearInterval(moveInterval.current);

    moveInterval.current = setInterval(() => {
      move(lastDir.current);
    }, 120);
  }

  function stopHold() {
    lastDir.current = null;
    clearInterval(moveInterval.current);
    moveInterval.current = null;
  }

  function onKeyDown(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.repeat) return;

    if (e.key === "ArrowUp") startHold("up");
    if (e.key === "ArrowDown") startHold("down");
    if (e.key === "ArrowLeft") startHold("left");
    if (e.key === "ArrowRight") startHold("right");
  }

  function onKeyUp(e) {
    stopHold();
  }

  function onAvatarSelect(a) {
    setSelectedAvatar(a);
    setPlayerPos((p) => ({ ...p, sprite: a.idle }));
  }

  useEffect(() => {
    selectedAvatarRef.current = selectedAvatar;
  }, [selectedAvatar]);

  useEffect(() => {
    if (!keyboardEnabled) return;

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keyboardEnabled]);

  function calculateLifeScore(state) {
    const statScore = state.meal + state.sleep + state.hygiene + state.happy;
    const activityScore = state.activitiesDone * 10;
    const itemScore =
      state.itemsCollected * 2 +
      state.itemsUsed * 5;
    const areaScore = state.visitedAreas.length * 20;
    return {
      statScore,
      activityScore,
      itemScore,
      areaScore,
      total: Math.round(statScore + activityScore + itemScore + areaScore),
    };
  }

  function restartGame() {
    setState(DEFAULT_STATE);

    setGameMinutes(0);
    setGreeting("Good morning 🌅");

    setPlayerPos({
      left: 290,
      top: 420,
      sprite: selectedAvatarRef.current.idle,
      name: playerPos.name || "Player",
      leftPercent: 32,
      topPercent: 82,
    });

    setDroppedItems([]);

    setMode("outdoor");
    setGameOver({ visible: false, reason: "" });
    setKeyboardEnabled(true);

    setActionPanelState({
      visible: false,
      title: "",
      desc: "",
      actions: [],
    });

    clearInterval(tickRef.current);
    clearInterval(timeRef.current);

    startTicking();
    startTiming();
  }

  useEffect(() => {
    if (!user) return;
    if (!loadedDone.current) return;

    const data = {
      playerName: playerPos.name,
      selectedAvatar,
      mode,
      playerPos,
      state,
      gameMinutes,
    };

    const handler = setTimeout(() => {
      saveProgressToFirebase(user.uid, data);
    }, 500);

    return () => clearTimeout(handler);
  }, [playerPos, selectedAvatar, mode, state, gameMinutes, user]);

  const getSafePosition = (pxX, pxY, currentPos) => {
    const pos = pxToPercent(pxX, pxY);
    return {
      leftPercent: Number(pos?.leftPercent) || currentPos.leftPercent,
      topPercent: Number(pos?.topPercent) || currentPos.topPercent,
    };
  };

  const safeExitToOutdoor = (pxX, pxY) => {
    const { leftPercent, topPercent } = getSafePosition(pxX, pxY, playerPos);

    setMode("outdoor");
    setKeyboardEnabled(true);

    setPlayerPos((prev) => ({
      ...prev,
      leftPercent,
      topPercent,
    }));
  };

  return (
    <div className="app-root">
      <StartScreen
        visible={!started}
        onStart={startGame}
        avatarSelection={avatars}
        onAvatarSelect={onAvatarSelect}
        selectedAvatar={selectedAvatar}
      />

      {showLogin && (
        <LoginScreen
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      <Header
        timeText={`${String(Math.floor(gameMinutes / 60)).padStart(
          2,
          "0"
        )}:${String(gameMinutes % 60).padStart(2, "0")}`}
        greeting={greeting}
        onInventoryClick={() => setShowInventory(true)}
        money={state.money}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={handleLogout}
      />

      <main className="main">
        <StatusPanel state={state} />
        <section id="game">
          {mode === "outdoor" && (
            <>
              <Map
                playerPos={playerPos}
                setPlayerPos={setPlayerPos}
                droppedItems={droppedItems}
                locs={locs}
                onEnterLocation={openLocation}
                onPickupDropped={pickupDropped}
              />
              <Controls startHold={startHold} stopHold={stopHold} />
              <ActionPanel
                visible={actionPanelState.visible}
                title={actionPanelState.title}
                desc={actionPanelState.desc}
                actions={actionPanelState.actions}
              />
            </>
          )}

          {mode === "home" && (
            <Home
              onExitHome={() => safeExitToOutdoor(100, 360)}
              state={state}
              setState={setState}
              selectedAvatar={selectedAvatar}
              keyboardEnabled={keyboardEnabled}
            />
          )}

          {mode === "mine" && (
            <Mine
              onExitMine={() => safeExitToOutdoor(740, 250)}
              state={state}
              setState={setState}
              selectedAvatar={selectedAvatar}
              keyboardEnabled={keyboardEnabled}
            />
          )}

          {mode === "dungeon" && (
            <Dungeon
              onExitDungeon={() => safeExitToOutdoor(590, 10)}
              state={state}
              setState={setState}
              selectedAvatar={selectedAvatar}
              keyboardEnabled={keyboardEnabled}
            />
          )}

          {mode === "ramen" && (
            <Ramen
              onExitRamen={() => safeExitToOutdoor(210, 200)}
              state={state}
              setState={setState}
              selectedAvatar={selectedAvatar}
              keyboardEnabled={keyboardEnabled}
            />
          )}

          {mode === "hospital" && (
            <Hospital
              onExitHospital={() => safeExitToOutdoor(620, 360)}
              state={state}
              setState={setState}
              selectedAvatar={selectedAvatar}
              keyboardEnabled={keyboardEnabled}
            />
          )}
        </section>
      </main>

      <InventoryModal
        visible={showInventory}
        state={state}
        onClose={() => setShowInventory(false)}
        onUseItem={useItem}
      />

      {gameOver.visible && (
        <div id="gameover" className="overlay">
          <div className="box">
            <h1>Game Over</h1>
            <div id="gameover-reason">{gameOver.reason}</div>
            {(() => {
              const score = calculateLifeScore(state);
              return (
                <div className="life-score-box">
                  <h2>Life Satisfaction Report</h2>

                  <div>
                    Stat Balance Score: {score.statScore.toFixed(1)} / 400
                  </div>

                  <div>
                    Activities Performed: {state.activitiesDone} (Score:{" "}
                    {score.activityScore.toFixed(1)})
                  </div>

                  <div>
                    Items Collected: {state.itemsCollected} (Score:{" "}
                    {state.itemsCollected.toFixed(1) * 2})
                  </div>

                  <div>
                    Items Used: {state.itemsUsed} (Score:{" "}
                    {state.itemsUsed.toFixed(1) * 5})
                  </div>

                  <div>
                    Areas Visited: {state.visitedAreas.length} / 5 (Score:{" "}
                    {score.areaScore.toFixed(1)})
                  </div>

                  <hr />

                  <div className="final-life-score">
                    FINAL SCORE: {score.total}
                  </div>
                </div>
              );
            })()}

            <div className="gameover-buttons">
              <button id="restart" onClick={restartGame}>
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
