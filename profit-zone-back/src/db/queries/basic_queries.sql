/*
  ProfitZone — Consultas básicas (SQL Server / T-SQL)

  Consultas de lectura para explorar el catálogo y el estado de la base.
  Ninguna modifica datos. Se filtra siempre por `code`, nunca por `id`
  (los ids pueden variar entre entornos).

  Conexión (DB local de docker-compose):
    Servidor: localhost,1433 · Usuario: sa · Contraseña: DB_PASSWORD de profit-zone-back/.env
    Base: ProfitZone · Marcar "Trust server certificate"
*/

USE ProfitZone;
GO

/* ============================================================
   CATÁLOGO
   ============================================================ */

-- 1. Categorías
-- Lista las categorías (rubros principales) con su orden, si están activas
-- y cuántas subcategorías tiene cada una.
SELECT c.id, c.code, c.name, c.sort_order, c.is_active, COUNT(s.id) AS subcategorias
FROM catalog.categories c
LEFT JOIN catalog.subcategories s ON s.category_id = c.id
GROUP BY c.id, c.code, c.name, c.sort_order, c.is_active
ORDER BY c.sort_order;
GO

-- 2. Subcategorías con sus términos de búsqueda
-- Lista cada subcategoría con su categoría y los términos con los que se busca
-- su competencia en Google Places (type/keyword; "(primary)" marca el principal).
SELECT c.code AS categoria, s.id, s.code, s.name, s.sort_order, s.is_active,
       STRING_AGG(t.term_type + ':' + t.term_value + IIF(t.is_primary = 1, ' (primary)', ''), ', ') AS terminos_busqueda
FROM catalog.subcategories s
JOIN catalog.categories c ON c.id = s.category_id
LEFT JOIN catalog.subcategory_search_terms t ON t.subcategory_id = s.id
GROUP BY c.code, c.sort_order, s.id, s.code, s.name, s.sort_order, s.is_active
ORDER BY c.sort_order, s.sort_order;
GO

/* ============================================================
   PREGUNTAS
   ============================================================ */

-- 3. Preguntas generales
-- Preguntas con scope 'global': aparecen en la encuesta de todos los rubros.
-- Solo activas (asignación y pregunta), ordenadas por sección y orden.
SELECT a.section, a.sort_order, q.code, q.prompt, q.input_type, a.is_required
FROM catalog.question_assignments a
JOIN catalog.questions q ON q.id = a.question_id
WHERE a.scope = 'global' AND a.is_active = 1 AND q.is_active = 1
ORDER BY a.section, a.sort_order;
GO

-- 4. Preguntas por categoría
-- Preguntas con scope 'category': aparecen en todas las subcategorías de esa
-- categoría. (Con el seed actual no hay ninguna: devuelve 0 filas.)
SELECT c.code AS categoria, a.section, a.sort_order, q.code, q.prompt, q.input_type
FROM catalog.question_assignments a
JOIN catalog.questions q ON q.id = a.question_id
JOIN catalog.categories c ON c.id = a.category_id
WHERE a.scope = 'category' AND a.is_active = 1 AND q.is_active = 1
ORDER BY c.sort_order, a.section, a.sort_order;
GO

-- 5. Preguntas por subcategoría
-- Preguntas con scope 'subcategory': específicas de un rubro puntual
-- (ej. tipo de cocina solo para restaurante).
SELECT c.code AS categoria, s.code AS subcategoria, a.section, a.sort_order, q.code, q.prompt, q.input_type
FROM catalog.question_assignments a
JOIN catalog.questions q ON q.id = a.question_id
JOIN catalog.subcategories s ON s.id = a.subcategory_id
JOIN catalog.categories c ON c.id = s.category_id
WHERE a.scope = 'subcategory' AND a.is_active = 1 AND q.is_active = 1
ORDER BY c.sort_order, s.sort_order, a.section, a.sort_order;
GO

-- 6. Encuesta completa de una subcategoría
-- Arma la encuesta que vería un usuario de ese rubro: preguntas generales +
-- de su categoría + de su subcategoría, en el orden en que se muestran
-- (primero 'business' = "Tu negocio", después 'details').
-- Cambiar @categoria y @subcategoria para ver otro rubro.
DECLARE @categoria varchar(50) = 'gastronomia', @subcategoria varchar(50) = 'cafeteria';

