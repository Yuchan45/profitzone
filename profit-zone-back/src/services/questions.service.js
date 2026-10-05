import { Op } from 'sequelize'
import {
  Category,
  Subcategory,
  Question,
  QuestionOption,
  QuestionAssignment,
} from '../models/index.js'

const SECTION_ORDER = { business: 1, details: 2 }
const SCOPE_ORDER = { global: 1, category: 2, subcategory: 3 }

function optionsInclude(active) {
  return {
    model: QuestionOption,
    as: 'options',
    required: false,
    where: active === undefined ? undefined : { isActive: active },
  }
}

const OPTIONS_ORDER = [{ model: QuestionOption, as: 'options' }, 'sortOrder', 'ASC']

function toOptionDto(option) {
  return {
    code: option.code,
    label: option.label,
    valueMin: option.valueMin === null ? null : Number(option.valueMin),
    valueMax: option.valueMax === null ? null : Number(option.valueMax),
    isUnknown: option.isUnknown,
    metadata: option.metadata,
    sortOrder: option.sortOrder,
    isActive: option.isActive,
  }
}

function toAssignmentDto(assignment) {
  const category = assignment.category ?? assignment.subcategory?.category ?? null

  return {
    scope: assignment.scope,
    section: assignment.section,
    sortOrder: assignment.sortOrder,
    isRequired: assignment.isRequired,
    isActive: assignment.isActive,
    category: category?.code ?? null,
    subcategory: assignment.subcategory?.code ?? null,
  }
}

/**
 * Lista el banco de preguntas con sus opciones y dónde está asignada cada una.
 * `scope` deja solo las preguntas asignadas con ese scope; `active` filtra
 * preguntas, opciones y asignaciones por is_active.
 */
export async function listQuestions({ scope, active } = {}) {
  const activeWhere = active === undefined ? {} : { isActive: active }
  const assignmentWhere = { ...activeWhere, ...(scope ? { scope } : {}) }

  const questions = await Question.findAll({
    where: activeWhere,
    include: [
      optionsInclude(active),
      {
        model: QuestionAssignment,
        as: 'assignments',
        // Con scope, la pregunta tiene que tener al menos una asignación de ese tipo
        required: Boolean(scope),
        where: Object.keys(assignmentWhere).length > 0 ? assignmentWhere : undefined,
        include: [
          { model: Category, as: 'category', required: false },
          {
            model: Subcategory,
            as: 'subcategory',
            required: false,
            include: [{ model: Category, as: 'category', required: false }],
          },
        ],
      },
    ],
    order: [
      ['code', 'ASC'],
      OPTIONS_ORDER,
      [{ model: QuestionAssignment, as: 'assignments' }, 'scope', 'ASC'],
      [{ model: QuestionAssignment, as: 'assignments' }, 'sortOrder', 'ASC'],
    ],
  })

  return questions.map((question) => {
    const assignments = question.assignments.map(toAssignmentDto)

    return {
      code: question.code,
      prompt: question.prompt,
      helpText: question.helpText,
      inputType: question.inputType,
      isActive: question.isActive,
      optionCount: question.options.length,
      options: question.options.map(toOptionDto),
      assignments,
      isShared: assignments.length > 1,
    }
  })
}

/** Devuelve una pregunta por su code con sus opciones en orden. Lanza 404 si no existe. */
export async function getQuestionByCode(code, { active } = {}) {
  const question = await Question.findOne({
    where: { code, ...(active === undefined ? {} : { isActive: active }) },
    include: [optionsInclude(active)],
    order: [OPTIONS_ORDER],
  })

  if (!question) {
    const error = new Error(`No existe la pregunta "${code}".`)
    error.status = 404
    throw error
  }

  return {
    code: question.code,
    prompt: question.prompt,
    helpText: question.helpText,
    inputType: question.inputType,
    isActive: question.isActive,
    options: question.options.map(toOptionDto),
  }
}

/**
 * Arma la encuesta que ve un usuario de un rubro: preguntas globales + de su
 * categoría + de su subcategoría, solo activas, en el orden en que se muestran
 * (sección "business" = "Tu negocio" primero, después "details").
 */
export async function getSubcategorySurvey(categoryCode, subcategoryCode) {
  const subcategory = await Subcategory.findOne({
    where: { code: subcategoryCode, isActive: true },
    include: [
      { model: Category, as: 'category', required: true, where: { code: categoryCode, isActive: true } },
    ],
  })

  if (!subcategory) {
    const error = new Error(`No existe el rubro "${categoryCode}/${subcategoryCode}".`)
    error.status = 404
    throw error
  }

  const assignments = await QuestionAssignment.findAll({
    where: {
      isActive: true,
      [Op.or]: [
        { scope: 'global' },
        { categoryId: subcategory.categoryId },
        { subcategoryId: subcategory.id },
      ],
    },
    include: [
      {
        model: Question,
        as: 'question',
        required: true,
        where: { isActive: true },
        include: [optionsInclude(true)],
      },
    ],
    order: [[{ model: Question, as: 'question' }, ...OPTIONS_ORDER]],
  })

  const questions = assignments
    .sort(
      (a, b) =>
        SECTION_ORDER[a.section] - SECTION_ORDER[b.section] ||
        SCOPE_ORDER[a.scope] - SCOPE_ORDER[b.scope] ||
        a.sortOrder - b.sortOrder,
    )
    .map((assignment) => ({
      code: assignment.question.code,
      prompt: assignment.question.prompt,
      helpText: assignment.question.helpText,
      inputType: assignment.question.inputType,
      section: assignment.section,
      scope: assignment.scope,
      sortOrder: assignment.sortOrder,
      isRequired: assignment.isRequired,
      options: assignment.question.options.map(toOptionDto),
    }))

  return {
    category: { code: subcategory.category.code, name: subcategory.category.name },
    subcategory: { code: subcategory.code, name: subcategory.name },
    business: questions.filter((q) => q.section === 'business'),
    details: questions.filter((q) => q.section === 'details'),
  }
}
