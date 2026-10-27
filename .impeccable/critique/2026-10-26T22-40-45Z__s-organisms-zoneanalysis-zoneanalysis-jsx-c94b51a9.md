---
target: vista de análisis (ZoneAnalysis, paso 4)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\nakat\\UADE\\Seminario\\ProfitZone\\profit-zone-front\\src\\components\\organisms\\ZoneAnalysis\\ZoneAnalysis.jsx"
target_fingerprint: "sha256:469ce4e107687a93104f62c4ce5ece86dfb3f249a888a1be596682ded4d659df"
target_path: "C:\\Users\\nakat\\UADE\\Seminario\\ProfitZone\\profit-zone-front\\src\\components\\organisms\\ZoneAnalysis\\ZoneAnalysis.jsx"
timestamp: 2026-10-26T22-40-45Z
slug: s-organisms-zoneanalysis-zoneanalysis-jsx-c94b51a9
---
# Crítica: vista de Análisis (ZoneAnalysis)

Evaluada en vivo en /reporte-ejemplo (mismo organism que el paso 4 y Mis reportes), desktop 1280 y mobile 390.

## Heurísticas de Nielsen (22/40, Aceptable)
| # | Heurística | Nota | Hallazgo |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Estados por tarjeta bien; al bajar se pierde qué punto/radio se mira |
| 2 | Mundo real | 3 | "81/100" y "89 vs 6 directos" sin referencia |
| 3 | Control y libertad | 2 | Mapa sin ocultar/agrandar; sin saltos a secciones |
| 4 | Consistencia | 2 | Cada dato aparece 3 veces (tarjeta, tile, criterio) |
| 5 | Prevención de errores | 3 | "Estimado" y descargo en gris chico |
| 6 | Reconocer vs recordar | 1 | Mapa a >1000 px de las tablas |
| 7 | Flexibilidad | 1 | Sin índice, orden de tablas, imprimir ni comparar |
| 8 | Minimalismo | 2 | "La zona en datos" y fuentes repetidas |
| 9 | Recuperación de errores | 3 | Fallos por indicador aislados + Reintentar |
| 10 | Ayuda | 2 | Sin explicación de cálculos |

## Especificidad
Contenido propio (cruce Tu negocio/Zona/Lectura, franja horaria, radio sobre barrio); forma genérica (5 tarjetas iguales). Mapa como portada, no como interfaz.
Detector: CLI 0; navegador 15 (9 line-length, 5 low-contrast en .indicator-card-source #8a99ad 2.9:1, 1 cramped-padding y 1 layout-transition falsos positivos).

## Problemas prioritarios
- [P0] Conclusión al final (Resumen y Fortalezas/debilidades después de las 5 tarjetas, y≈3065). Fix: conclusión → criterios enlazados → franja de KPIs → tarjetas con la lectura arriba → fuentes plegadas. Comando: layout
- [P0] Mapa desconectado: una sola vez arriba. Fix: split con mapa sticky plegable en desktop; mapa chico + bottom sheet en mobile; filas ↔ puntos. Comando: layout + adapt
- [P1] Datos triplicados, 5050 px desktop / 7329 px mobile. Fix: KPIs solo arriba, tarjetas compactas en mobile, fuentes una vez. Comando: distill
- [P1] Contraste: #8A99AD 2.9:1 en fuentes/captions/encabezados; badges Fortaleza 2.3:1 y Debilidad 3.4:1. Fix: text-secondary como mínimo, success-dark en tokens, íconos ✓/!/✕. Comando: audit → colorize
- [P2] Sin referencias para comparar. Fix: vs mediana de Palermo, medidor 0-100 de afluencia, transporte agrupado, tablas ordenables. Comando: bolder + clarify

## Personas
- Alex: sin índice, tablas no ordenables, sin imprimir/compartir, otro radio exige rehacer el flujo.
- Sam: contraste, lectura por color, 90 marcadores no accesibles por teclado, leyenda de 8 px.
- Casey: mapa se pierde, tabla 375 px en 293 px, botón expandir 31 px, links de 18-21 px.

## Menores
Directa con dos codificaciones; "se muestran 5 de 89" mezclado con la fuente (ZoneAnalysis.jsx:173); token inexistente --color-border-subtle con fallback hex (ZoneAnalysis.css:99); nombres truncados sin forma de verlos; "Estimado" falta en población; "Tu negocio" como línea corrida.

## Preguntas
1. ¿La primera pantalla responde "¿abro acá o no?"?
2. ¿Qué número cambia la decisión y por qué pesa igual que "Hogares"?
3. ¿El mapa es ilustración o interfaz?
