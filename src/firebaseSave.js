import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function saveProgressToFirebase(uid, data) {
  try {
    await setDoc(doc(db, "savefiles", uid), data, { merge: true });
    console.debug("[saveProgressToFirebase] saved for", uid);
    return { ok: true };
  } catch (err) {
    console.error("[saveProgressToFirebase] error:", err);
    return { ok: false, error: err };
  }
}

export async function loadProgressFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, "savefiles", uid));
    if (snap.exists()) {
      console.debug("[loadProgressFromFirebase] loaded for", uid);
      return { ok: true, data: snap.data() };
    }
    console.debug("[loadProgressFromFirebase] no data for", uid);
    return { ok: true, data: null };
  } catch (err) {
    console.error("[loadProgressFromFirebase] error:", err);
    return { ok: false, error: err };
  }
}
