// ===== Settings =====
// To turn on the AI tutor: run server.js (see README) and put its address here.
const CONFIG = { API_URL: "" }; // e.g. "http://localhost:3000"

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let S = { notes: [], cards: [], days: {} };
try { S = { ...S, ...JSON.parse(localStorage.getItem("studymate") || "{}") }; } catch (e) {}
const save = () => { try { localStorage.setItem("studymate", JSON.stringify(S)); } catch (e) {} };

// ===== Tabs =====
function show(t) {
  $$(".panel").forEach(p => p.hidden = p.id !== t);
  $$("#tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.t === t));
}
$$("#tabs button").forEach(b => b.onclick = () => show(b.dataset.t));

// ===== Notes =====
let cur = null;
const out = m => $("#nout").textContent = m;
function listNotes() {
  $("#nlist").innerHTML = S.notes.map(n => `<li><button data-id="${n.id}" class="${n.id === cur ? "on" : ""}">${esc(n.title || "Untitled")}</button></li>`).join("") || '<li class="mut">No notes yet</li>';
}
function openNote(id) {
  cur = id;
  const n = S.notes.find(x => x.id === id) || { title: "", text: "" };
  $("#ntitle").value = n.title; $("#ntext").value = n.text; out(""); listNotes();
}
$("#nlist").onclick = e => { const b = e.target.closest("button"); if (b) openNote(b.dataset.id); };
$("#nnew").onclick = () => openNote(null);
$("#nsave").onclick = () => {
  const title = $("#ntitle").value.trim(), text = $("#ntext").value;
  if (!title && !text.trim()) return out("Nothing to save yet.");
  let n = S.notes.find(x => x.id === cur);
  if (!n) { n = { id: Math.random().toString(36).slice(2, 9) }; S.notes.unshift(n); cur = n.id; }
  n.title = title; n.text = text; save(); listNotes(); out("Saved ✓");
};
$("#ndel").onclick = () => { S.notes = S.notes.filter(x => x.id !== cur); save(); openNote(null); };

// Simple offline summary: picks the sentences with the most frequent words
function summarize(text, k = 3) {
  const sents = text.replace(/\s+/g, " ").match(/[^.!?।]+[.!?।]*/g) || [];
  if (sents.length <= k) return sents.join(" ").trim();
  const words = s => s.toLowerCase().match(/[\p{L}\p{M}]{4,}/gu) || [], f = {};
  words(text).forEach(w => f[w] = (f[w] || 0) + 1);
  return sents.map((s, i) => ({ i, s, v: words(s).reduce((a, w) => a + f[w], 0) / Math.sqrt(s.length) }))
    .sort((a, b) => b.v - a.v).slice(0, k).sort((a, b) => a.i - b.i).map(x => x.s.trim()).join(" ");
}
$("#nsum").onclick = () => {
  const t = $("#ntext").value.trim();
  out(t ? "Summary:\n" + summarize(t) : "Write some notes first.");
};
$("#ncards").onclick = () => {
  let added = 0;
  $("#ntext").value.split("\n").forEach(l => {
    const m = l.match(/^\s*(.{2,80}?)\s*(?::|—|–| - )\s*(.{2,})$/);
    if (m && !S.cards.some(c => c.f === m[1])) { S.cards.push({ f: m[1], b: m[2], k: 0 }); added++; }
  });
  save(); card();
  out(added ? `Added ${added} flashcard(s). Open the Flashcards tab.` : 'No "Term: meaning" lines found.');
};

// ===== Flashcards =====
let ci = 0, flip = false;
function card() {
  const c = S.cards[ci], fc = $("#fc");
  fc.textContent = c ? (flip ? c.b : c.f) : "No cards yet. Add one below, or make them from a note.";
  fc.classList.toggle("back", !!c && flip);
  $("#fcount").textContent = S.cards.length ? `${ci + 1} / ${S.cards.length}` : "0 / 0";
  $("#fstat").textContent = `Mastered: ${S.cards.filter(x => (x.k || 0) >= 3).length}`;
}
const go = d => { if (!S.cards.length) return; ci = (ci + d + S.cards.length) % S.cards.length; flip = false; card(); };
const flipIt = () => { flip = !flip; card(); };
$("#fc").onclick = flipIt;
$("#fc").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipIt(); } };
$("#fprev").onclick = () => go(-1);
$("#fnext").onclick = () => go(1);
$("#fgood").onclick = () => { const c = S.cards[ci]; if (c) { c.k = (c.k || 0) + 1; save(); } go(1); };
$("#fbad").onclick = () => { const c = S.cards[ci]; if (c) { c.k = 0; save(); } go(1); };
$("#fdel").onclick = () => { S.cards.splice(ci, 1); ci = Math.max(0, Math.min(ci, S.cards.length - 1)); flip = false; save(); card(); };
$("#fform").onsubmit = e => {
  e.preventDefault();
  S.cards.push({ f: $("#ff").value.trim(), b: $("#fb").value.trim(), k: 0 });
  e.target.reset(); ci = S.cards.length - 1; flip = false; save(); card();
};

