// Verifica el seed del catálogo contra los criterios de aceptación de PZ-6:
// conteos, idempotencia, actualización in-place y preguntas por subcategoría.
// Corre el seed (dos veces) sobre la DB configurada: usar en desarrollo.
//
// Uso (desde profit-zone-back/): npm run db:seed:catalog:verify
import { Op } from 'sequelize'
import { closeDatabase } from '../src/db/sequelize.js'
import { seedCatalog } from '../src/db/seeders/catalog.js'
import {
  Category,
  Question,
  QuestionAssignment,
  QuestionOption,
  Role,
  Subcategory,
  SubcategorySearchTerm,
} from '../src/models/index.js'

const PREFIX = '[ProfitZone]'
const EXPECTED_COUNTS = {
  Role: 3,
  Category: 2,
  Subcategory: 4,
  SubcategorySearchTerm: 5,
  Question: 15,
  QuestionOption: 50,
  QuestionAssignment: 17,
}
const MODELS = { Role, Category, Subcategory, SubcategorySearchTerm, Question, QuestionOption, QuestionAssignment }

let failures = 0
function check(condition, message) {
  console.log(`  ${condition ? 'OK  ' : 'FAIL'} ${message}`)
  if (!condition) failures++
}

async function counts() {
  const result = {}
  for (const [name, model] of Object.entries(MODELS)) result[name] = await model.count()
  return result
}

async function questionsFor(categoryCode, subcategoryCode) {
  const category = await Category.findOne({ where: { code: categoryCode } })
  const subcategory = await Subcategory.findOne({ where: { categoryId: category.id, code: subcategoryCode } })
  return QuestionAssignment.findAll({
    where: {
      isActive: true,
      [Op.or]: [{ scope: 'global' }, { categoryId: category.id }, { subcategoryId: subcategory.id }],
    },
    include: [{ model: Question, as: 'question', where: { isActive: true } }],
    order: [
      ['section', 'ASC'],
      ['sortOrder', 'ASC'],
    ],
  })
}

try {
  console.log('1. Seed y conteos')
  await seedCatalog()
  const first = await counts()
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    check(first[name] === expected, `${name}: ${first[name]} (esperado ${expected})`)
  }
  const defaults = await Role.findAll({ where: { isDefault: true } })
  check(defaults.length === 1 && defaults[0].name === 'free', `un solo rol por defecto: ${defaults.map((r) => r.name)}`)
  const assignments = await QuestionAssignment.count({ group: ['scope'] })
  const byScope = Object.fromEntries(assignments.map((row) => [row.scope, row.count]))
  check(byScope.global === 5 && byScope.subcategory === 12, `asignaciones: ${JSON.stringify(byScope)} (5 global + 12 subcategoría)`)

  console.log('2. Idempotencia (segunda corrida)')
  const stats = await seedCatalog()
  const second = await counts()
  check(JSON.stringify(first) === JSON.stringify(second), 'los conteos no cambian')
  const touched = Object.values(stats).reduce((sum, s) => sum + s.created + s.updated, 0)
  check(touched === 0, `ninguna fila creada ni actualizada (${touched})`)

  console.log('3. Actualización in-place (mismo id)')
  const question = await Question.findOne({ where: { code: 'target_age' } })
  const option = await QuestionOption.findOne({ where: { questionId: question.id, code: 'young' } })
  const originalLabel = option.label
  await option.update({ label: 'Label desactualizado' })
  const repairStats = await seedCatalog()
  const repaired = await QuestionOption.findOne({ where: { questionId: question.id, code: 'young' } })
  check(repaired.id === option.id, `mismo id (${repaired.id})`)
  check(repaired.label === originalLabel, `label actualizado desde el archivo de datos: "${repaired.label}"`)
  check(repairStats.QuestionOption.updated === 1, `solo 1 opción actualizada (${repairStats.QuestionOption.updated})`)

  console.log('4. Preguntas de cafeteria')
  const cafe = await questionsFor('gastronomia', 'cafeteria')
  const business = cafe.filter((a) => a.section === 'business').map((a) => a.question.code)
  const details = cafe.filter((a) => a.section === 'details').map((a) => a.question.code)
  check(business.length === 5, `business: ${business.length} (${business.join(', ')})`)
  check(
    details.join(',') === 'consumption_model,peak_slot_cafe,price_level',
    `details: ${details.join(', ')}`,
  )
} catch (error) {
  console.error(`${PREFIX} Error: ${error.parent?.message ?? error.message}`)
  failures++
} finally {
  await closeDatabase()
}

console.log(failures ? `\n${PREFIX} ${failures} chequeo(s) fallaron.` : `\n${PREFIX} Todos los chequeos pasaron.`)
process.exitCode = failures ? 1 : 0
