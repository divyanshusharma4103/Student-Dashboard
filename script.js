// EduTrack Pro - student dashboard
// Everything is saved in the browser (localStorage), so no server is needed.
"use strict";

const KEY = "edutrack_v1";
const COURSES = ["BCA", "B.Tech", "MCA", "MBA", "BBA", "B.Sc", "B.Com"];
const PAGES = [
  ["dashboard", "Dashboard", "home"], ["records", "Academic Records", "records"],
  ["attendance", "Attendance", "attendance"], ["courses", "Courses", "book"],
  ["analytics", "Performance Analytics", "chart"], ["announcements", "Announcements", "megaphone"],
  ["settings", "Settings", "gear"]
];
// [code, name, semester, credits]
const CATALOG = [
  ["CS101", "Programming Fundamentals", 1, 4], ["MA101", "Discrete Mathematics", 1, 3],
  ["CS201", "Data Structures", 2, 4], ["CS202", "Digital Electronics", 2, 3],
  ["CS301", "Database Management", 3, 4], ["CS302", "Java Programming", 3, 4], ["CS303", "Operating Systems", 3, 3],
  ["CS401", "Web Technologies", 4, 3], ["CS402", "Computer Networks", 4, 3],
  ["CS501", "Software Engineering", 5, 3], ["CS502", "Python for Data Science", 5, 4],
  ["CS601", "Cloud Computing", 6, 3], ["CS602", "Artificial Intelligence", 6, 4]
];
const QUOTES = [
  ["Keep Going!", "Every small step counts towards a bigger future."],
  ["Stay consistent", "Good grades are built one lecture at a time."],
  ["You've got this", "Review a little today and relax tomorrow."]
];
const BLANK = { name: "Student", course: "", semester: 1, gpas: [], attendance: 0, prevAtt: 0, assignments: 0 };

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const ic = (n) => `<svg class="ic"><use href="#i-${n}"/></svg>`;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const semText = (n) => `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n] || "th"} Semester`;
const cgpa = (s) => s.gpas.length ? s.gpas.reduce((a, b) => a + b, 0) / s.gpas.length : 0;
const doneCount = (s) => CATALOG.filter((c) => c[2] < s.semester).length;
const attBadge = (p) => p >= 85 ? ["Good", "green"] : p >= 75 ? ["Fair", "orange"] : ["Low", "red"];

function ago(t) {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 2) return "Just now";
  if (m < 60) return m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : d + " days ago";
}

// ---------- Data ----------

function seed() {
  const now = Date.now(), H = 36e5;
  const rows = [
    ["Divyanshu Sharma", "BCA2301", "BCA", 5, [8.1, 8.3, 8.5, 8.6, 8.72], 92, 5],
    ["Priya Singh", "BCA2302", "BCA", 5, [8.8, 9.0, 9.1, 9.2, 9.4], 96, 2],
    ["Aman Verma", "BTE2311", "B.Tech", 3, [7.2, 7.0, 6.8], 71, 6],
    ["Sneha Gupta", "BBA2321", "BBA", 4, [8.0, 7.8, 8.2, 8.4], 88, 3],
    ["Arjun Mehta", "BCM2331", "B.Com", 6, [7.5, 7.9, 8.1, 7.7, 8.0, 8.3], 84, 1],
    ["Riya Patel", "MCA2341", "MCA", 2, [8.6, 8.9], 93, 4],
    ["Karan Malhotra", "MBA2351", "MBA", 2, [6.9, 7.1], 68, 7],
    ["Ananya Rao", "BSC2361", "B.Sc", 4, [9.1, 9.3, 9.2, 9.5], 98, 0]
  ];
  const students = rows.map(([name, roll, course, semester, gpas, attendance, assignments], i) => ({
    id: uid(), name, roll, email: name.split(" ")[0].toLowerCase() + "@edutrack.in", course, semester, gpas,
    attendance, prevAtt: attendance - (i % 3 + 1), assignments, status: i === 6 ? "Inactive" : "Active",
    createdAt: now - (9 - i) * 24 * H
  }));
  return {
    students, activeId: students[0].id, dark: false,
    activities: [
      { t: now - 2 * H, icon: "records", color: "blue", title: "Database Management Assignment Submitted", sub: "Assignment submitted successfully" },
      { t: now - 5 * H, icon: "chart", color: "green", title: "Java Mid-Term Results Published", sub: "Check your results in Academic Records" },
      { t: now - 26 * H, icon: "attendance", color: "purple", title: "Attendance Updated for Semester 5", sub: "Your attendance has been updated" },
      { t: now - 27 * H, icon: "book", color: "orange", title: "New Course Material Available", sub: "Data Structures lecture notes uploaded" }
    ],
    announcements: [
      { id: uid(), title: "Mid-term exams start on Monday", body: "Download your hall ticket from the portal and carry your ID card.", prio: "High", t: now - 3 * H, read: false },
      { id: uid(), title: "Career guidance webinar", body: "Join the live session this week to plan your placements.", prio: "Normal", t: now - 30 * H, read: false },
      { id: uid(), title: "Library timings updated", body: "The library is now open until 8 PM on weekdays.", prio: "Normal", t: now - 90 * H, read: true }
    ]
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.students)) { d.activities ||= []; d.announcements ||= []; return d; }
    }
  } catch (e) { console.warn("Could not read saved data", e); }
  return seed();
}

