import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env.js'
import { corsOptions } from './config/cors.js'
import routes from './routes/index.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

// Detrás de un proxy (producción): req.ip real para el rate limit y cookies Secure
if (env.isProduction) {
  app.set('trust proxy', 1)
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan(env.isProduction ? 'combined' : 'dev'))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
