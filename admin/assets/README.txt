AdminLTE assets are expected in this folder structure:
- assets/css/adminlte.min.css
- assets/js/adminlte.min.js
- assets/plugins/* (fontawesome, overlayScrollbars, bootstrap)

Because this environment cannot download external packages, the HTML files reference CDN versions directly. When building for production, download AdminLTE 3.2 dist bundle and place the compiled files in this folder to keep everything self-hosted.