let S = load();
let page = "dashboard", courseTab = "all", chartMode = "mine", quoteIdx = 0, pendingConfirm = null;
let calDate = new Date();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast("Your browser blocked saving. Changes will be lost on refresh.", "error"); }
}
const active = () => S.students.find((s) => s.id === S.activeId) || S.students[0] || null;
function log(icon, color, title, sub) {
  S.activities.unshift({ t: Date.now(), icon, color, title, sub });
  S.activities = S.activities.slice(0, 20);
}

let toastTimer;
function toast(msg, type = "") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

// ---------- Top bar and sidebar ----------

function renderNav() {
  $("#nav").innerHTML = PAGES.map(([id, label, icon]) =>
    `<button data-go="${id}" class="${id === page ? "on" : ""}">${ic(icon)}<span>${label}</span></button>`).join("");
}

function renderTop() {
  const a = active() || BLANK;
  $("#pAv").textContent = initials(a.name);
  $("#pName").textContent = a.name;
  $("#pSub").textContent = a.course ? `${a.course} - ${semText(a.semester)}` : "No student yet";
  const unread = S.announcements.filter((x) => !x.read).length;
  $("#bellBadge").textContent = unread;
  $("#bellBadge").hidden = !unread;
  $("#pMenu").innerHTML = `<p>Switch student</p>` + (S.students.map((s) =>
    `<button data-switch="${s.id}" class="${s.id === a.id ? "on" : ""}"><span class="av sm">${esc(initials(s.name))}</span>${esc(s.name)}<small>${esc(s.course)}</small></button>`
  ).join("") || `<span class="muted pad">No students yet</span>`);
}

function go(id) {
  page = id;
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + id));
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0 });
  renderNav();
}

// ---------- Dashboard ----------

function trend(v, unit, note) {
  if (v === null) return `<span class="note">${note}</span>`;
  const up = v >= 0;
  return `<span class="tr ${up ? "up" : "down"}">${up ? "▲ +" : "▼ "}${up ? v : Math.abs(v)}${unit}</span> <span class="note">${note}</span>`;
}

