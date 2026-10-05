import { Router } from 'express'
import {
  getCategories,
  getCategory,
  getSubcategoryQuestions,
} from '../controllers/categories.controller.js'

const router = Router()

router.get('/', getCategories)
router.get('/:code', getCategory)
router.get('/:categoryCode/subcategories/:subcategoryCode/questions', getSubcategoryQuestions)

export default router
