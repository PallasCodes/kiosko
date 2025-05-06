import { Router } from 'express'
import { estadoCtaRouter } from '../controllers/estado-cuenta.controller'

const router = Router()

router.use('/estado-cuenta', estadoCtaRouter)

export default router