function renderDash() {
  const a = active() || BLANK, g = a.gpas;
  const d = g.length > 1 ? +(g[g.length - 1] - g[g.length - 2]).toFixed(2) : null;
  $("#heroName").textContent = a.name.split(" ")[0];

  const cards = [
    ["cap", "CGPA Score", cgpa(a).toFixed(2), trend(d, "", "from last semester")],
    ["users", "Attendance Rate", a.attendance + "%", trend(a.attendance - a.prevAtt, "%", "from last month")],
    ["book", "Completed Courses", doneCount(a), `<span class="note">out of ${CATALOG.length} courses</span>`],
    ["records", "Upcoming Assignments", a.assignments, `<span class="note">due this month</span>`]
  ];
  $("#stats").innerHTML = cards.map(([i, l, v, t]) =>
    `<div class="stat"><div class="sic">${ic(i)}</div><div><small>${l}</small><strong>${v}</strong><div>${t}</div></div></div>`).join("");

  const quick = [
    ["purple", "records", "View Academic Records", "go", "records"], ["green", "attendance", "Check Attendance", "go", "attendance"],
    ["orange", "book", "Explore Courses", "go", "courses"], ["pink", "download", "Download Reports", "csv", ""]
  ];
  $("#quick").innerHTML = quick.map(([c, i, l, kind, target]) =>
    `<button class="qa ${c}" ${kind === "go" ? `data-go="${target}"` : `data-act="csv"`}><span class="qi">${ic(i)}</span><b>${l}</b>${ic("arrow")}</button>`).join("");

  $("#activities").innerHTML = S.activities.slice(0, 4).map((x) =>
    `<li><span class="ai ${x.color}">${ic(x.icon)}</span><div><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div><time>${ago(x.t)}</time></li>`
  ).join("") || `<li class="empty-note">No activity yet.</li>`;

  renderChart(a);
  renderCal();
  const t = new Date();
  $("#todayText").textContent = t.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  $("#events").innerHTML = eventList().map((e) =>
    `<li><i class="${e.c}"></i><span>${e.n}</span><time>${e.d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></li>`).join("");
}

function classAvg(i) {
  const v = S.students.map((s) => s.gpas[i]).filter((x) => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function renderChart(a) {
  const W = 560, H = 220, L = 30, R = 14, T = 10, B = 26;
  const n = Math.max(a.gpas.length, 1);
  const X = (i) => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1));
  const Y = (v) => T + (H - T - B) * (1 - v / 10);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Semester GPA chart">`;
  for (let v = 0; v <= 10; v += 2) {
    svg += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  }
  for (let i = 0; i < a.gpas.length; i++) svg += `<text x="${X(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">Sem ${i + 1}</text>`;
  if (chartMode === "compare") {
    const pts = a.gpas.map((_, i) => classAvg(i)).map((v, i) => v === null ? null : `${X(i)},${Y(v)}`).filter(Boolean);
    if (pts.length) svg += `<polyline points="${pts.join(" ")}" fill="none" stroke="#f59a0b" stroke-width="2.5" stroke-dasharray="6 5"/>`;
  }
  if (a.gpas.length) {
    svg += `<polyline points="${a.gpas.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linejoin="round"/>`;
    svg += a.gpas.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="5" fill="var(--blue)" stroke="var(--card)" stroke-width="2"/>`).join("");
  } else svg += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="var(--muted)">No GPA data yet</text>`;
  $("#chart").innerHTML = svg + "</svg>" + (chartMode === "compare" ? `<p class="note" style="margin-top:6px">Blue: you · Orange dashed: class average</p>` : "");
  $("#sems").innerHTML = a.gpas.map((g, i) => `<div class="${i === a.gpas.length - 1 ? "on" : ""}"><b>${g}</b><small>Sem ${i + 1}</small></div>`).join("");
}

function eventList() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return [[3, "Database Management Assignment Due", "purple"], [6, "Java Lab Examination", "blue"],
    [8, "Career Guidance Webinar", "green"], [13, "Semester Fee Deadline", "orange"]]
    .map(([o, n, c]) => ({ d: new Date(t.getFullYear(), t.getMonth(), t.getDate() + o), n, c }));
}