SELECT a.section, a.scope, a.sort_order, q.code, q.prompt, q.input_type, a.is_required
FROM catalog.subcategories s
JOIN catalog.categories c ON c.id = s.category_id
JOIN catalog.question_assignments a
  ON a.scope = 'global' OR a.category_id = c.id OR a.subcategory_id = s.id
JOIN catalog.questions q ON q.id = a.question_id
WHERE c.code = @categoria AND s.code = @subcategoria
  AND a.is_active = 1 AND q.is_active = 1
ORDER BY CASE a.section WHEN 'business' THEN 1 ELSE 2 END,
         CASE a.scope WHEN 'global' THEN 1 WHEN 'category' THEN 2 ELSE 3 END,
         a.sort_order;
GO

-- 7. Opciones de una pregunta
-- Muestra las opciones de una pregunta en orden: rango numérico (value_min /
-- value_max, NULL = sin tope), si es la opción "No sé" (is_unknown) y su
-- metadata JSON. Cambiar @pregunta para ver otra.
DECLARE @pregunta varchar(60) = 'budget';

SELECT o.sort_order, o.code, o.label, o.value_min, o.value_max, o.is_unknown, o.metadata, o.is_active
FROM catalog.question_options o
JOIN catalog.questions q ON q.id = o.question_id
WHERE q.code = @pregunta
ORDER BY o.sort_order;
GO

-- 8. Resumen de preguntas y sus opciones
-- Una fila por pregunta con su tipo (single/multi choice), cuántas opciones
-- activas tiene y sus códigos en orden. Útil para revisar el banco completo.
SELECT q.code, q.input_type, COUNT(o.id) AS opciones,
       STRING_AGG(CAST(o.code AS nvarchar(max)), ', ') WITHIN GROUP (ORDER BY o.sort_order) AS codigos
FROM catalog.questions q
LEFT JOIN catalog.question_options o ON o.question_id = q.id AND o.is_active = 1
GROUP BY q.code, q.input_type
ORDER BY q.code;
GO

-- 9. Preguntas compartidas entre rubros
-- Preguntas asignadas en más de un lugar (ej. price_level en restaurante y
-- cafetería). Cambiar una de estas afecta a todos los rubros que la usan.
SELECT q.code, COUNT(*) AS asignaciones,
       STRING_AGG(COALESCE(s.code, c.code, 'global'), ', ') AS donde
FROM catalog.question_assignments a
JOIN catalog.questions q ON q.id = a.question_id
LEFT JOIN catalog.subcategories s ON s.id = a.subcategory_id
LEFT JOIN catalog.categories c ON c.id = a.category_id
GROUP BY q.code
HAVING COUNT(*) > 1;
GO

/* ============================================================
   OTRAS CONSULTAS BÁSICAS
   ============================================================ */

-- 10. Roles
-- Lista los roles (planes), cuál es el rol por defecto para usuarios nuevos
-- (is_default = 1, solo puede haber uno) y cuántos usuarios tiene cada uno.
SELECT r.id, r.name, r.description, r.is_default, COUNT(u.id) AS usuarios
FROM users.roles r
LEFT JOIN users.users u ON u.role_id = r.id
GROUP BY r.id, r.name, r.description, r.is_default
ORDER BY r.id;
GO

-- 11. Cantidad de filas por tabla
-- Foto rápida del estado de la base: todas las tablas de todos los schemas
-- con su cantidad de filas (según las estadísticas de SQL Server).
SELECT s.name + '.' + t.name AS tabla, SUM(p.rows) AS filas
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
GROUP BY s.name, t.name
ORDER BY s.name, t.name;
GO

-- 12. Migraciones aplicadas
-- Migraciones que Umzug ya ejecutó sobre esta base (npm run db:migrate).
SELECT name AS migracion
FROM dbo.SequelizeMeta
ORDER BY name;
GO

-- 13. Análisis realizados
-- Lista los análisis (más recientes primero) con su estado (draft/saved),
-- el usuario (si tiene), el rubro y cuántas respuestas se cargaron.
SELECT a.id, a.status, a.created_at, u.email, c.code AS categoria, s.code AS subcategoria,
       COUNT(r.id) AS respuestas
FROM analysis.analyses a
JOIN catalog.subcategories s ON s.id = a.subcategory_id
JOIN catalog.categories c ON c.id = s.category_id
LEFT JOIN users.users u ON u.id = a.user_id
LEFT JOIN analysis.analysis_answers r ON r.analysis_id = a.id
GROUP BY a.id, a.status, a.created_at, u.email, c.code, s.code
ORDER BY a.created_at DESC;
GO
