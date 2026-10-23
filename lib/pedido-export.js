/* Formato común de pedido para todos los proveedores (Excel, PDF y WhatsApp).
   Cada tienda define window.PEDIDO = { proveedor: "Nombre", filas: () => [{codigo, producto, presentacion, cantidad}] } */
(function () {
  const $ = s => document.querySelector(s);
  const hoy = () => new Date().toLocaleDateString("es-CR", {day: "2-digit", month: "2-digit", year: "numeric"});
  const sello = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const msg = t => { const m = $("#msg"); if (m) m.textContent = t; };
  function bajar(nombre, data) {
    try {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      msg("Descargado: " + nombre);
    } catch (e) { msg("No se pudo descargar el archivo."); }
  }
  const filas = () => window.PEDIDO.filas().filter(f => f.cantidad > 0);
  const total = F => F.reduce((s, f) => s + f.cantidad, 0);
  const titulo = () => "Pedido Super Ever – " + window.PEDIDO.proveedor;
  const archivo = ext => "Pedido " + window.PEDIDO.proveedor + " " + sello() + "." + ext;

  const P = () => window.PEDIDO.precios;
  const money = v => "₡" + Math.round(v).toLocaleString("en-US");
  const monto = F => F.reduce((s, f) => s + (f.precio || 0) * f.cantidad, 0);
  function excel() {
    const F = filas();
    if (P()) {
      const rows = [[titulo()], ["Fecha: " + hoy()], [], ["#", "Código", "Producto", "Presentación", "Cantidad", "Precio paquete", "Subtotal"]];
      F.forEach((f, k) => rows.push([k + 1, f.codigo || "", f.producto, f.presentacion || "", f.cantidad, f.precio || "", f.precio ? {f: `E${k + 5}*F${k + 5}`, v: f.precio * f.cantidad} : ""]));
      const ini = 5, fin = F.length + 4;
      rows.push([], ["", "", "", "Total", {f: `SUM(E${ini}:E${fin})`, v: total(F)}, "Total aprox.", {f: `SUM(G${ini}:G${fin})`, v: monto(F)}]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      for (let r = ini; r <= fin + 2; r++) ["F", "G"].forEach(c => { const x = ws[c + r]; if (x && typeof x.v === "number") x.z = '"₡"#,##0'; });
      ws["!cols"] = [{wch: 5}, {wch: 12}, {wch: 44}, {wch: 26}, {wch: 10}, {wch: 14}, {wch: 14}];
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pedido");
      return bajar(archivo("xlsx"), new Blob([XLSX.write(wb, {bookType: "xlsx", type: "array"})]));
    }
    const rows = [[titulo()], ["Fecha: " + hoy()], [], ["#", "Código", "Producto", "Presentación", "Cantidad"]];
    F.forEach((f, k) => rows.push([k + 1, f.codigo || "", f.producto, f.presentacion || "", f.cantidad]));
    const ini = 5, fin = F.length + 4;
    rows.push([], ["", "", "", "Total", {f: `SUM(E${ini}:E${fin})`, v: total(F)}]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{wch: 5}, {wch: 16}, {wch: 50}, {wch: 18}, {wch: 10}];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pedido");
    bajar(archivo("xlsx"), new Blob([XLSX.write(wb, {bookType: "xlsx", type: "array"})]));
  }
  function pdf() {
    const F = filas(); const { jsPDF } = window.jspdf; const doc = new jsPDF({unit: "pt", format: "letter"});
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(titulo().replace("–", "-"), 40, 50);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text("Fecha: " + hoy(), 40, 68);
    const C = s => s.replace("₡", "CRC ");
    if (P()) { doc.autoTable({
      startY: 84, head: [["#", "Producto", "Presentación", "Cant.", "Precio", "Subtotal"]],
      body: F.map((f, k) => [k + 1, f.producto, f.presentacion || "", f.cantidad, f.precio ? C(money(f.precio)) : "", f.precio ? C(money(f.precio * f.cantidad)) : ""]),
      foot: [["", "", "Total", total(F), "", C(money(monto(F)))]],
      styles: {fontSize: 8.5, cellPadding: 4}, headStyles: {fillColor: [40, 46, 56]},
      footStyles: {fillColor: [236, 238, 242], textColor: 20, fontStyle: "bold"},
      columnStyles: {0: {cellWidth: 24, halign: "right"}, 2: {cellWidth: 110}, 3: {cellWidth: 36, halign: "right"}, 4: {cellWidth: 62, halign: "right"}, 5: {cellWidth: 66, halign: "right"}}
    }); return bajar(archivo("pdf"), doc.output("blob")); }
    doc.autoTable({
      startY: 84, head: [["#", "Código", "Producto", "Presentación", "Cant."]],
      body: F.map((f, k) => [k + 1, f.codigo || "", f.producto, f.presentacion || "", f.cantidad]),
      foot: [["", "", "", "Total", total(F)]],
      styles: {fontSize: 9, cellPadding: 4}, headStyles: {fillColor: [40, 46, 56]},
      footStyles: {fillColor: [236, 238, 242], textColor: 20, fontStyle: "bold"},
      columnStyles: {0: {cellWidth: 26, halign: "right"}, 1: {cellWidth: 84}, 3: {cellWidth: 84}, 4: {cellWidth: 44, halign: "right"}}
    });
    bajar(archivo("pdf"), doc.output("blob"));
  }
  function whatsapp() {
    const F = filas();
    const t = "*" + titulo() + "*\nFecha: " + hoy() + "\n\n" +
      F.map(f => `• ${f.cantidad} × ${f.producto}${f.presentacion ? " (" + f.presentacion + ")" : ""}${f.codigo ? " – cód. " + f.codigo : ""}`).join("\n") +
      `\n\nTotal: ${total(F)} unidades` + (P() ? `\nTotal aprox.: ${money(monto(F))}` : "");
    const fb = () => { const ta = $("#fallback"); ta.value = t; ta.hidden = false; ta.focus(); ta.select(); msg("Selecciona y copia el texto de abajo."); };
    try { navigator.clipboard.writeText(t).then(() => msg("Copiado. Pégalo en WhatsApp."), fb); } catch (e) { fb(); }
  }
  $("#xlsx").onclick = excel; $("#pdf").onclick = pdf; $("#copy").onclick = whatsapp;
  function pantalla() {
    const F = filas(), esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const pr = P();
    const head = `<tr><th>#</th><th>Código</th><th>Producto</th><th>Presentación</th><th class="n">Cant.</th>${pr ? '<th class="n">Subtotal</th>' : ""}</tr>`;
    const body = F.map((f, k) => `<tr><td class="n">${k + 1}</td><td>${esc(f.codigo || "")}</td><td>${esc(f.producto)}</td><td>${esc(f.presentacion || "")}</td><td class="n"><b>${f.cantidad}</b></td>${pr ? `<td class="n">${f.precio ? money(f.precio * f.cantidad) : ""}</td>` : ""}</tr>`).join("");
    const foot = `<tr><td colspan="4" class="n"><b>Total</b></td><td class="n"><b>${total(F)}</b></td>${pr ? `<td class="n"><b>${money(monto(F))}</b></td>` : ""}</tr>`;
    let v = document.getElementById("pantalla");
    if (!v) { v = document.createElement("div"); v.id = "pantalla"; document.body.appendChild(v); }
    v.innerHTML = `<style>#pantalla{position:fixed;inset:0;z-index:60;background:#fff;color:#111;overflow:auto;padding:14px 12px 40px;font:14px/1.35 Inter,system-ui,sans-serif}
#pantalla .pc{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
#pantalla .pc small{color:#666}#pantalla .px{border:0;background:#eee;border-radius:8px;font-size:15px;padding:8px 12px;cursor:pointer}
#pantalla h2{font-size:19px;margin:4px 0 2px;color:#111}#pantalla .f{color:#444;margin-bottom:10px}
#pantalla table{width:100%;border-collapse:collapse}#pantalla th{background:#28303a;color:#fff;text-align:left;font-size:12.5px;padding:6px 5px}
#pantalla td{border-bottom:1px solid #ddd;padding:6px 5px;vertical-align:top;font-size:13.5px}#pantalla tr:nth-child(even) td{background:#f5f6f8}
#pantalla .n{text-align:right;white-space:nowrap}#pantalla tfoot td{background:#eceef2;border-top:2px solid #28303a}</style>
<div class="pc"><small>Toma captura de pantalla de este pedido</small><button class="px" type="button">Cerrar ✕</button></div>
<h2>${esc(titulo())}</h2><div class="f">Fecha: ${hoy()}</div>
<table><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>`;
    v.hidden = false; v.scrollTop = 0;
    v.querySelector(".px").onclick = () => { v.hidden = true; };
  }
  (function () {
    const c = $("#copy"); if (!c || $("#verPantalla")) return;
    const b = document.createElement("button"); b.className = c.className; b.id = "verPantalla"; b.type = "button"; b.textContent = "Ver en pantalla";
    c.insertAdjacentElement("afterend", b); b.onclick = () => { if (filas().length) pantalla(); else msg("El pedido está vacío."); };
  })();
  (function () {
    try {
      const q = new URLSearchParams(location.search).get("q"), i = document.getElementById("q");
      if (q && i) { i.value = q; i.dispatchEvent(new Event("input", {bubbles: true})); }
    } catch (e) {}
  })();
})();
