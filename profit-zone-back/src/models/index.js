// Punto de entrada de los modelos: los importa y define las asociaciones.
// Las tablas las crean las migraciones (src/db/migrations): nunca usar sync().
import { Role } from './users/Role.js'
import { User } from './users/User.js'
import { AuthToken } from './users/AuthToken.js'
import { Category } from './catalog/Category.js'
import { Subcategory } from './catalog/Subcategory.js'
import { SubcategorySearchTerm } from './catalog/SubcategorySearchTerm.js'
import { Question } from './catalog/Question.js'
import { QuestionOption } from './catalog/QuestionOption.js'
import { QuestionAssignment } from './catalog/QuestionAssignment.js'
import { ImplicitRule } from './catalog/ImplicitRule.js'
import { Analysis } from './analysis/Analysis.js'
import { AnalysisAnswer } from './analysis/AnalysisAnswer.js'

// users
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' })
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })

User.hasMany(AuthToken, { foreignKey: 'userId', as: 'authTokens', onDelete: 'CASCADE' })
AuthToken.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// catalog
Category.hasMany(Subcategory, { foreignKey: 'categoryId', as: 'subcategories' })
Subcategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })

Subcategory.hasMany(SubcategorySearchTerm, { foreignKey: 'subcategoryId', as: 'searchTerms', onDelete: 'CASCADE' })
SubcategorySearchTerm.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' })

Question.hasMany(QuestionOption, { foreignKey: 'questionId', as: 'options', onDelete: 'CASCADE' })
QuestionOption.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })

Question.hasMany(QuestionAssignment, { foreignKey: 'questionId', as: 'assignments', onDelete: 'CASCADE' })
QuestionAssignment.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })
QuestionAssignment.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
QuestionAssignment.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' })
Category.hasMany(QuestionAssignment, { foreignKey: 'categoryId', as: 'questionAssignments' })
Subcategory.hasMany(QuestionAssignment, { foreignKey: 'subcategoryId', as: 'questionAssignments' })

QuestionOption.hasMany(ImplicitRule, { foreignKey: 'optionId', as: 'implicitRules' })
ImplicitRule.belongsTo(QuestionOption, { foreignKey: 'optionId', as: 'option' })

// analysis
User.hasMany(Analysis, { foreignKey: 'userId', as: 'analyses' })
Analysis.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Subcategory.hasMany(Analysis, { foreignKey: 'subcategoryId', as: 'analyses' })
Analysis.belongsTo(Subcategory, { foreignKey: 'subcategoryId', as: 'subcategory' })

Analysis.hasMany(AnalysisAnswer, { foreignKey: 'analysisId', as: 'answers', onDelete: 'CASCADE' })
AnalysisAnswer.belongsTo(Analysis, { foreignKey: 'analysisId', as: 'analysis' })
AnalysisAnswer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' })
AnalysisAnswer.belongsTo(QuestionOption, { foreignKey: 'optionId', as: 'option' })

export {
  Role,
  User,
  AuthToken,
  Category,
  Subcategory,
  SubcategorySearchTerm,
  Question,
  QuestionOption,
  QuestionAssignment,
  ImplicitRule,
  Analysis,
  AnalysisAnswer,
}
