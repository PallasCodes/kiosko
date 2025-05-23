import express from 'express'
import dotenv from 'dotenv'
import routes from './routes'
import { errorMiddleware } from './middlewares/error.middleware'
import cors from 'cors'

dotenv.config()

export const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('public'))
app.use('/api', routes)
app.use(errorMiddleware)
