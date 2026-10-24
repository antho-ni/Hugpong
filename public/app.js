// Hugpong Kape front end. Talks to the Express API in server.js.
(function () {
  "use strict";

  var peso = "₱";
  var VIEWS = ["login", "register", "account", "staff"];
  var DRINKS = [];
  var cur = 0;
  var me = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function pulseValues() {
    ["sp-name", "sp-price", "v-f", "v-b", "v-s", "v-total"].forEach(function (id) {
      var node = $(id);
      node.classList.remove("value-pulse");
      void node.offsetWidth;
      node.classList.add("value-pulse");
    });
  }

  function setupRevealAnimations() {
    var targets = document.querySelectorAll(".band > .in, footer .cols > div, footer .disc");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (target) { target.classList.add("is-visible"); });
      return;
    }

    Array.prototype.forEach.call(targets, function (target) { target.classList.add("reveal"); });
    var observer = new IntersectionObserver(function (entries, currentObserver) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(targets, function (target) { observer.observe(target); });
  }

  function setupBeanMotion() {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Array.prototype.forEach.call(document.querySelectorAll(".bean-group animateMotion"), function (motion) {
      motion.remove();
    });
  }

  // Small fetch wrapper: sends JSON, rejects with the server's error message.
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", credentials: "same-origin", headers: {} };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var err = new Error(j.error || "Something went wrong. Try again.");
          err.status = r.status;
          err.field = j.field;
          throw err;
        }
        return j;
      });
    }).catch(function (err) {
      if (err.status) throw err;
      var networkError = new Error("The server could not be reached. Check your connection and try again.");
      networkError.cause = err;
      throw networkError;
    });
  }

  function showFormError(message, fieldId) {
    var field = fieldId ? $(fieldId) : null;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
    return message;
  }

  function clearFormErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid='true']"), function (field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function setSubmitState(button, busy, busyText) {
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = busy;
    button.setAttribute("aria-busy", busy ? "true" : "false");
    button.textContent = busy ? busyText : button.dataset.defaultText;
  }

  /* ---------- Menu and money split ---------- */
  function renderDrinks() {
    var ul = $("drinks");
    ul.textContent = "";
    if (!DRINKS.length) {
      var li0 = el("li", "fine", "The menu could not be loaded. Check that the server is running.");
      ul.appendChild(li0);
      return;
    }
    DRINKS.forEach(function (d, i) {
      var li = el("li");
      li.style.animationDelay = (i * 70) + "ms";
      var b = el("button", "drink");
      b.type = "button";
      b.setAttribute("aria-pressed", i === cur ? "true" : "false");
      var nm = el("span", "nm", d.name);
      if (d.tag) nm.appendChild(el("span", "tag", d.tag));
      b.appendChild(nm);
      b.appendChild(el("span", "pr", peso + d.price));
      b.appendChild(el("span", "ds", d.description));
      b.addEventListener("click", function () { cur = i; renderDrinks(); renderSplit(); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function renderSplit() {
    var d = DRINKS[cur];
    if (!d) return;
    var f = Math.round(d.price * 0.3);
    var b = Math.round(d.price * 0.4);
    var s = d.price - f - b;
    var extra = $("sponsor").checked ? 10 : 0;
    var total = d.price + extra;
    $("sp-name").textContent = d.name;
    $("sp-price").textContent = peso + total + " per cup" + (extra ? " with sponsor add-on" : "");
    $("bar-f").style.width = (f / total * 100) + "%";
    $("bar-b").style.width = (b / total * 100) + "%";
    $("bar-s").style.width = (s / total * 100) + "%";
    $("v-f").textContent = peso + (f + extra);
    $("v-b").textContent = peso + b;
    $("v-s").textContent = peso + s;
    $("v-total").textContent = peso + (f + extra);
    pulseValues();
  }
  $("sponsor").addEventListener("change", renderSplit);

  function loadMenu() {
    return api("/api/menu").then(function (r) {
      DRINKS = r.menu || [];
      if (cur >= DRINKS.length) cur = 0;
    }).catch(function () { DRINKS = []; }).then(function () {
      renderDrinks();
      renderSplit();
    });
  }

  /* ---------- Landing page stamp card (just a try-it toy) ---------- */
  var stamped = [];
  function renderStamps() {
    var box = $("stamps");
    box.textContent = "";
    for (var i = 0; i < 10; i++) {
      (function (i) {
        var isFree = i === 9;
        var b = el("button", isFree ? "free" : "", isFree ? "FREE" : String(i + 1));
        b.type = "button";
        b.setAttribute("aria-pressed", stamped[i] ? "true" : "false");
        b.setAttribute("aria-label", isFree ? "Free tenth cup" : "Cup " + (i + 1));
        b.addEventListener("click", function () { stamped[i] = !stamped[i]; renderStamps(); });
        box.appendChild(b);
      })(i);
    }
    var n = 0;
    for (var k = 0; k < 9; k++) if (stamped[k]) n++;
    $("stamp-count").textContent = stamped[9] ? "Enjoy your free cup." : n + " of 9 cups stamped" + (n === 9 ? ". Your next one is free." : "");
  }

  /* ---------- Opening list ---------- */
  $("join-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("join-msg");
    var v = $("email").value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { msg.textContent = "Enter an email like name@example.com."; return; }
    api("/api/interest", { method: "POST", body: { email: v } }).then(function () {
      msg.textContent = "Thanks. Your email is on the opening list.";
      $("email").value = "";
    }).catch(function (err) { msg.textContent = err.message; });
  });

  /* ---------- Top bar links ---------- */
  function renderAuthLinks() {
    var box = $("authlinks");
    box.textContent = "";
    if (me) {
      var a = el("a", "", me.role === "staff" ? "Staff desk" : "My account");
      a.href = me.role === "staff" ? "#staff" : "#account";
      box.appendChild(a);
      var b = el("button", "", "Log out");
      b.type = "button";
      b.addEventListener("click", logout);
      box.appendChild(b);
    } else {
      var l = el("a", "", "Log in");
      l.href = "#login";
      box.appendChild(l);
      var r = el("a", "pill", "Register");
      r.href = "#register";
      box.appendChild(r);
    }
  }

  function go(h) { if (location.hash === "#" + h) route(); else location.hash = h; }

  function logout() {
    api("/api/logout", { method: "POST" }).catch(function () {}).then(function () {
      me = null;
      go("top");
    });
  }

  /* ---------- Customer account ---------- */
  function stampGrid(count) {
    var grid = el("div", "stamps");
    for (var i = 0; i < 10; i++) {
      var b = el("button", i === 9 ? "free" : "", i === 9 ? "FREE" : String(i + 1));
      b.type = "button";
      b.disabled = true;
      b.setAttribute("aria-label", i === 9 ? "Free tenth cup" : "Cup " + (i + 1));
      b.setAttribute("aria-pressed", (i < 9 ? i < count : count >= 9) ? "true" : "false");
      grid.appendChild(b);
    }
    return grid;
  }

  function logoutLink(body) {
    var out = el("button", "linkbtn", "Log out");
    out.type = "button";
    out.addEventListener("click", logout);
    var p = el("p", "fine");
    p.appendChild(out);
    body.appendChild(p);
  }

  function renderAccount() {
    var u = me;
    var body = $("account-body");
    body.textContent = "";
    if (!u) return;
    body.appendChild(el("p", "eyebrow", "Your account"));
    var h = el("h1", "h2", "Hi, " + u.name);
    h.id = "h-account";
    h.tabIndex = -1;
    body.appendChild(h);
    var wrap = el("div", "acct");
    var card = el("div", "stamp");
    card.appendChild(el("h3", "", "Your stamp card"));
    card.appendChild(el("p", "s", "Nine cups earn the tenth free. Staff add a stamp each time you buy."));
    card.appendChild(stampGrid(u.stamps));
    card.appendChild(el("p", "count", u.stamps >= 9 ? "Your next cup is free. Show this card at the counter." : u.stamps + " of 9 cups stamped"));
    wrap.appendChild(card);
    var side = el("ul", "perks");
    [
      ["Sent to the farmers", peso + u.sponsored + " through sponsor add-ons"],
      ["Cups bought", u.cups + " so far"],
      ["Student price", u.student ? peso + "10 off any drink is on." : u.studentPending ? "Pending staff verification." : "Not enabled for this account."]
    ].forEach(function (row) {
      var li = el("li");
      li.appendChild(el("b", "", row[0]));
      li.appendChild(el("span", "", row[1]));
      side.appendChild(li);
    });
    wrap.appendChild(side);
    body.appendChild(wrap);
    body.appendChild(el("p", "fine", "Ask the staff at the counter to add a stamp when you buy."));
    logoutLink(body);
    var hd = $("h-account");
    if (hd && document.activeElement === document.body) hd.focus({ preventScroll: true });
  }

  function refreshAccount() {
    api("/api/me").then(function (r) {
      me = r.user;
      if (!me) { renderAuthLinks(); go("login"); return; }
      renderAccount();
    }).catch(function () { $("account-body").textContent = "Could not load your account. Reload the page."; });
  }

  /* ---------- Staff desk ---------- */
  var staffNote = "";
  function renderStaff(list) {
    var body = $("staff-body");
    body.textContent = "";
    body.appendChild(el("p", "eyebrow", "Staff desk"));
    var h = el("h1", "h2", "Counter and menu");
    h.id = "h-staff";
    h.tabIndex = -1;
    body.appendChild(h);

    var cups = 0, spons = 0;
    list.forEach(function (c) { cups += c.cups; spons += c.sponsored; });
    var k = el("div", "kpis");
    [[String(list.length), "customers registered"], [String(cups), "cups stamped"], [peso + spons, "sponsored for farmers"]].forEach(function (x) {
      var d = el("div");
      d.appendChild(el("b", "", x[0]));
      d.appendChild(el("span", "", x[1]));
      k.appendChild(d);
    });
    body.appendChild(k);

    var note = el("p", "formmsg", staffNote);
    note.setAttribute("role", "alert");
    body.appendChild(note);

    var grid = el("div", "staffgrid");

    var s1 = el("section");
    s1.appendChild(el("h2", "", "Customers"));
    var led = el("div", "ledger"), sc = el("div", "scroll"), tb = el("table");
    var thead = el("thead"), hr = el("tr");
    ["Customer", "Student status", "Stamps", "Sponsored", "Actions"].forEach(function (t) { hr.appendChild(el("th", "", t)); });
    thead.appendChild(hr);
    tb.appendChild(thead);
    var tbody = el("tbody");
    if (!list.length) {
      var er = el("tr");
      var ec = el("td", "", "No customers yet. Register one from the Register page, then come back here.");
      ec.colSpan = 5;
      er.appendChild(ec);
      tbody.appendChild(er);
    }
    list.forEach(function (c) {
      var tr = el("tr");
      var t1 = el("td", "", c.name);
      t1.appendChild(el("div", "fine", c.email));
      tr.appendChild(t1);
      var studentCell = el("td");
      if (c.student) {
        studentCell.appendChild(el("span", "status-badge verified", "Verified"));
      } else if (c.studentPending) {
        studentCell.appendChild(el("span", "status-badge pending", "Pending"));
        var verifyActions = el("div", "acts");
        verifyActions.appendChild(actionBtn("mini fill", "Verify", "/api/staff/customers/" + c.id + "/student/verify", false));
        verifyActions.appendChild(actionBtn("mini", "Reject", "/api/staff/customers/" + c.id + "/student/reject", false));
        studentCell.appendChild(verifyActions);
      } else {
        studentCell.appendChild(el("span", "fine", "Not requested"));
      }
      tr.appendChild(studentCell);
      tr.appendChild(el("td", "num", c.stamps + " / 9"));
      tr.appendChild(el("td", "num", peso + c.sponsored));
      var ta = el("div", "acts");
      var full = c.stamps >= 9;
      ta.appendChild(actionBtn("mini fill", "Add stamp", "/api/staff/customers/" + c.id + "/stamp", full));
      ta.appendChild(actionBtn("mini", "+" + peso + "10 sponsor", "/api/staff/customers/" + c.id + "/sponsor", false));
      if (full) ta.appendChild(actionBtn("mini", "Redeem free cup", "/api/staff/customers/" + c.id + "/redeem", false));
      var cell = el("td");
      cell.appendChild(ta);
      tr.appendChild(cell);
      tbody.appendChild(tr);
    });
    tb.appendChild(tbody);
    sc.appendChild(tb);
    led.appendChild(sc);
    s1.appendChild(led);
    grid.appendChild(s1);

    var s2 = el("section");
    s2.appendChild(el("h2", "", "Menu prices"));
    var f = el("form", "menuedit");
    f.noValidate = true;
    DRINKS.forEach(function (d, i) {
      var lb = el("label", "", d.name);
      lb.setAttribute("for", "menu-" + i);
      var inp = el("input");
      inp.type = "number";
      inp.id = "menu-" + i;
      inp.min = "1";
      inp.max = "999";
      inp.step = "1";
      inp.value = String(d.price);
      lb.appendChild(inp);
      f.appendChild(lb);
    });
    var go2 = el("div", "go");
    var sv = el("button", "btn primary", "Save prices");
    sv.type = "submit";
    var mm = el("span", "formmsg");
    mm.setAttribute("role", "status");
    go2.appendChild(sv);
    go2.appendChild(mm);
    f.appendChild(go2);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var prices = DRINKS.map(function (d, i) { return { id: d.id, price: parseInt($("menu-" + i).value, 10) }; });
      api("/api/staff/menu", { method: "PUT", body: { prices: prices } }).then(function (r) {
        DRINKS = r.menu;
        renderDrinks();
        renderSplit();
        mm.style.color = "var(--green)";
        mm.textContent = "Saved. The public menu now shows these prices.";
      }).catch(function (err) {
        mm.style.color = "";
        mm.textContent = err.message;
      });
    });
    s2.appendChild(f);
    grid.appendChild(s2);
    body.appendChild(grid);
    logoutLink(body);
  }

  function actionBtn(cls, label, url, disabled) {
    var b = el("button", cls, label);
    b.type = "button";
    b.disabled = disabled;
    b.addEventListener("click", function () {
      b.disabled = true;
      api(url, { method: "POST" }).then(function () { staffNote = ""; }).catch(function (err) { staffNote = err.message; }).then(loadStaff);
    });
    return b;
  }

  function loadStaff() {
    api("/api/staff/customers").then(function (r) {
      renderStaff(r.customers);
    }).catch(function (err) {
      if (err.status === 401 || err.status === 403) { me = null; renderAuthLinks(); go("login"); return; }
      $("staff-body").textContent = "Could not load the customer list. Reload the page.";
    });
  }

  /* ---------- Router: #login, #register, #account, #staff, anything else is the home page ---------- */
  function route() {
    var h = (location.hash || "").replace("#", "");
    if (h === "account" && me && me.role === "staff") h = "staff";
    if (h === "account" && !me) h = "login";
    if (h === "staff" && (!me || me.role !== "staff")) h = me ? "account" : "login";
    if ((h === "login" || h === "register") && me) h = me.role === "staff" ? "staff" : "account";
    var isView = VIEWS.indexOf(h) >= 0;
    $("view-home").hidden = isView;
    VIEWS.forEach(function (v) { $("view-" + v).hidden = v !== h; });
    renderAuthLinks();
    if (h === "account") refreshAccount();
    if (h === "staff") loadStaff();
    if (isView) {
      window.scrollTo(0, 0);
      var hd = $("h-" + h);
      if (hd) hd.focus({ preventScroll: true });
    } else if (h && document.getElementById(h)) {
      document.getElementById(h).scrollIntoView();
    }
  }
  window.addEventListener("hashchange", route);

  /* ---------- Forms ---------- */
  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("li-msg");
    var btn = e.target.querySelector("button[type=submit]");
    var email = $("li-email").value.trim();
    var password = $("li-pw").value;
    clearFormErrors(e.target);
    msg.textContent = "";
    if (!email) { msg.textContent = showFormError("Enter your email address.", "li-email"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = showFormError("Enter a valid email address.", "li-email"); return; }
    if (!password) { msg.textContent = showFormError("Enter your password.", "li-pw"); return; }
    setSubmitState(btn, true, "Logging in...");
    api("/api/login", { method: "POST", body: { email: email, password: password } }).then(function (r) {
      me = r.user;
      $("li-pw").value = "";
      go(me.role === "staff" ? "staff" : "account");
    }).catch(function (err) {
      msg.textContent = showFormError(err.message, err.field === "password" ? "li-pw" : err.field === "email" ? "li-email" : null);
    }).then(function () { setSubmitState(btn, false); });
  });

  $("reg-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("rg-msg");
    var btn = e.target.querySelector("button[type=submit]");
    var name = $("rg-name").value.trim();
    var email = $("rg-email").value.trim();
    var password = $("rg-pw").value;
    var confirmation = $("rg-pw2").value;
    clearFormErrors(e.target);
    msg.textContent = "";
    if (!name) { msg.textContent = showFormError("Enter your name.", "rg-name"); return; }
    if (name.length > 60) { msg.textContent = showFormError("Your name must be 60 characters or fewer.", "rg-name"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = showFormError("Enter a valid email address.", "rg-email"); return; }
    if (password.length < 8 || password.length > 72) { msg.textContent = showFormError("Use a password with 8 to 72 characters.", "rg-pw"); return; }
    if (password !== confirmation) { msg.textContent = showFormError("The two passwords do not match.", "rg-pw2"); return; }
    setSubmitState(btn, true, "Creating account...");
    api("/api/register", {
      method: "POST",
      body: { name: name, email: email, password: password, student: $("rg-student").checked }
    }).then(function (r) {
      me = r.user;
      $("rg-pw").value = "";
      $("rg-pw2").value = "";
      go("account");
    }).catch(function (err) {
      msg.textContent = showFormError(err.message, err.field === "password" ? "rg-pw" : err.field === "email" ? "rg-email" : err.field === "name" ? "rg-name" : null);
    }).then(function () { setSubmitState(btn, false); });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".password-toggle"), function (toggle) {
    toggle.addEventListener("click", function () {
      var field = $(toggle.getAttribute("data-password-target"));
      var showing = field.type === "text";
      field.type = showing ? "password" : "text";
      toggle.textContent = showing ? "Show" : "Hide";
      toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  /* ---------- Start ---------- */
  renderStamps();
  setupRevealAnimations();
  setupBeanMotion();
  api("/api/me").then(function (r) { me = r.user; }).catch(function () { me = null; }).then(function () {
    route();
    loadMenu();
  });
})();