function renderCal() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  const first = new Date(y, m, 1), lead = first.getDay(), days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate(), todayStr = new Date().toDateString();
  const marked = new Set(eventList().map((e) => e.d.toDateString()));
  let cells = "";
  for (let i = 0; i < 42; i++) {
    const d = i - lead + 1;
    let dt, cls = "";
    if (d < 1) { dt = new Date(y, m - 1, prevDays + d); cls = "dim"; }
    else if (d > days) { dt = new Date(y, m + 1, d - days); cls = "dim"; }
    else dt = new Date(y, m, d);
    if (dt.toDateString() === todayStr) cls += " today";
    if (marked.has(dt.toDateString())) cls += " has";
    cells += `<span class="${cls}">${dt.getDate()}</span>`;
  }
  $("#calTitle").textContent = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  $("#calGrid").innerHTML = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<b>${d}</b>`).join("") + cells;
}

// ---------- Academic records (add, edit, delete, search, filter) ----------

function fillSelects() {
  const courses = [...new Set([...COURSES, ...S.students.map((s) => s.course)])].sort();
  const keep = (sel, html) => { const v = sel.value; sel.innerHTML = html; if ([...sel.options].some((o) => o.value === v)) sel.value = v; };
  keep($("#fltCourse"), `<option value="">All courses</option>` + courses.map((c) => `<option>${esc(c)}</option>`).join(""));
  keep($("#fltSem"), `<option value="">All semesters</option>` + [1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${semText(n)}</option>`).join(""));
  keep($("#fCourse"), `<option value="">Select a course</option>` + courses.map((c) => `<option>${esc(c)}</option>`).join(""));
  keep($("#fSem"), [1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${semText(n)}</option>`).join(""));
  keep($("#setActive"), S.students.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("") || `<option value="">No students</option>`);
  if (active()) $("#setActive").value = active().id;
}

function filtered() {
  const q = $("#recSearch").value.trim().toLowerCase(), c = $("#fltCourse").value, sem = $("#fltSem").value, st = $("#fltStatus").value;
  const list = S.students.filter((s) =>
    (!q || [s.name, s.roll, s.email, s.course].some((v) => String(v).toLowerCase().includes(q))) &&
    (!c || s.course === c) && (!sem || String(s.semester) === sem) && (!st || s.status === st));
  const by = { name: (a, b) => a.name.localeCompare(b.name), cgpa: (a, b) => cgpa(b) - cgpa(a), att: (a, b) => b.attendance - a.attendance, new: (a, b) => b.createdAt - a.createdAt };
  return list.sort(by[$("#fltSort").value] || by.new);
}

function renderRecords() {
  const list = filtered(), cur = active();
  $("#recCount").textContent = `${list.length} ${list.length === 1 ? "student" : "students"}`;
  $("#empty").hidden = list.length > 0;
  $("#tbody").innerHTML = list.map((s) => `
    <tr>
      <td><div class="who"><span class="av sm">${esc(initials(s.name))}</span><div><b>${esc(s.name)}${cur && cur.id === s.id ? `<span class="tag">Viewing</span>` : ""}</b><small>${esc(s.email)}</small></div></div></td>
      <td>${esc(s.roll)}</td>
      <td><span class="chip blue">${esc(s.course)}</span></td>
      <td>${semText(s.semester)}</td>
      <td><b>${cgpa(s).toFixed(2)}</b></td>
      <td><span class="bar"><i style="width:${s.attendance}%"></i></span>${s.attendance}%</td>
      <td><span class="chip ${s.status === "Active" ? "green" : "orange"}">${esc(s.status)}</span></td>
      <td><div class="acts-cell">
        <button data-view="${s.id}" title="View dashboard as this student" aria-label="View ${esc(s.name)}">${ic("eye")}</button>
        <button data-edit="${s.id}" title="Edit" aria-label="Edit ${esc(s.name)}">${ic("edit")}</button>
        <button class="del" data-del="${s.id}" title="Delete" aria-label="Delete ${esc(s.name)}">${ic("trash")}</button>
      </div></td>
    </tr>`).join("");
}

function openStudent(id) {
  $$("#studentForm .err").forEach((e) => (e.textContent = ""));
  $("#studentForm").reset();
  const s = S.students.find((x) => x.id === id);
  $("#fId").value = s ? s.id : "";
  $("#studentTitle").textContent = s ? "Edit student" : "Add student";
  $("#saveBtn").textContent = s ? "Save changes" : "Save student";
  if (s) {
    $("#fName").value = s.name; $("#fRoll").value = s.roll; $("#fEmail").value = s.email;
    $("#fCourse").value = s.course; $("#fSem").value = s.semester; $("#fGpas").value = s.gpas.join(", ");
    $("#fAtt").value = s.attendance; $("#fAssign").value = s.assignments; $("#fStatus").value = s.status;
  }
  $("#studentModal").hidden = false;
  setTimeout(() => $("#fName").focus(), 40);
}

$("#studentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  $$("#studentForm .err").forEach((x) => (x.textContent = ""));
  const eid = $("#fId").value;
  const v = {
    name: $("#fName").value.trim(), roll: $("#fRoll").value.trim(), email: $("#fEmail").value.trim(),
    course: $("#fCourse").value, semester: +$("#fSem").value, status: $("#fStatus").value,
    attendance: parseFloat($("#fAtt").value), assignments: parseInt($("#fAssign").value || "0", 10)
  };
  const gpas = $("#fGpas").value.split(",").map((x) => x.trim()).filter(Boolean).map(Number);
  let ok = true;
  const bad = (f, m) => { document.querySelector(`.err[data-f="${f}"]`).textContent = m; ok = false; };

  if (v.name.length < 2) bad("name", "Enter the student's full name.");
  if (!v.roll) bad("roll", "Enter a roll number.");
  else if (S.students.some((s) => s.roll.toLowerCase() === v.roll.toLowerCase() && s.id !== eid)) bad("roll", "This roll number is already used.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) bad("email", "Enter a valid email address.");
  if (!v.course) bad("course", "Select a course.");
  if (!gpas.length || gpas.length > 8 || gpas.some((g) => isNaN(g) || g < 0 || g > 10)) bad("gpas", "Enter 1 to 8 GPA values between 0 and 10.");
  if (isNaN(v.attendance) || v.attendance < 0 || v.attendance > 100) bad("att", "Enter a number from 0 to 100.");
  if (isNaN(v.assignments) || v.assignments < 0) bad("assign", "Enter 0 or more.");
  if (!ok) return;

  v.gpas = gpas;
  if (eid) {
    const s = S.students.find((x) => x.id === eid);
    if (v.attendance !== s.attendance) v.prevAtt = s.attendance;
    Object.assign(s, v);
    log("edit", "purple", `${v.name}'s record updated`, "Academic details were changed");
    toast(`${v.name}'s record was updated.`);
  } else {
    const s = { id: uid(), ...v, prevAtt: v.attendance, createdAt: Date.now() };
    S.students.push(s);
    if (!S.activeId) S.activeId = s.id;
    log("users", "green", `${v.name} added`, `${v.course} - ${semText(v.semester)}`);
    toast(`${v.name} was added.`);
  }
  save(); $("#studentModal").hidden = true; renderAll();
});

