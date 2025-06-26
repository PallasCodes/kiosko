import cors, { CorsOptions } from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { errorMiddleware } from './middlewares/error.middleware'
import routes from './routes'

dotenv.config()

export const app = express()

const whitelist: string[] = process.env.CORS_WHITELIST?.split(',') ?? []

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  },
  credentials: true,
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(express.static('public'))
app.use('/api', routes)
app.use(errorMiddleware)
