
const HMS = {
  keys: {
    doctors: "hms_doctors",
    patients: "hms_patients",
    appts: "hms_appointments",
    session: "hms_session"
  },
  list(key){ return JSON.parse(localStorage.getItem(key) || "[]"); },
  save(key, value){ localStorage.setItem(key, JSON.stringify(value)); },
  session(){ return JSON.parse(localStorage.getItem(this.keys.session) || "null"); },
  login(role, email){ localStorage.setItem(this.keys.session, JSON.stringify({ role, email })); },
  logout(){
    localStorage.removeItem(this.keys.session);
    window.location.href = "index.html";
  },
  currentUser(){
    const s = this.session();
    if(!s) return null;
    const key = s.role === "doctor" ? this.keys.doctors : this.keys.patients;
    return this.list(key).find(u => u.email === s.email) || null;
  }
};


function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showAlert(el, message, type = "error"){
  el.textContent = message;
  el.className = "alert show alert-" + type;
}

function formatDate(dateStr){
  return new Date(dateStr + "T00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function badge(status){
  return `<span class="badge badge-${status.toLowerCase()}">${status}</span>`;
}

function guard(role){
  const s = HMS.session();
  const user = HMS.currentUser();
  if(!s || s.role !== role || !user){
    window.location.href = role + "-auth.html";
    return null;
  }
  return user;
}

function renderNav(){
  const slot = document.getElementById("navLinks");
  if(!slot) return;
  const s = HMS.session();

  if(s && HMS.currentUser()){
    const dash = s.role === "doctor" ? "doctor-dashboard.html" : "patient-dashboard.html";
    slot.innerHTML = `
      <a class="btn btn-ghost" href="${dash}">My dashboard</a>
      <button class="btn btn-primary" id="logoutBtn">Log out</button>
    `;
    document.getElementById("logoutBtn").addEventListener("click", () => HMS.logout());
  } else {
    slot.innerHTML = `
      <a class="btn btn-ghost" href="doctor-auth.html">Doctor</a>
      <a class="btn btn-primary" href="patient-auth.html">Patient</a>
    `;
  }
}

function initAuth(){
  const role = document.body.dataset.role;     
  if(!role) return;

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".tab");
  const usersKey = role === "doctor" ? HMS.keys.doctors : HMS.keys.patients;
  const dashboard = role + "-dashboard.html";
  const val = id => document.getElementById(id).value.trim();

  function showTab(targetId){
    tabs.forEach(t => t.classList.toggle("active", t.dataset.target === targetId));
    loginForm.classList.toggle("hidden", targetId !== "loginForm");
    registerForm.classList.toggle("hidden", targetId !== "registerForm");
  }
  tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.target)));
  if(new URLSearchParams(window.location.search).get("tab") === "register"){
    showTab("registerForm");
  }

  registerForm.addEventListener("submit", e => {
    e.preventDefault();
    const box = document.getElementById("registerAlert");
    const name = val("rName");
    const email = val("rEmail").toLowerCase();
    const password = document.getElementById("rPassword").value;
    const confirm = document.getElementById("rConfirm").value;

    const extra = role === "doctor"
      ? { specialty: val("rSpecialty") }
      : { age: val("rAge"), phone: val("rPhone") };

    if(!name || !email || !password || Object.values(extra).some(v => !v)){
      showAlert(box, "Please fill in every field.");
      return;
    }
    if(password.length < 6){
      showAlert(box, "Password should be at least 6 characters.");
      return;
    }
    if(password !== confirm){
      showAlert(box, "Passwords don't match.");
      return;
    }

    const users = HMS.list(usersKey);
    if(users.some(u => u.email === email)){
      showAlert(box, "An account with this email already exists.");
      return;
    }

    users.push({ name, email, password, ...extra });
    HMS.save(usersKey, users);
    HMS.login(role, email);
    showAlert(box, "Account created! Opening your dashboard…", "success");
    setTimeout(() => window.location.href = dashboard, 700);
  });

  // Log in
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const box = document.getElementById("loginAlert");
    const email = val("lEmail").toLowerCase();
    const password = document.getElementById("lPassword").value;

    const user = HMS.list(usersKey).find(u => u.email === email && u.password === password);
    if(!user){
      showAlert(box, "Email or password is incorrect.");
      return;
    }
    HMS.login(role, email);
    showAlert(box, "Welcome back! Opening your dashboard…", "success");
    setTimeout(() => window.location.href = dashboard, 500);
  });
}