function askConfirm(title, text, btn, fn) {
  $("#cTitle").textContent = title; $("#cText").textContent = text; $("#cYes").textContent = btn;
  pendingConfirm = fn; $("#confirmModal").hidden = false;
}

function deleteStudent(id) {
  const s = S.students.find((x) => x.id === id);
  if (!s) return;
  askConfirm("Delete this student?", `${s.name}'s record will be deleted permanently.`, "Delete", () => {
    S.students = S.students.filter((x) => x.id !== id);
    if (S.activeId === id) S.activeId = S.students[0] ? S.students[0].id : null;
    log("trash", "orange", `${s.name} removed`, "Student record deleted");
    save(); renderAll(); toast(`${s.name} was deleted.`);
  });
}

function exportCSV() {
  if (!S.students.length) return toast("There are no students to export.", "error");
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Name", "Roll no", "Email", "Course", "Semester", "CGPA", "Attendance %", "Assignments due", "Status"],
    ...S.students.map((s) => [s.name, s.roll, s.email, s.course, s.semester, cgpa(s).toFixed(2), s.attendance, s.assignments, s.status])];
  download(rows.map((r) => r.map(q).join(",")).join("\n"), "text/csv", "edutrack-report.csv");
  toast("Report downloaded.");
}

function download(text, type, name) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Attendance ----------