// ===== Quiz =====
let Q = [], qi = 0, qs = 0;
$("#qstart").onclick = () => {
  if (S.cards.length < 2) return $("#qbox").innerHTML = '<p class="mut">Add at least 2 flashcards first.</p>';
  Q = shuffle(S.cards).slice(0, 10); qi = 0; qs = 0; ask();
};
function ask() {
  if (qi >= Q.length) return $("#qbox").innerHTML = `<h3>Score: ${qs} / ${Q.length}</h3><p class="mut">Press Start quiz to try again.</p>`;
  const c = Q[qi];
  const opts = shuffle([...new Set([c.b, ...shuffle(S.cards.filter(x => x !== c).map(x => x.b)).slice(0, 3)])]);
  $("#qbox").innerHTML = `<p class="mut">Question ${qi + 1} of ${Q.length}</p><h3>${esc(c.f)}</h3>` +
    opts.map(o => `<button class="opt" data-a="${esc(o)}">${esc(o)}</button>`).join("");
  $$("#qbox .opt").forEach(b => b.onclick = () => {
    const ok = b.dataset.a === c.b;
    if (ok) qs++; else b.classList.add("bad");
    $$("#qbox .opt").forEach(x => { x.disabled = true; if (x.dataset.a === c.b) x.classList.add("ok"); });
    setTimeout(() => { qi++; ask(); }, 900);
  });
}

// ===== Focus timer =====
const M = { focus: 1500, break: 300 };
let mode = "focus", left = M.focus, tm = null;
function tick() {
  $("#time").textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
}
function setMode(m) {
  mode = m; left = M[m]; tick();
  $("#tmode").textContent = m === "focus" ? "Focus time" : "Break time";
}
function sess() { $("#tsess").textContent = `Focus sessions today: ${S.days[new Date().toDateString()] || 0}`; }
$("#tstart").onclick = () => {
  if (tm) { clearInterval(tm); tm = null; $("#tstart").textContent = "Resume"; return; }
  $("#tstart").textContent = "Pause";
  tm = setInterval(() => {
    left--; tick();
    if (left <= 0) {
      clearInterval(tm); tm = null;
      if (mode === "focus") { const d = new Date().toDateString(); S.days[d] = (S.days[d] || 0) + 1; save(); sess(); }
      $("#tstart").textContent = "Start"; setMode(mode === "focus" ? "break" : "focus");
    }
  }, 1000);
};
$("#treset").onclick = () => { clearInterval(tm); tm = null; $("#tstart").textContent = "Start"; setMode(mode); };

// ===== AI tutor =====
const history = [];
function say(who, text) {
  const d = document.createElement("div");
  d.className = "msg " + who; d.textContent = text;
  $("#chat").appendChild(d); $("#chat").scrollTop = 1e9;
}
$("#tform").onsubmit = async e => {
  e.preventDefault();
  const q = $("#tin").value.trim(); if (!q) return;
  $("#tin").value = ""; say("me", q); history.push({ role: "user", content: q });
  let r;
  if (!CONFIG.API_URL) r = "The AI tutor is not connected yet. Start server.js and set CONFIG.API_URL in script.js (see README). Meanwhile, try Summarize in the Notes tab.";
  else {
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: $("#tctx").checked ? $("#ntext").value : "" })
      });
      r = (await res.json()).reply;
    } catch (err) { r = "Could not reach the AI server. Check that it is running."; }
  }
  say("ai", r); history.push({ role: "assistant", content: r });
};

// ===== Start =====
listNotes(); card(); setMode("focus"); sess(); show("notes");