function initDoctorDashboard(){
  const body = document.getElementById("apptBody");
  if(!body) return;
  const user = guard("doctor");
  if(!user) return;

  document.getElementById("welcomeName").textContent = "Welcome, Dr. " + user.name;
  document.getElementById("welcomeSub").textContent = user.specialty + " · " + user.email;

  function render(){
    const mine = HMS.list(HMS.keys.appts)
      .filter(a => a.doctorEmail === user.email)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    document.getElementById("statTotal").textContent = mine.length;
    document.getElementById("statPending").textContent = mine.filter(a => a.status === "Pending").length;
    document.getElementById("statConfirmed").textContent = mine.filter(a => a.status === "Confirmed").length;

    if(mine.length === 0){
      body.innerHTML = `<tr><td colspan="6" class="empty-cell">No appointment requests yet.</td></tr>`;
      return;
    }

    body.innerHTML = mine.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.patientName)}</strong></td>
        <td>${escapeHtml(a.patientPhone)}</td>
        <td>${formatDate(a.date)}<br><small>${escapeHtml(a.time)}</small></td>
        <td>${escapeHtml(a.reason)}</td>
        <td>${badge(a.status)}</td>
        <td>
          ${a.status === "Pending" ? `
            <div class="cell-actions">
              <button class="btn btn-primary btn-sm" data-id="${a.id}" data-action="accept">Accept</button>
              <button class="btn btn-ghost btn-sm" data-id="${a.id}" data-action="decline">Decline</button>
            </div>` : "—"}
        </td>
      </tr>
    `).join("");
  }

  body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-id]");
    if(!btn) return;
    const all = HMS.list(HMS.keys.appts);
    const appt = all.find(a => String(a.id) === btn.dataset.id);
    if(!appt) return;
    appt.status = btn.dataset.action === "accept" ? "Confirmed" : "Declined";
    HMS.save(HMS.keys.appts, all);
    render();
  });

  render();
}

function initPatientDashboard(){
  const form = document.getElementById("bookForm");
  if(!form) return;
  const user = guard("patient");
  if(!user) return;

  document.getElementById("welcomeName").textContent = "Welcome, " + user.name;
  document.getElementById("welcomeSub").textContent = "Book a visit and track your appointments here.";

  const doctors = HMS.list(HMS.keys.doctors);
  const select = document.getElementById("apDoctor");
  select.innerHTML = doctors.length === 0
    ? `<option value="">No doctors have registered yet</option>`
    : `<option value="">Choose a doctor</option>` + doctors.map(d =>
        `<option value="${escapeHtml(d.email)}">Dr. ${escapeHtml(d.name)} — ${escapeHtml(d.specialty)}</option>`
      ).join("");

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  document.getElementById("apDate").min = today;

  const list = document.getElementById("apptList");
  const box = document.getElementById("bookAlert");

  function render(){
    const mine = HMS.list(HMS.keys.appts)
      .filter(a => a.patientEmail === user.email)
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

    if(mine.length === 0){
      list.innerHTML = `<div class="empty-box">You haven't booked anything yet. Use the form to request your first appointment.</div>`;
      return;
    }

    list.innerHTML = mine.map(a => `
      <article class="appt-item">
        <div class="appt-top">
          <strong>Dr. ${escapeHtml(a.doctorName)}</strong>
          ${badge(a.status)}
        </div>
        <p class="appt-meta">${formatDate(a.date)} at ${escapeHtml(a.time)}</p>
        <p class="appt-meta">${escapeHtml(a.reason)}</p>
        ${(a.status === "Pending" || a.status === "Confirmed")
          ? `<button class="btn btn-ghost btn-sm" data-id="${a.id}">Cancel appointment</button>` : ""}
      </article>
    `).join("");
  }

  // Cancel button
  list.addEventListener("click", e => {
    const btn = e.target.closest("button[data-id]");
    if(!btn) return;
    const all = HMS.list(HMS.keys.appts);
    const appt = all.find(a => String(a.id) === btn.dataset.id);
    if(!appt) return;
    appt.status = "Cancelled";
    HMS.save(HMS.keys.appts, all);
    render();
  });

  // Book appointment
  form.addEventListener("submit", e => {
    e.preventDefault();
    const doctorEmail = select.value;
    const date = document.getElementById("apDate").value;
    const time = document.getElementById("apTime").value;
    const reason = document.getElementById("apReason").value.trim();

    if(!doctorEmail || !date || !time || !reason){
      showAlert(box, "Please choose a doctor, a date, a time, and add a reason.");
      return;
    }

    const doctor = doctors.find(x => x.email === doctorEmail);
    const all = HMS.list(HMS.keys.appts);
    all.push({
      id: Date.now(),
      patientEmail: user.email,
      patientName: user.name,
      patientPhone: user.phone,
      doctorEmail: doctor.email,
      doctorName: doctor.name,
      date, time, reason,
      status: "Pending"
    });
    HMS.save(HMS.keys.appts, all);

    form.reset();
    showAlert(box, "Request sent. The doctor will confirm or decline it.", "success");
    render();
  });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  initAuth();
  initDoctorDashboard();
  initPatientDashboard();
});