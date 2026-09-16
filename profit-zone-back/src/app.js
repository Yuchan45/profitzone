import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import { corsOptions } from './config/cors.js'
import routes from './routes/index.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.isProduction ? 'combined' : 'dev'))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
