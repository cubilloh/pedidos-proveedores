/* "+ Agregar producto" común. Cada tienda define antes:
   window.EXTRA = { clave, categorias: () => [...], aItem: e => item, agregarCategoria: c => {}, refrescar: () => {} }
   Los productos quedan en este navegador (localStorage) y, para todos los dispositivos, en extra.json de la carpeta. */
(function () {
  const X = window.EXTRA; if (!X) return;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const load = () => { try { return JSON.parse(localStorage.getItem(X.clave)) || []; } catch (e) { return []; } };
  const save = v => { try { localStorage.setItem(X.clave, JSON.stringify(v)); } catch (e) {} };
  let propios = load(), repo = [], puestos = new Set();

  document.head.insertAdjacentHTML("beforeend", `<style>
  .addbar{display:flex;gap:8px;padding-bottom:10px}
  .addbtn{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:7px 12px;font-weight:600;font-size:13px;cursor:pointer}
  .xform{display:flex;flex-direction:column;gap:12px;padding:16px;overflow:auto;flex:1}
  .xform label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:13px}
  .xform input:not([type=file]),.xform select{padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-weight:400;font-size:16px}
  .xform hr{border:0;border-top:1px solid var(--line);width:100%}.xform h3{margin:0;font-size:15px}
  .xhint{color:var(--muted);font-size:13px;margin:0}
  .xrow{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line)}
  .xacts{display:flex;gap:8px;flex-wrap:wrap}.xacts>*{flex:1 1 140px;text-align:center}
  .xfile{display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
  .xtag{display:inline-block;background:var(--accent);color:var(--accent-ink);border-radius:4px;padding:0 6px;font-size:11px;font-weight:600;margin-left:4px;vertical-align:middle}
  </style>`);
  const anchor = document.querySelector("header .chips") || document.querySelector("header .search");
  anchor.insertAdjacentHTML("afterend", `<div class="addbar"><button class="addbtn" id="xOpen" type="button">+ Agregar producto</button></div>`);
  document.body.insertAdjacentHTML("beforeend", `<div class="overlay" id="xOv" hidden>
   <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="xT">
    <div class="dh"><h2 id="xT">Agregar producto</h2><button class="x" id="xClose" aria-label="Cerrar">×</button></div>
    <form class="xform" id="xForm">
      <label>Nombre del producto *<input id="xName" required placeholder="Ej. Galleta nueva 12 unid"></label>
      <label>Código (opcional)<input id="xCode" placeholder="Código de barras o del proveedor"></label>
      <label>Presentación (opcional)<input id="xPres" placeholder="Ej. 250 g, 24 unid, display"></label>
      <label>Categoría<select id="xCat"></select></label>
      <button class="btn" type="submit">Guardar producto</button>
      <div class="msg" id="xMsg" aria-live="polite"></div>
      <hr><h3>Tus productos agregados</h3><div id="xList"></div>
      <p class="xhint">Quedan guardados en este navegador. Para que aparezcan en todos los dispositivos, descarga el archivo y súbelo al repositorio como <code>extra.json</code> dentro de la carpeta de este proveedor.</p>
      <div class="xacts"><button class="btn ghost" type="button" id="xExp">Descargar extra.json</button>
        <label class="btn ghost xfile">Cargar archivo<input type="file" id="xImp" accept=".json,application/json" hidden></label></div>
    </form></div></div>`);

  function poner(e) {
    if (puestos.has(e.id)) return;
    puestos.add(e.id);
    if (e.c && !X.categorias().includes(e.c)) X.agregarCategoria(e.c);
    X.aItem(e);
  }
  function quitar(id) { X.quitar(id); puestos.delete(id); }
  function lista() {
    const cats = [...new Set([...X.categorias(), "Agregados"])];
    $("#xCat").innerHTML = cats.map(c => `<option${c === "Agregados" ? " selected" : ""}>${esc(c)}</option>`).join("");
    const deRepo = repo.filter(r => !propios.some(p => p.id === r.id));
    $("#xList").innerHTML = (propios.length || deRepo.length) ? [
      ...propios.map(e => `<div class="xrow"><div><b>${esc(e.n)}</b><br><small>${esc([e.code, e.pres, e.c].filter(Boolean).join(" · "))}</small></div><button type="button" class="btn ghost" data-del="${esc(e.id)}">Quitar</button></div>`),
      ...deRepo.map(e => `<div class="xrow"><div><b>${esc(e.n)}</b><br><small>${esc([e.code, e.pres, e.c].filter(Boolean).join(" · "))} · desde extra.json</small></div></div>`)
    ].join("") : `<p class="xhint">Todavía no has agregado productos.</p>`;
  }
  const abrir = () => { lista(); $("#xMsg").textContent = ""; $("#xOv").hidden = false; $("#xName").focus(); };
  const cerrar = () => { $("#xOv").hidden = true; X.refrescar(); };
  $("#xOpen").onclick = abrir; $("#xClose").onclick = cerrar;
  $("#xOv").addEventListener("click", e => { if (e.target.id === "xOv") cerrar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#xOv").hidden) cerrar(); });
  $("#xForm").addEventListener("submit", ev => {
    ev.preventDefault();
    const n = $("#xName").value.trim(); if (!n) return;
    const code = $("#xCode").value.trim(), pres = $("#xPres").value.trim(), c = $("#xCat").value || "Agregados";
    const id = "x-" + norm(code || (n + " " + pres)).replace(/[^a-z0-9]+/g, "-");
    if (puestos.has(id)) { $("#xMsg").textContent = "Ese producto ya está agregado."; return; }
    const e = {id, n, code, pres, c};
    propios.push(e); save(propios); poner(e); lista();
    $("#xForm").reset(); lista(); $("#xMsg").textContent = "Guardado: " + n;
  });
  $("#xList").addEventListener("click", ev => {
    const b = ev.target.closest("[data-del]"); if (!b) return;
    propios = propios.filter(p => p.id !== b.dataset.del); save(propios); quitar(b.dataset.del); lista();
  });
  $("#xExp").onclick = () => {
    const todos = [...repo.filter(r => !propios.some(p => p.id === r.id)), ...propios];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(todos, null, 2)], {type: "application/json"}));
    a.download = "extra.json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    $("#xMsg").textContent = "Descargado extra.json (" + todos.length + " productos).";
  };
  $("#xImp").addEventListener("change", async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try { const arr = JSON.parse(await f.text()); if (!Array.isArray(arr)) throw 0;
      arr.forEach(x => { if (x && x.id && x.n && !propios.some(p => p.id === x.id)) { const e = {id: x.id, n: x.n, code: x.code || "", pres: x.pres || "", c: x.c || "Agregados"}; propios.push(e); poner(e); } });
      save(propios); lista(); $("#xMsg").textContent = "Productos cargados.";
    } catch (err) { $("#xMsg").textContent = "Ese archivo no es un extra.json válido."; }
    ev.target.value = "";
  });

  propios.forEach(poner); X.refrescar();
  fetch("extra.json", {cache: "no-store"}).then(r => r.ok ? r.json() : []).then(arr => {
    if (Array.isArray(arr) && arr.length) { repo = arr; arr.forEach(poner); X.refrescar(); }
  }).catch(() => {});
})();
