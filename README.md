# Pedidos a proveedores

Sitio estático para armar pedidos a proveedores. Cada tienda permite buscar
productos, marcar cantidades y descargar el pedido en Excel, PDF o texto para WhatsApp.

## Estructura

```
index.html        Página de inicio (lista de proveedores)
lib/              Librerías para generar Excel y PDF (SheetJS, jsPDF)
rojas/            Rojas Inversiones (golosinas, con precios)
dipo/             Grupo Dipo (código SAP, sin precios)
roma/             Roma Prince (marcas propias; fotos enlazadas a romaprince.com)
daring/           Inversiones Daring del Cedral (lista armada con facturas)
  index.html
  extra.json      Productos agregados a mano (ver abajo)
.nojekyll         Le indica a GitHub Pages que publique los archivos tal cual
```

## Productos agregados a mano (Daring)

En la página, "+ Agregar producto" guarda productos nuevos en el navegador
(localStorage). Para que queden para todos los dispositivos:

1. En "+ Agregar producto", toca **Descargar extra.json**.
2. Reemplaza `daring/extra.json` en esta carpeta con el archivo descargado.
3. `git add . && git commit -m "Agrega productos a Daring" && git push`

## Cómo actualizar

```bash
git pull
# ...reemplazar o agregar archivos...
git add .
git commit -m "Describe el cambio"
git push        # GitHub Pages publica en 1-2 minutos
```