function renderAttendance() {
  const a = active() || BLANK, p = a.attendance, [label, color] = attBadge(p);
  $("#attSub").textContent = active() ? `Subject-wise attendance for ${a.name}.` : "Add a student to see attendance.";
  $("#attRing").innerHTML = `<div class="ring" style="--p:${p * 3.6}deg"><div><b>${p}%</b><small>Overall</small></div></div>
    <span class="chip ${color}">${label}</span>
    <p class="note" style="margin-top:12px">Students need at least 75% attendance to sit the exams.</p>`;
  const off = [3, -2, 5, -4, 1, -6];
  $("#attRows").innerHTML = CATALOG.filter((c) => c[2] <= a.semester).slice(-6).map((c, i) => {
    const held = 36 + (i * 4) % 10, pct = Math.max(0, Math.min(100, Math.round(p + off[i % 6])));
    const [l, col] = attBadge(pct);
    return `<tr><td><b>${c[1]}</b><small>${c[0]}</small></td><td>${Math.round(held * pct / 100)}/${held}</td><td><span class="bar"><i style="width:${pct}%"></i></span></td><td><b>${pct}%</b></td><td><span class="chip ${col}">${l}</span></td></tr>`;
  }).join("") || `<tr><td colspan="5" class="empty-note">No subjects yet.</td></tr>`;
  const low = S.students.filter((s) => s.attendance < 75 && s.status === "Active");
  $("#lowAtt").innerHTML = low.map((s) => `<div class="low-row"><span class="av sm">${esc(initials(s.name))}</span><div class="grow"><b>${esc(s.name)}</b><small>${esc(s.course)} · ${semText(s.semester)}</small></div><span class="chip red">${s.attendance}%</span><button class="btn ghost sm" data-view="${s.id}">View</button></div>`).join("")
    || `<p class="empty-note">Everyone is above 75%. Great work!</p>`;
}

// ---------- Courses ----------

function renderCourses() {
  const a = active() || BLANK;
  $("#courseSub").textContent = active() ? `Curriculum for ${a.name}, currently in ${semText(a.semester)}.` : "Add a student to see their courses.";
  const state = (c) => c[2] < a.semester ? "done" : c[2] === a.semester ? "now" : "next";
  const meta = { done: ["Completed", "green", 100], now: ["In progress", "blue", Math.round(a.attendance * 0.7)], next: ["Upcoming", "gray", 0] };
  $("#courseGrid").innerHTML = CATALOG.filter((c) => courseTab === "all" || state(c) === courseTab).map((c) => {
    const [l, col, pr] = meta[state(c)];
    return `<div class="course"><div class="top"><small>${c[0]}</small><span class="chip ${col}">${l}</span></div><h4>${c[1]}</h4><small>${semText(c[2])} · ${c[3]} credits</small><span class="bar"><i style="width:${pr}%"></i></span></div>`;
  }).join("") || `<p class="empty-note">No courses in this group.</p>`;
}

// ---------- Analytics ----------

