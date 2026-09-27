// Seed idempotente del catálogo de configuración (PZ-6).
// - Identifica cada fila por su clave natural y resuelve las FKs por código.
// - Solo inserta o actualiza: nunca borra (el catálogo usado se desactiva, no se elimina).
// - No toca is_active de filas existentes: si alguien desactivó una opción, el seed la respeta.
// - Todo en una transacción: si algo falla, no queda nada a medias.
import { Op } from 'sequelize'
import { sequelize } from '../sequelize.js'
import {
  Category,
  Question,
  QuestionAssignment,
  QuestionOption,
  Role,
  Subcategory,
  SubcategorySearchTerm,
} from '../../models/index.js'
import * as data from './data/catalog.js'

/**
 * Busca por `where` (clave natural). Si no existe la crea con where + values;
 * si existe actualiza solo los campos de `values` que cambiaron.
 * (bulkCreate con updateOnDuplicate no está soportado en MSSQL.)
 */
export async function upsertBy(model, where, values, transaction, stats) {
  const counter = (stats[model.name] ??= { created: 0, updated: 0, unchanged: 0 })
  const existing = await model.findOne({ where, transaction })

  if (!existing) {
    counter.created++
    return model.create({ ...where, ...values }, { transaction })
  }

  existing.set(values)
  if (existing.changed()) {
    counter.updated++
    await existing.save({ transaction })
  } else {
    counter.unchanged++
  }
  return existing
}

async function seedRoles(transaction, stats) {
  const defaultRole = data.roles.find((role) => role.isDefault)

  // El índice UQ_roles_is_default admite un solo rol por defecto: primero se
  // apaga cualquier otro que lo tenga (UPDATE, no DELETE) y los no-default van antes.
  if (defaultRole) {
    await Role.update(
      { isDefault: false },
      { where: { isDefault: true, name: { [Op.ne]: defaultRole.name } }, transaction },
    )
  }
  const ordered = [...data.roles].sort((a, b) => Number(a.isDefault) - Number(b.isDefault))

  for (const { name, description = null, isDefault = false } of ordered) {
    await upsertBy(Role, { name }, { description, isDefault }, transaction, stats)
  }
}

async function seedCategories(transaction, stats) {
  const subcategoryIds = new Map()

  for (const { code, name, description = null, sortOrder = 0, subcategories = [] } of data.categories) {
    const category = await upsertBy(Category, { code }, { name, description, sortOrder }, transaction, stats)

    for (const sub of subcategories) {
      const subcategory = await upsertBy(
        Subcategory,
        { categoryId: category.id, code: sub.code },
        { name: sub.name, description: sub.description ?? null, sortOrder: sub.sortOrder ?? 0 },
        transaction,
        stats,
      )
      subcategoryIds.set(`${code}/${sub.code}`, subcategory.id)

      for (const term of sub.searchTerms ?? []) {
        await upsertBy(
          SubcategorySearchTerm,
          { subcategoryId: subcategory.id, termType: term.termType, termValue: term.termValue },
          { isPrimary: term.isPrimary ?? false },
          transaction,
          stats,
        )
      }
    }
  }

  return { subcategoryIds, categoryIds: await categoryIdsByCode(transaction) }
}

async function categoryIdsByCode(transaction) {
  const rows = await Category.findAll({ attributes: ['id', 'code'], transaction })
  return new Map(rows.map((row) => [row.code, row.id]))
}

function resolveAssignmentTarget(assignment, { categoryIds, subcategoryIds }, questionCode) {
  if (assignment.scope === 'global') {
    return { categoryId: null, subcategoryId: null }
  }
  if (assignment.scope === 'category') {
    const categoryId = categoryIds.get(assignment.category)
    if (!categoryId) throw new Error(`${questionCode}: categoría "${assignment.category}" no existe`)
    return { categoryId, subcategoryId: null }
  }
  const key = `${assignment.category}/${assignment.subcategory}`
  const subcategoryId = subcategoryIds.get(key)
  if (!subcategoryId) throw new Error(`${questionCode}: subcategoría "${key}" no existe`)
  return { categoryId: null, subcategoryId }
}

async function seedQuestions(transaction, stats, lookups) {
  for (const q of data.questions) {
    const question = await upsertBy(
      Question,
      { code: q.code },
      { prompt: q.prompt, helpText: q.helpText ?? null, inputType: q.inputType },
      transaction,
      stats,
    )

    for (const [index, option] of q.options.entries()) {
      await upsertBy(
        QuestionOption,
        { questionId: question.id, code: option.code },
        {
          label: option.label,
          valueMin: option.valueMin ?? null,
          valueMax: option.valueMax ?? null,
          isUnknown: option.isUnknown ?? false,
          metadata: option.metadata ?? null,
          sortOrder: index + 1,
        },
        transaction,
        stats,
      )
    }

    for (const assignment of q.assignments) {
      const target = resolveAssignmentTarget(assignment, lookups, q.code)
      await upsertBy(
        QuestionAssignment,
        { questionId: question.id, scope: assignment.scope, ...target },
        { section: assignment.section, isRequired: assignment.isRequired ?? true, sortOrder: assignment.sortOrder },
        transaction,
        stats,
      )
    }
  }
}

/** Corre el seed completo en una transacción y devuelve created/updated/unchanged por modelo. */
export async function seedCatalog() {
  const stats = {}
  await sequelize.transaction(async (transaction) => {
    await seedRoles(transaction, stats)
    const lookups = await seedCategories(transaction, stats)
    await seedQuestions(transaction, stats, lookups)
  })
  return stats
}
