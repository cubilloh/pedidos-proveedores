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

  function excel() {
    const F = filas();
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
      `\n\nTotal: ${total(F)} unidades`;
    const fb = () => { const ta = $("#fallback"); ta.value = t; ta.hidden = false; ta.focus(); ta.select(); msg("Selecciona y copia el texto de abajo."); };
    try { navigator.clipboard.writeText(t).then(() => msg("Copiado. Pégalo en WhatsApp."), fb); } catch (e) { fb(); }
  }
  $("#xlsx").onclick = excel; $("#pdf").onclick = pdf; $("#copy").onclick = whatsapp;
})();