function renderAnalytics() {
  const st = S.students, n = st.length;
  const avg = n ? st.reduce((t, s) => t + cgpa(s), 0) / n : 0, att = n ? st.reduce((t, s) => t + s.attendance, 0) / n : 0;
  const risk = st.filter((s) => s.attendance < 75 || cgpa(s) < 7).length;
  $("#kpis").innerHTML = [["users", "Total students", n, "registered"], ["cap", "Average CGPA", avg.toFixed(2), "across all students"],
    ["attendance", "Average attendance", att.toFixed(0) + "%", "across all students"], ["chart", "Need support", risk, "low CGPA or attendance"]]
    .map(([i, l, v, t]) => `<div class="stat"><div class="sic">${ic(i)}</div><div><small>${l}</small><strong>${v}</strong><span class="note">${t}</span></div></div>`).join("");

  const groups = {};
  st.forEach((s) => (groups[s.course] ||= []).push(cgpa(s)));
  $("#byCourse").innerHTML = Object.entries(groups).map(([c, v]) => [c, v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `<div class="hbar"><b>${esc(c)}</b><span class="bar"><i style="width:${v * 10}%"></i></span><b>${v.toFixed(2)}</b></div>`).join("") || `<p class="empty-note">No data yet.</p>`;

  const bands = [["9 and above", "#12a05c", (s) => cgpa(s) >= 9], ["8 to 9", "#1c58f2", (s) => cgpa(s) >= 8 && cgpa(s) < 9],
    ["7 to 8", "#f59a0b", (s) => cgpa(s) >= 7 && cgpa(s) < 8], ["Below 7", "#e5484d", (s) => cgpa(s) < 7]];
  let acc = 0, stops = [];
  $("#legend").innerHTML = bands.map(([l, c, f]) => {
    const k = st.filter(f).length, from = acc; acc += n ? (k / n) * 100 : 0;
    if (k) stops.push(`${c} ${from}% ${acc}%`);
    return `<li><i style="background:${c}"></i>${l}: <b>${k}</b></li>`;
  }).join("");
  $("#donut").style.background = stops.length ? `conic-gradient(${stops.join(",")})` : "var(--line)";

  $("#topList").innerHTML = [...st].sort((a, b) => cgpa(b) - cgpa(a)).slice(0, 5)
    .map((s) => `<li><span class="av sm">${esc(initials(s.name))}</span><div><b>${esc(s.name)}</b><br><small>${esc(s.course)}</small></div><b>${cgpa(s).toFixed(2)}</b></li>`).join("") || `<p class="empty-note">No data yet.</p>`;
}

// ---------- Announcements ----------

function renderAnn() {
  $("#annList").innerHTML = S.announcements.map((x) => `
    <div class="ann ${x.prio === "High" ? "high" : ""}">
      <span class="ai">${ic("megaphone")}</span>
      <div class="grow"><h4>${esc(x.title)} <span class="chip ${x.prio === "High" ? "red" : "gray"}">${esc(x.prio)}</span></h4><p>${esc(x.body)}</p><small>${ago(x.t)}</small></div>
      <div class="acts-cell"><button class="del" data-annDel="${x.id}" aria-label="Delete announcement">${ic("trash")}</button></div>
    </div>`).join("") || `<div class="panel empty"><b>No announcements</b><p>Post one to keep students informed.</p></div>`;
}

$("#annForm").addEventListener("submit", (e) => {
  e.preventDefault();
  $$("#annForm .err").forEach((x) => (x.textContent = ""));
  const title = $("#aTitle").value.trim(), body = $("#aBody").value.trim();
  let ok = true;
  if (title.length < 3) { document.querySelector('.err[data-f="atitle"]').textContent = "Enter a title."; ok = false; }
  if (body.length < 5) { document.querySelector('.err[data-f="abody"]').textContent = "Write a short message."; ok = false; }
  if (!ok) return;
  S.announcements.unshift({ id: uid(), title, body, prio: $("#aPrio").value, t: Date.now(), read: false });
  log("megaphone", "blue", "New announcement posted", title);
  save(); $("#annModal").hidden = true; e.target.reset(); renderAll(); toast("Announcement posted.");
});

// ---------- Settings ----------

function applyTheme() {
  document.body.classList.toggle("dark", !!S.dark);
  $("#darkToggle").checked = !!S.dark;
}

function restore(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.students)) throw new Error("bad file");
      d.activities ||= []; d.announcements ||= [];
      S = d; save(); applyTheme(); renderAll(); toast("Backup restored.");
    } catch (err) { toast("That file is not a valid EduTrack backup.", "error"); }
  };
  r.readAsText(f);
  e.target.value = "";
}

// ---------- Draw everything ----------

function renderAll() {
  fillSelects(); renderNav(); renderTop(); renderDash(); renderRecords();
  renderAttendance(); renderCourses(); renderAnalytics(); renderAnn();
}

// ---------- Events ----------

document.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;
  if ((el = t("[data-go]"))) go(el.dataset.go);
  if ((el = t("[data-act]")) && el.dataset.act === "csv") exportCSV();
  if ((el = t("[data-view]"))) { S.activeId = el.dataset.view; save(); renderAll(); go("dashboard"); toast(`Now viewing ${active().name}'s dashboard.`); }
  if ((el = t("[data-edit]"))) openStudent(el.dataset.edit);
  if ((el = t("[data-del]"))) deleteStudent(el.dataset.del);
  if ((el = t("[data-switch]"))) { S.activeId = el.dataset.switch; save(); $("#pMenu").hidden = true; renderAll(); }
  if ((el = t("[data-tab]"))) { courseTab = el.dataset.tab; $$("#courseTabs button").forEach((b) => b.classList.toggle("on", b === el)); renderCourses(); }
  if ((el = t("[data-anndel]"))) {
    const id = el.dataset.anndel;
    askConfirm("Delete announcement?", "This announcement will be removed for everyone.", "Delete", () => { S.announcements = S.announcements.filter((x) => x.id !== id); save(); renderAll(); toast("Announcement deleted."); });
  }
  if (t("[data-close]")) { $$(".overlay").forEach((o) => (o.hidden = true)); pendingConfirm = null; }
  if (e.target.classList.contains("overlay")) { e.target.hidden = true; pendingConfirm = null; }
  if (!t(".profile-wrap")) $("#pMenu").hidden = true;
  if ($("#sidebar").classList.contains("open") && !t("#sidebar") && !t("#menuBtn")) $("#sidebar").classList.remove("open");
});

