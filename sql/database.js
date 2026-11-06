(function () {
  "use strict";
  var D = window.DB_DATA, loadErr = document.getElementById("loaderr"), NS = "http://www.w3.org/2000/svg";
  if (!D) { loadErr.textContent = "database-data.js was not found. Keep it in the same folder as database.html."; return; }
  function mk(ns, t, a, txt) {
    var e = ns ? document.createElementNS(NS, t) : document.createElement(t);
    for (var k in a) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  }
  function h(t, a, txt) { return mk(false, t, a || {}, txt); }
  function s(t, a, txt) { return mk(true, t, a || {}, txt); }
  function add(p) { for (var i = 1; i < arguments.length; i++) p.appendChild(arguments[i]); return p; }

  var T = D.tables.map(function (t) {
    return { name: t.name, group: t.group, desc: t.desc, cols: t.cols.map(function (c) {
      var f = c[2] ? c[2].split(" ") : [];
      return { name: c[0], type: c[1], pk: f.indexOf("pk") > -1, fk: f.indexOf("fk") > -1, uq: f.indexOf("uq") > -1, nul: f.indexOf("null") > -1, x: c[3] || {} };
    }) };
  });
  var by = {}; T.forEach(function (t) { by[t.name] = t; });
  var R = D.rels.map(function (r) { return { from: r[0], col: r[1], to: r[2], fc: r[3], tc: r[4], verb: r[5] }; });
  function pkOf(n) { return by[n].cols.filter(function (c) { return c.pk; })[0].name; }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function outs(n) { return uniq(R.filter(function (r) { return r.from === n; }).map(function (r) { return r.to; })); }
  function ins(n) { return uniq(R.filter(function (r) { return r.to === n; }).map(function (r) { return r.from; })); }

  var colCount = T.reduce(function (n, t) { return n + t.cols.length; }, 0);
  document.getElementById("about").textContent = D.about;
  document.getElementById("stats").textContent = T.length + " tables, " + colCount + " columns, " + R.length + " relationships";

  // ---------- diagrams ----------
  function marker(g, x, y, d, card) {
    function bar(o) { add(g, s("path", { "class": "mk", d: "M" + (x + d * o) + " " + (y - 6) + "V" + (y + 6) })); }
    var many = card === "many" || card === "zeroMany";
    if (many) add(g, s("path", { "class": "mk", d: "M" + (x + d * 12) + " " + y + "L" + x + " " + (y - 6) + "M" + (x + d * 12) + " " + y + "L" + x + " " + y + "M" + (x + d * 12) + " " + y + "L" + x + " " + (y + 6) }));
    if (card === "one") { bar(10); bar(15); }
    if (card === "zeroOne") bar(10);
    if (card === "many") bar(16);
    if (card === "zeroOne") add(g, s("circle", { "class": "mc", cx: x + d * 18, cy: y, r: 4.5 }));
    if (card === "zeroMany") add(g, s("circle", { "class": "mc", cx: x + d * 19, cy: y, r: 4.5 }));
  }

  function Diagram(host, mode) {
    var er = mode === "er", W = er ? 190 : 300, HH = 30, RH = 22, GX = er ? 130 : 150, GY = 30, PAD = 24, LOOP = 70;
    var st = { hub: false, names: true, scale: 1, manual: false, pin: null, hov: null };
    var hub = T.map(function (t) { return t.name; }).sort(function (a, b) { return ins(b).length - ins(a).length; })[0];
    var hubLinks = R.filter(function (r) { return r.to === hub; }).length;
    var box = {}, width = 0, height = 0;
    D.layout.forEach(function (c, ci) {
      var y = PAD;
      c.forEach(function (n) {
        var t = by[n], hh = HH + (er ? 2 : t.cols.length) * RH;
        box[n] = { t: t, x: PAD + ci * (W + GX), y: y, h: hh, ci: ci };
        y += hh + GY; height = Math.max(height, y);
      });
    });
    width = PAD * 2 + D.layout.length * W + (D.layout.length - 1) * GX + LOOP;
    function rowY(b, col) { var i = b.t.cols.map(function (c) { return c.name; }).indexOf(col); return b.y + HH + i * RH + RH / 2; }

    var eps = [], groups = {};
    R.forEach(function (r, i) {
      var a = box[r.from], b = box[r.to], sa = "r", sb = "l";
      if (a.ci > b.ci) { sa = "l"; sb = "r"; } else if (a.ci === b.ci) sb = "r";
      eps.push({ b: a, side: sa, col: r.col, other: b }, { b: b, side: sb, col: pkOf(r.to), other: a });
    });
    eps.forEach(function (e) { var k = e.b.t.name + e.side + (er ? "" : e.col); (groups[k] = groups[k] || []).push(e); });
    Object.keys(groups).forEach(function (k) {
      var l = groups[k].sort(function (a, b) { return a.other.y - b.other.y; }), n = l.length;
      l.forEach(function (e, j) {
        e.x = e.side === "r" ? e.b.x + W : e.b.x;
        e.y = er ? e.b.y + e.b.h * (j + 1) / (n + 1) : rowY(e.b, e.col) + (j - (n - 1) / 2) * 5;
      });
    });

    var bar = h("div", { "class": "bar" }), info = h("div", { "class": "info", "aria-live": "polite" });
    var cHub = h("input", { type: "checkbox" }), cNames = h("input", { type: "checkbox", checked: "" });
    var cnt = h("span"), legend = h("div", { "class": "legend" });
    D.groups.forEach(function (g) { add(legend, add(h("span", { "class": "g-" + g.id }), h("i", { "class": "sw" }), document.createTextNode(g.name))); });
    var bIn = h("button", { type: "button" }, "Zoom in"), bOut = h("button", { type: "button" }, "Zoom out"), bFit = h("button", { type: "button" }, "Fit");
    add(bar, add(h("label"), cHub, document.createTextNode("Hide links to " + hub + " ")), cnt, add(h("label"), cNames, document.createTextNode("Show relationship names")), bOut, bIn, bFit);
    var scroll = h("div", { "class": "scroll" });
    add(host, bar, legend, info, scroll);

    var svg = s("svg", { width: width, height: height, viewBox: "0 0 " + width + " " + height, role: "group", "aria-label": er ? "ER diagram" : "Schema diagram" });
    add(scroll, svg);
    var loopN = {};
    var links = R.map(function (r, i) {
      var p = eps[2 * i], q = eps[2 * i + 1], g = s("g", { "class": "link" }), d, mx, my;
      if (p.side === q.side) {
        var L = 36 + 14 * (loopN[r.from] = (loopN[r.from] || 0) + 1);
        d = "M" + p.x + " " + p.y + "C" + (p.x + L) + " " + p.y + " " + (q.x + L) + " " + q.y + " " + q.x + " " + q.y;
        mx = (p.x + 3 * (p.x + L) + 3 * (q.x + L) + q.x) / 8;
      } else {
        var dx = (q.x - p.x) / 2;
        d = "M" + p.x + " " + p.y + "C" + (p.x + dx) + " " + p.y + " " + (q.x - dx) + " " + q.y + " " + q.x + " " + q.y;
        mx = (p.x + q.x) / 2;
      }
      my = (p.y + q.y) / 2;
      add(g, s("path", { "class": "ln", d: d }));
      marker(g, p.x, p.y, p.side === "r" ? 1 : -1, r.fc);
      marker(g, q.x, q.y, q.side === "r" ? 1 : -1, r.tc);
      add(g, s("text", { "class": "lbl", x: mx, y: my - 4 }, r.verb));
      svg.appendChild(g);
      return g;
    });
    var boxEls = {};
    Object.keys(box).forEach(function (n) {
      var b = box[n], t = b.t, pks = t.cols.filter(function (c) { return c.pk; }).map(function (c) { return c.name; }).join(", ");
      var g = s("g", { "class": "box g-" + t.group, tabindex: 0, role: "button", "aria-label": "Table " + n + ", " + t.cols.length + " columns. " + outs(n).length + " links out, " + ins(n).length + " links in." });
      add(g, s("rect", { "class": "body", x: b.x, y: b.y, width: W, height: b.h, rx: 6 }), s("rect", { "class": "hdr", x: b.x, y: b.y, width: W, height: HH, rx: 6 }),
        s("rect", { "class": "hdr", x: b.x, y: b.y + HH - 8, width: W, height: 8 }), s("text", { "class": "ttl", x: b.x + 10, y: b.y + 20 }, n));
      if (er) {
        add(g, s("text", { x: b.x + 10, y: b.y + HH + 16 }, t.cols.length + " columns"), s("text", { "class": "dim2", x: b.x + 10, y: b.y + HH + RH + 16 }, "key: " + pks));
      } else {
        t.cols.forEach(function (c, i) {
          var y = b.y + HH + i * RH;
          if (i) add(g, s("line", { "class": "sep", x1: b.x, x2: b.x + W, y1: y, y2: y }));
          [["PK", c.pk], ["FK", c.fk], ["UQ", c.uq]].forEach(function (f, j) {
            if (f[1]) add(g, s("rect", { "class": "chip", x: b.x + 6 + j * 24, y: y + 5, width: 22, height: 12, rx: 3 }), s("text", { "class": "chipt", x: b.x + 17 + j * 24, y: y + 14, "text-anchor": "middle" }, f[0]));
          });
          add(g, s("text", { x: b.x + 82, y: y + 15 }, c.name), s("text", { "class": "dim2", x: b.x + W - 8, y: y + 15, "text-anchor": "end" }, c.type));
        });
      }
      function pick(e) { e.stopPropagation(); st.pin = st.pin === n ? null : n; apply(); }
      g.addEventListener("click", pick);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e); } });
      g.addEventListener("mouseenter", function () { st.hov = n; apply(); });
      g.addEventListener("mouseleave", function () { st.hov = null; apply(); });
      g.addEventListener("focus", function () { st.hov = n; apply(); });
      g.addEventListener("blur", function () { st.hov = null; apply(); });
      svg.appendChild(g);
      boxEls[n] = g;
    });
    svg.addEventListener("click", function () { st.pin = null; apply(); });

    function apply() {
      var act = st.pin || st.hov, rel = {};
      if (act) { rel[act] = 1; R.forEach(function (r) { if (r.from === act) rel[r.to] = 1; if (r.to === act) rel[r.from] = 1; }); }
      Object.keys(boxEls).forEach(function (n) { boxEls[n].classList.toggle("dim", !!act && !rel[n]); boxEls[n].classList.toggle("pin", st.pin === n); });
      var shown = 0;
      links.forEach(function (l, i) {
        var r = R[i], on = !!act && (r.from === act || r.to === act), gone = st.hub && r.to === hub;
        l.toggleAttribute("hidden", gone); if (!gone) shown++;
        l.classList.toggle("on", on); l.classList.toggle("dim", !!act && !on);
        l.querySelector(".lbl").toggleAttribute("hidden", !st.names);
      });
      cnt.textContent = shown + " of " + R.length + " lines";
      info.textContent = act ? act + " points to: " + (outs(act).join(", ") || "nothing") + ". Referenced by: " + (ins(act).join(", ") || "nothing") + "." : "Hover or click a table to see its relationships. Click again or click empty space to let go.";
    }
    function setScale(v) { st.scale = Math.max(0.3, Math.min(2.5, v)); svg.setAttribute("width", width * st.scale); svg.setAttribute("height", height * st.scale); }
    function fit() { var w = scroll.clientWidth; if (w) setScale(Math.min(1.3, (w - 4) / width)); }
    cHub.addEventListener("change", function () { st.hub = cHub.checked; apply(); });
    cNames.addEventListener("change", function () { st.names = cNames.checked; apply(); });
    bIn.addEventListener("click", function () { st.manual = true; setScale(st.scale * 1.2); });
    bOut.addEventListener("click", function () { st.manual = true; setScale(st.scale / 1.2); });
    bFit.addEventListener("click", function () { st.manual = false; fit(); });
    window.addEventListener("resize", function () { if (!st.manual) fit(); });
    apply();
    return { refit: function () { if (!st.manual) fit(); } };
  }

  // ---------- tables ----------
  function renderTables(p) {
    D.groups.forEach(function (g) {
      add(p, h("h2", {}, g.name));
      var grid = add(p, h("div", { "class": "cards" }));
      T.filter(function (t) { return t.group === g.id; }).forEach(function (t) {
        var tb = h("table"), body = h("tbody");
        add(tb, add(h("thead"), add(h("tr"), h("th", {}, "Column"), h("th", {}, "Type"), h("th", {}, "Keys"), h("th", {}, "Null"))), body);
        t.cols.forEach(function (c) {
          var k = [c.pk ? "PK" : "", c.fk ? "FK" : "", c.uq ? "UQ" : ""].filter(Boolean).join(" ");
          add(body, add(h("tr"), h("td", {}, c.name), h("td", {}, c.type), h("td", { "class": "key" }, k), h("td", {}, c.nul ? "yes" : "no")));
        });
        function links(list) {
          var f = h("span");
          if (!list.length) f.textContent = "nothing";
          list.forEach(function (n) { add(f, h("a", { href: "#t-" + n }, n)); });
          return f;
        }
        add(grid, add(h("article", { "class": "card g-" + g.id, id: "t-" + t.name }), h("h3", {}, t.name), h("p", {}, t.desc), tb,
          add(h("div", { "class": "foot" }), document.createTextNode("Points to: "), links(outs(t.name)), h("br"), document.createTextNode("Referenced by: "), links(ins(t.name)))));
      });
    });
  }

  // ---------- SQL ----------
  function buildSql() {
    var done = {}, order = [], out = ["CREATE DATABASE Teamly;\nGO\nUSE Teamly;\nGO\n"];
    function visit(n) { if (done[n]) return; done[n] = 1; outs(n).forEach(function (m) { if (m !== n) visit(m); }); order.push(n); }
    T.forEach(function (t) { visit(t.name); });
    order.forEach(function (n) {
      var t = by[n], L = [], pks = t.cols.filter(function (c) { return c.pk; });
      t.cols.forEach(function (c) {
        var l = "  " + c.name + " " + c.type;
        if (c.pk && pks.length === 1 && c.name === "id") l += " IDENTITY(1,1)";
        l += c.nul ? " NULL" : " NOT NULL";
        if (c.x.d != null) l += " DEFAULT " + c.x.d;
        L.push(l);
      });
      L.push("  CONSTRAINT PK_" + n + " PRIMARY KEY (" + pks.map(function (c) { return c.name; }).join(", ") + ")");
      t.cols.filter(function (c) { return c.uq; }).forEach(function (c) { L.push("  CONSTRAINT UQ_" + n + "_" + c.name + " UNIQUE (" + c.name + ")"); });
      R.filter(function (r) { return r.from === n; }).forEach(function (r) { L.push("  CONSTRAINT FK_" + n + "_" + r.col + " FOREIGN KEY (" + r.col + ") REFERENCES " + r.to + " (" + pkOf(r.to) + ")"); });
      t.cols.forEach(function (c) {
        if (c.x.e) L.push("  CONSTRAINT CK_" + n + "_" + c.name + " CHECK (" + c.name + " IN (" + c.x.e.map(function (v) { return "'" + v + "'"; }).join(", ") + "))");
        if (c.x.k) L.push("  CONSTRAINT CK_" + n + "_" + c.name + " CHECK (" + c.x.k + ")");
      });
      out.push("CREATE TABLE " + n + " (\n" + L.join(",\n") + "\n);\nGO\n");
    });
    D.indexes.forEach(function (i) { out.push("CREATE NONCLUSTERED INDEX IX_" + i[0] + "_" + i[1] + " ON " + i[0] + " (" + i[1] + ");"); });
    return out.join("\n") + "\nGO\n";
  }
  function renderSql(p) {
    var text = buildSql(), msg = h("span", { role: "status" });
    var bc = h("button", { type: "button", "class": "btn" }, "Copy"), bd = h("button", { type: "button", "class": "btn" }, "Download .sql");
    function done(ok) { msg.textContent = ok ? "Copied." : "Copy failed. Select the text and copy it by hand."; }
    function fallback() {
      var ta = h("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta); done(ok);
    }
    bc.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
    });
    bd.addEventListener("click", function () {
      var a = h("a", { download: "teamly-database.sql", href: URL.createObjectURL(new Blob([text], { type: "text/plain" })) });
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); msg.textContent = "Downloaded.";
    });
    add(p, add(h("div", { "class": "sqlbar" }), bc, bd, msg), add(h("pre"), h("code", {}, text)));
  }

  // ---------- rules and lessons ----------
  function renderRules(p) {
    add(p, h("h2", {}, "What the schema guarantees"));
    D.rules.forEach(function (r) { add(p, add(h("div", { "class": "rule" }), h("h3", {}, r[0]), h("p", {}, r[1]))); });
    add(p, h("h2", {}, "Stored status and what users see"));
    var wrap = add(p, h("div", { "class": "maps" }));
    D.statusMaps.forEach(function (m) {
      var body = h("tbody");
      add(wrap, add(h("div", { "class": "card g-accounts" }), h("h3", {}, m.title), add(h("table"), add(h("thead"), add(h("tr"), h("th", {}, "Stored"), h("th", {}, "Shown"))), body)));
      m.rows.forEach(function (r) { add(body, add(h("tr"), h("td", {}, r[0]), h("td", {}, r[1]))); });
    });
  }
  function renderLessons(p, list) {
    list.forEach(function (l) {
      var d = add(h("div", { "class": "lesson" }), h("h3", {}, l[0]), h("p", {}, l[1]));
      if (l[2]) add(d, add(h("pre"), h("code", {}, l[2])));
      add(p, d);
    });
  }

  var panels = ["er", "schema", "tables", "sql", "rules", "basics", "topics"].map(function (n) { return document.getElementById("panel-" + n); });
  var dias = [Diagram(panels[0], "er"), Diagram(panels[1], "schema")];
  renderTables(panels[2]); renderSql(panels[3]); renderRules(panels[4]);
  renderLessons(panels[5], D.basics); renderLessons(panels[6], D.topics);

  var tabs = [].slice.call(document.querySelectorAll("[role=tab]"));
  function show(i) {
    tabs.forEach(function (t, j) { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; panels[j].toggleAttribute("hidden", j !== i); });
    if (dias[i]) dias[i].refit();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { show(i); });
    t.addEventListener("keydown", function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n == null) return;
      e.preventDefault(); n = (n + tabs.length) % tabs.length; show(n); tabs[n].focus();
    });
  });
  show(0);
  loadErr.hidden = true;
})();