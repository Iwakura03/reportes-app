# Reportes ciudadanos

Aplicación web para que los habitantes de un municipio reporten problemas de la vía pública (baches, alumbrado, basura, fugas de agua, etc.) marcando el punto exacto en un mapa. El personal municipal puede revisar los reportes, cambiar su estado y publicar respuestas.

El proyecto está pensado inicialmente para **Magdalena, Jalisco (México)**, aunque puede usarse en cualquier municipio.

> Estado: en desarrollo. Ya se pueden crear reportes desde el mapa y gestionar cuentas; el panel administrativo y la consulta publica siguen pendientes,

## Funcionalidades

**Disponibles**

- Mapa interactivo (OpenStreetMap + Leaflet) centrado en la ubicación del dispositivo, con un punto predeterminado si no se concede el permiso.
- Marcador que se puede arrastrar para ajustar la ubicación exacta del problema.
- Formulario de reporte con categoría, título y descripción.
- Registro con confirmación por correo, inicio y cierre de sesión.
- Los reportes se pueden enviar **con o sin cuenta**; si hay sesión, el reporte queda asociado al usuario.