$("#profileBtn").addEventListener("click", () => ($("#pMenu").hidden = !$("#pMenu").hidden));
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#bellBtn").addEventListener("click", () => {
  const n = S.announcements.filter((x) => !x.read).length;
  S.announcements.forEach((x) => (x.read = true));
  save(); renderTop(); go("announcements");
  toast(n ? `You had ${n} unread ${n === 1 ? "announcement" : "announcements"}.` : "You're all caught up.");
});
$("#themeBtn").addEventListener("click", () => { S.dark = !S.dark; save(); applyTheme(); });
$("#darkToggle").addEventListener("change", (e) => { S.dark = e.target.checked; save(); applyTheme(); });
$("#addBtn").addEventListener("click", () => openStudent(""));
$("#annBtn").addEventListener("click", () => { $$("#annForm .err").forEach((x) => (x.textContent = "")); $("#annModal").hidden = false; setTimeout(() => $("#aTitle").focus(), 40); });
$("#csvBtn").addEventListener("click", exportCSV);
$("#cYes").addEventListener("click", () => { const fn = pendingConfirm; $("#confirmModal").hidden = true; pendingConfirm = null; if (fn) fn(); });
$("#chartMode").addEventListener("change", (e) => { chartMode = e.target.value; renderChart(active() || BLANK); });
$("#calPrev").addEventListener("click", () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1); renderCal(); });
$("#calNext").addEventListener("click", () => { calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1); renderCal(); });
$("#keepBtn").addEventListener("click", () => { quoteIdx = (quoteIdx + 1) % QUOTES.length; $("#keepTitle").textContent = QUOTES[quoteIdx][0]; $("#keepText").textContent = QUOTES[quoteIdx][1]; });

["#recSearch", "#fltCourse", "#fltSem", "#fltStatus", "#fltSort"].forEach((id) => $(id).addEventListener(id === "#recSearch" ? "input" : "change", renderRecords));
$("#resetBtn").addEventListener("click", () => { $("#recSearch").value = ""; $("#globalSearch").value = ""; ["#fltCourse", "#fltSem", "#fltStatus"].forEach((i) => ($(i).value = "")); $("#fltSort").value = "new"; renderRecords(); });
$("#globalSearch").addEventListener("input", (e) => { $("#recSearch").value = e.target.value; if (e.target.value.trim()) go("records"); renderRecords(); });

$("#setActive").addEventListener("change", (e) => { S.activeId = e.target.value; save(); renderAll(); toast("Active student changed."); });
$("#backupBtn").addEventListener("click", () => { download(JSON.stringify(S, null, 2), "application/json", `edutrack-backup-${new Date().toISOString().slice(0, 10)}.json`); toast("Backup downloaded."); });
$("#restoreBtn").addEventListener("click", () => $("#restoreFile").click());
$("#restoreFile").addEventListener("change", restore);
$("#demoBtn").addEventListener("click", () => askConfirm("Reset to demo data?", "Your current students and announcements will be replaced.", "Reset", () => { const dark = S.dark; S = seed(); S.dark = dark; save(); renderAll(); toast("Demo data loaded."); }));
$("#wipeBtn").addEventListener("click", () => askConfirm("Delete all data?", "Every student and announcement will be removed permanently.", "Delete everything", () => { S.students = []; S.activeId = null; S.activities = []; S.announcements = []; save(); renderAll(); toast("All data deleted."); }));

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#globalSearch").focus(); }
  if (e.key === "Escape") { $$(".overlay").forEach((o) => (o.hidden = true)); $("#pMenu").hidden = true; $("#sidebar").classList.remove("open"); pendingConfirm = null; }
});

// ---------- Start ----------
applyTheme();
save();
renderAll();