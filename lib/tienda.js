/* Tienda genérica de pedidos. Cada carpeta define window.TIENDA antes de cargar este archivo:
   { proveedor, clave, color, nota, notas:bool, libre:bool,
     secciones:[{t, c, img, grande:bool, items:[{id, n, pr, code, img}]}] }
   - Items con img se muestran como tarjetas; sin img, como filas.
   - libre: cada sección permite agregar líneas escribiendo código/descripción (catálogos sin lista).
   - notas: cada producto tiene un campo de nota (sabor, color, variante). */
(function () {
  const T = window.TIENDA;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const KEY = "pedido-" + T.clave + "-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const st = Object.assign({q: {}, notes: {}, libres: []}, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  document.documentElement.style.setProperty("--c", T.color || "#1f5fae");

  const ITEMS = []; const byId = {};
  const varOf = {};
  T.secciones.forEach((s, si) => { s.si = si; (s.items || []).forEach(i => { i.sec = s; ITEMS.push(i); byId[i.id] = i; (i.vars || []).forEach(v => { varOf[v.id] = i; v.p = i; }); }); });
  const CATS = [...new Set(T.secciones.map(s => s.c || s.t))];
  let cat = "Todas", q = "", only = false;

  document.body.insertAdjacentHTML("afterbegin", `
  <a href="../" class="back">← Proveedores</a>
  <header><div class="wrap">
    <div class="top"><h1>Pedido <span>${esc(T.proveedor)}</span></h1><div class="meta" id="count"></div></div>
    <div class="search"><input type="search" id="q" placeholder="Buscar producto o código…" autocomplete="off">
      <label class="toggle"><input type="checkbox" id="only"> Solo lo pedido</label></div>
    <div class="chips" id="chips" role="toolbar" aria-label="Categorías"></div>
  </div></header>
  <main class="wrap" id="list"></main>
  <div class="wrap disc">${esc(T.nota || "")} El pedido en curso se guarda en este navegador.</div>
  <div class="bar"><div class="wrap"><div class="sum"><b id="bTotal">0 unidades</b><small id="bInfo">Nada seleccionado aún</small></div>
    <button class="btn" id="open" disabled>Revisar pedido</button></div></div>
  <div class="overlay" id="ov" hidden><div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dt">
    <div class="dh"><h2 id="dt">Tu pedido</h2><button class="x" id="close" aria-label="Cerrar">×</button></div>
    <div class="dl" id="olist"></div>
    <div class="df"><div class="total"><span id="oInfo"></span><b id="oTotal"></b></div>
      <div class="acts"><button class="btn" id="xlsx">Descargar Excel</button><button class="btn" id="pdf">Descargar PDF</button><button class="btn ghost" id="copy">Copiar para WhatsApp</button></div>
      <div class="msg" id="msg" aria-live="polite"></div><div class="confirm" id="clearBox"></div>
      <textarea id="fallback" hidden readonly rows="6" style="width:100%"></textarea></div></div></div>
  <div class="lb" id="lb" hidden><img id="lbImg" alt=""></div>`);

  const money = v => "₡" + Math.round(v).toLocaleString("en-US");
  const priceTag = i => i.precio ? `<div class="price">${money(i.precio)} <small>por paquete</small></div>` : "";
  const img = f => f ? (f.includes("/") || f.includes(".") ? f : "img/" + f + ".jpg") : "";
  function chips() { $("#chips").innerHTML = ["Todas", ...CATS].map(c => `<button class="chip" aria-pressed="${c===cat}" data-c="${esc(c)}">${esc(c)}</button>`).join(""); }
  const hay = i => norm([i.n, i.pr, i.code, i.sec && i.sec.t, ...(i.vars || []).map(v => v.pr + " " + v.code)].join(" "));
  const qOf = i => i.vars ? i.vars.reduce((a, v) => a + (st.q[v.id] || 0), 0) : (st.q[i.id] || 0);
  function okItem(i) {
    if (only && !(qOf(i) > 0)) return false;
    if (q) { const h = hay(i); return norm(q).split(/\s+/).every(t => h.includes(t)); }
    return true;
  }
  function stepper(id, n, pref = "q-") {
    return `<div class="step"><button data-d="-1" data-id="${esc(id)}" aria-label="Menos" ${n>0?"":"disabled"}>−</button><input id="${pref}${esc(id)}" data-id="${esc(id)}" inputmode="numeric" value="${n||""}" placeholder="0" aria-label="Cantidad"><button data-d="1" data-id="${esc(id)}" aria-label="Más">+</button></div>`;
  }
  const noteHTML = i => `<input class="note" id="n-${esc(i.id)}" data-id="${esc(i.id)}" placeholder="${esc(typeof i.nota === "string" ? i.nota : "Nota: sabor, color, cuál…")}" value="${esc(st.notes[i.id] || "")}">`;
  function cardHTML(i) {
    const n = qOf(i);
    return `<article class="card${n>0?" on":""}" data-id="${esc(i.id)}">
      <button class="ph" data-zoom="${esc(img(i.img))}" aria-label="Ver foto">${i.img ? `<img loading="lazy" src="${esc(img(i.img))}" alt="">` : `<span class="noimg">${i.x ? "Agregado" : "Sin foto"}</span>`}</button>
      <div class="cb"><div class="name">${esc(i.n)}</div>
        <div class="sub"><span>${esc(i.pr || "")}</span><span class="code">${esc(i.code || "")}</span></div>${priceTag(i)}
        ${T.notas || i.nota ? noteHTML(i) : ""}
        ${i.vars ? i.vars.map(v => `<div class="var"><span>${esc(v.pr)}${v.code ? ` · <b class="code">${esc(v.code)}</b>` : ""}</span>${stepper(v.id, st.q[v.id] || 0)}</div>`).join("") : stepper(i.id, n)}</div></article>`;
  }
  function rowHTML(i) {
    const n = qOf(i);
    if (i.vars) return `<div class="row rv${n>0?" on":""}" data-id="${esc(i.id)}"><div class="name">${esc(i.n)}</div>
      <div class="vlist">${i.vars.map(v => `<div class="var"><span>${v.pr ? esc(v.pr) + " · " : ""}<b class="code">${esc(v.code || "sin código")}</b></span>${stepper(v.id, st.q[v.id] || 0)}</div>${i.nota && st.q[v.id] > 0 ? noteHTML({id: v.id, nota: i.nota}) : ""}`).join("")}</div></div>`;
    return `<div class="row${n>0?" on":""}" data-id="${esc(i.id)}"><div><div class="name">${esc(i.n)}${i.x ? ` <span class="tag">Agregado</span>` : ""}</div>${i.nota ? noteHTML(i) : ""}
      <div class="sub"><span>${esc(i.pr || "")}</span><span class="code">${esc(i.code || "")}</span></div>${priceTag(i)}</div>${stepper(i.id, n)}</div>`;
  }
  function libreHTML(s) {
    const L = st.libres.filter(l => l.si === s.si);
    return `<form class="free" data-si="${s.si}"><input class="fc" name="code" placeholder="Código" inputmode="numeric"><input class="fn" name="n" placeholder="Descripción (opcional)"><input class="fq" name="q" inputmode="numeric" placeholder="Cant."><button class="btn" type="submit">Agregar</button></form>
      ${L.length ? `<div class="lines">${L.map(l => `<div class="ln" data-l="${l.id}"><div><b>${esc(l.code || "")}</b> ${esc(l.n || "")}</div>${stepper(l.id, l.q, "l-")}<button class="x" data-del="${l.id}" aria-label="Quitar">×</button></div>`).join("")}</div>` : ""}`;
  }
  function render() {
    let shown = 0;
    const html = T.secciones.filter(s => cat === "Todas" || (s.c || s.t) === cat).map(s => {
      const its = (s.items || []).filter(okItem); shown += its.length;
      const matchSec = !q || norm(s.t).includes(norm(q)) || st.libres.some(l => l.si === s.si && norm(l.code + " " + l.n).includes(norm(q)));
      const hasLib = T.libre && (!only || st.libres.some(l => l.si === s.si));
      if (!its.length && !(T.libre && matchSec && hasLib)) return "";
      const cards = its.filter(i => i.img || T.layout === "cards"), rows = its.filter(i => !(i.img || T.layout === "cards"));
      return `<section class="sec"><h2>${esc(s.t)}${s.sub ? ` <small>${esc(s.sub)}</small>` : ""}${s.ver ? ` <button class="verpg" data-zoom="${esc(img(s.ver))}">Ver página completa</button>` : ""}</h2>
        ${s.img ? (s.pg ? `<details class="pgd"><summary>Ver página del catálogo</summary><button class="banner pg" data-zoom="${esc(img(s.img))}" aria-label="Ver imagen"><img loading="lazy" src="${esc(img(s.img))}" alt=""></button></details>` : `<button class="banner${s.grande ? " big" : ""}" data-zoom="${esc(img(s.img))}" aria-label="Ver imagen"><img loading="lazy" src="${esc(img(s.img))}" alt=""></button>`) : ""}
        ${cards.length ? `<div class="grid">${cards.map(cardHTML).join("")}</div>` : ""}
        ${rows.length ? `<div class="rows">${rows.map(rowHTML).join("")}</div>` : ""}
        ${T.libre ? libreHTML(s) : ""}</section>`;
    }).join("");
    $("#list").innerHTML = html || `<div class="empty">${only ? "Todavía no has agregado productos al pedido." : "No hay productos que coincidan."}</div>`;
    $("#count").textContent = T.libre ? T.secciones.filter(s => !(s.items||[]).length || s.t.startsWith("Página")).length + " páginas" : shown + " de " + ITEMS.length + " productos";
    totals();
  }
  function lines() {
    const a = [];
    ITEMS.forEach(i => {
      if (i.vars) i.vars.forEach(v => { if (st.q[v.id] > 0) a.push({id: v.id, n: i.n + ((st.notes[v.id] || st.notes[i.id]) ? " – " + (st.notes[v.id] || st.notes[i.id]) : ""), pr: v.pr || "", code: v.code || "", q: st.q[v.id]}); });
      else if (st.q[i.id] > 0) a.push({id: i.id, n: i.n + (st.notes[i.id] ? " – " + st.notes[i.id] : ""), pr: i.pr || "", code: i.code || "", precio: i.precio || 0, q: st.q[i.id]});
    });
    const b = st.libres.filter(l => l.q > 0).map(l => ({id: l.id, libre: true, n: [l.n, T.secciones[l.si] ? `(${T.secciones[l.si].t})` : ""].filter(Boolean).join(" "), pr: "", code: l.code || "", q: l.q}));
    return [...a, ...b];
  }
  function totals() {
    const L = lines(), u = L.reduce((s, l) => s + l.q, 0);
    $("#bTotal").textContent = u + (u === 1 ? " unidad" : " unidades");
    $("#bInfo").textContent = L.length ? `${L.length} producto${L.length>1?"s":""} distintos` : "Nada seleccionado aún";
    $("#open").disabled = !L.length; $("#oTotal").textContent = u + " unidades"; $("#oInfo").textContent = L.length + " productos";
    if (T.precios) { const m = L.reduce((s, l) => s + (l.precio || 0) * l.q, 0), sin = L.some(l => !l.precio);
      if (L.length) { $("#bTotal").textContent = "≈ " + money(m); $("#bInfo").textContent = `${u} paquete${u>1?"s":""} · ${L.length} producto${L.length>1?"s":""}${sin ? " · hay líneas sin precio" : ""}`; }
      $("#oInfo").textContent = L.length + " productos · " + u + " paquetes"; $("#oTotal").textContent = money(m); }
  }
  function setQty(id, n, re = true) {
    n = Math.max(0, Math.min(99999, parseInt(n) || 0));
    const l = st.libres.find(x => x.id === id);
    if (l) { l.q = n; if (!n) st.libres = st.libres.filter(x => x !== l); save(); if (re) render(); else totals(); return; }
    if (n > 0) st.q[id] = n; else delete st.q[id]; save();
    if (re) { const i = varOf[id] || byId[id]; document.querySelectorAll(`[data-id="${CSS.escape(i.id)}"].card, [data-id="${CSS.escape(i.id)}"].row`).forEach(el => { el.outerHTML = el.classList.contains("card") ? cardHTML(i) : rowHTML(i); }); }
    totals();
  }
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; chips(); render(); window.scrollTo({top: 0}); });
  $("#q").addEventListener("input", e => { q = e.target.value.trim(); render(); });
  $("#only").addEventListener("change", e => { only = e.target.checked; render(); });
  $("#list").addEventListener("click", e => {
    const z = e.target.closest("[data-zoom]"); if (z) { if (z.dataset.zoom) { $("#lbImg").src = z.dataset.zoom; $("#lb").hidden = false; } return; }
    const d = e.target.closest("[data-del]"); if (d) { st.libres = st.libres.filter(l => l.id !== d.dataset.del); save(); render(); return; }
    const b = e.target.closest(".step button"); if (!b) return;
    const id = b.dataset.id, l = st.libres.find(x => x.id === id), cur = l ? l.q : (st.q[id] || 0);
    setQty(id, cur + Number(b.dataset.d));
  });
  $("#list").addEventListener("change", e => { const t = e.target; if (t.matches(".step input")) setQty(t.dataset.id, t.value); });
  $("#list").addEventListener("input", e => { const t = e.target; if (t.classList.contains("note")) { if (t.value) st.notes[t.dataset.id] = t.value; else delete st.notes[t.dataset.id]; save(); } });
  $("#list").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches(".step input")) e.target.blur(); });
  $("#list").addEventListener("submit", e => {
    e.preventDefault(); const f = e.target, code = f.code.value.trim(), n = f.n.value.trim(), qq = parseInt(f.q.value) || 1;
    if (!code && !n) { f.code.focus(); return; }
    st.libres.push({id: "l" + Date.now(), si: +f.dataset.si, code, n, q: qq}); save(); render();
    const nf = document.querySelector(`form.free[data-si="${f.dataset.si}"] .fc`); if (nf) nf.focus();
  });
  $("#lb").addEventListener("click", () => $("#lb").hidden = true);

  function drawOrder() {
    const L = lines();
    $("#olist").innerHTML = L.length ? L.map(l => `<div class="oi"><div><div class="name">${esc(l.n)}</div><div class="sub"><span>${esc(l.pr)}</span><span class="code">${esc(l.code)}</span></div>${l.precio ? `<div class="price">${money(l.precio)} × ${l.q} = <b>${money(l.precio * l.q)}</b></div>` : ""}</div>${stepper(l.id, l.q, "o-")}</div>`).join("") : `<div class="empty">El pedido está vacío.</div>`;
    ["#xlsx", "#pdf", "#copy"].forEach(s => $(s).disabled = !L.length);
  }
  function resetClear() { $("#clearBox").innerHTML = `<button class="btn ghost" id="clear">Vaciar pedido</button>`; $("#clear").onclick = askClear; $("#clear").disabled = !lines().length; }
  function askClear() { $("#clearBox").innerHTML = `<span>¿Borrar todo el pedido?</span><button class="btn" id="yes">Sí, vaciar</button><button class="btn ghost" id="no">Cancelar</button>`;
    $("#yes").onclick = () => { st.q = {}; st.notes = {}; st.libres = []; save(); drawOrder(); totals(); resetClear(); $("#msg").textContent = "Pedido vaciado."; }; $("#no").onclick = resetClear; }
  const closeAll = () => { $("#ov").hidden = true; render(); };
  $("#open").onclick = () => { drawOrder(); $("#msg").textContent = ""; $("#fallback").hidden = true; resetClear(); $("#ov").hidden = false; };
  $("#close").onclick = closeAll;
  $("#ov").addEventListener("click", e => { if (e.target.id === "ov") closeAll(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#lb").hidden) $("#lb").hidden = true; else if (!$("#ov").hidden) closeAll(); } });
  $("#olist").addEventListener("click", e => { const b = e.target.closest(".step button"); if (!b) return; const id = b.dataset.id, l = st.libres.find(x => x.id === id); setQty(id, (l ? l.q : (st.q[id] || 0)) + Number(b.dataset.d), false); drawOrder(); resetClear(); });
  $("#olist").addEventListener("change", e => { if (e.target.matches(".step input")) { setQty(e.target.dataset.id, e.target.value, false); drawOrder(); resetClear(); } });

  window.PEDIDO = {proveedor: T.proveedor, precios: !!T.precios, filas: () => lines().map(l => ({codigo: l.code, producto: l.n, presentacion: l.pr, cantidad: l.q, precio: l.precio || 0}))};
  let extraSec = null;
  window.EXTRA = {
    clave: T.clave + "-extra-v1",
    categorias: () => CATS.slice(),
    agregarCategoria: c => { CATS.push(c); },
    refrescar: () => { chips(); render(); },
    quitar: id => { const i = byId[id]; if (!i) return; i.sec.items = i.sec.items.filter(x => x !== i); ITEMS.splice(ITEMS.indexOf(i), 1); delete byId[id]; delete st.q[id]; save(); },
    aItem: e => {
      let s = T.secciones.find(s => (s.c || s.t) === e.c && !s.libreOnly);
      if (!s) { s = {t: e.c, c: e.c, items: [], si: T.secciones.length}; T.secciones.push(s); }
      const i = {id: e.id, n: e.n, pr: e.pres || "", code: e.code || "", x: true, sec: s};
      s.items = s.items || []; s.items.push(i); ITEMS.push(i); byId[e.id] = i;
    }
  };
  chips(); render();
})();
