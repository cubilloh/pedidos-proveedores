# Pedidos a proveedores

Sitio estático para armar pedidos a proveedores. Cada tienda permite buscar
productos, marcar cantidades y descargar el pedido en Excel, PDF o texto para WhatsApp.

## Estructura

```
index.html        Página de inicio (lista de proveedores)
buscar/           Buscador general: busca un producto en todos los proveedores
lib/              Código común:
                    tienda.js / tienda.css    plantilla de las tiendas (cada una define window.TIENDA)
                    pedido-export.js          Excel, PDF, WhatsApp y "Ver en pantalla"
                    agregar-productos.js      botón "+ Agregar producto"
                    xlsx / jspdf              librerías de Excel y PDF
<proveedor>/      Una carpeta por proveedor (armenio, coca-cola, wamase, pepsico, kimby, …)
  index.html        Catálogo (window.TIENDA = {...})
  img/              Fotos de los productos
  extra.json        Productos agregados a mano (ver abajo)
rojas/ dipo/ roma/ daring/   Tiendas antiguas con su propio código (no usan tienda.js)
.nojekyll         Le indica a GitHub Pages que publique los archivos tal cual
.gitignore        Bloquea archivos PDF para que no se suban documentos personales
```

Cada producto debe tener un `id` único dentro de su tienda. Si dos productos
comparten `id`, se marcan juntos y las tarjetas se mezclan.

## Productos agregados a mano (todas las tiendas)

Cada tienda tiene "+ Agregar producto". Lo que agregas queda guardado en ese
navegador (localStorage). Para que quede en todos los dispositivos:

1. En "+ Agregar producto", toca **Descargar extra.json**.
2. Reemplaza el `extra.json` de la carpeta de ese proveedor (por ejemplo `kimby/extra.json`).
3. `git add . && git commit -m "Agrega productos" && git push`

El código común está en `lib/agregar-productos.js` (todas las tiendas menos Daring, que tiene el suyo).

## Cómo actualizar

```bash
git pull
# ...reemplazar o agregar archivos...
git status      # revisa que no vaya nada personal antes de subir
git add .
git commit -m "Describe el cambio"
git push        # GitHub Pages publica en 1-2 minutos
```
