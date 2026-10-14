# Pedidos a proveedores

Sitio estático para armar pedidos a proveedores. Cada tienda permite buscar
productos, marcar cantidades y descargar el pedido en Excel, PDF o texto para WhatsApp.

## Estructura

```
index.html        Página de inicio (lista de proveedores)
lib/              Librerías Excel/PDF, pedido-export.js (formato del pedido) y agregar-productos.js
rojas/            Rojas Inversiones (golosinas, con precios)
dipo/             Grupo Dipo (código SAP, sin precios)
roma/             Roma Prince (marcas propias; fotos enlazadas a romaprince.com)
daring/           Inversiones Daring del Cedral (lista armada con facturas)
  index.html
  extra.json      Productos agregados a mano (ver abajo)
.nojekyll         Le indica a GitHub Pages que publique los archivos tal cual
```

## Productos agregados a mano (todas las tiendas)

Cada tienda tiene "+ Agregar producto". Lo que agregas queda guardado en ese
navegador (localStorage). Para que quede en todos los dispositivos:

1. En "+ Agregar producto", toca **Descargar extra.json**.
2. Reemplaza el `extra.json` de la carpeta de ese proveedor
   (`rojas/extra.json`, `dipo/extra.json`, `roma/extra.json` o `daring/extra.json`).
3. `git add . && git commit -m "Agrega productos" && git push`

El código común está en `lib/agregar-productos.js` (Rojas, Dipo y Roma; Daring tiene el suyo).

## Cómo actualizar

```bash
git pull
# ...reemplazar o agregar archivos...
git add .
git commit -m "Describe el cambio"
git push        # GitHub Pages publica en 1-2 minutos
```
