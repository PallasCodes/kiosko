import { Router } from 'express'

import { estadoCtaRouter } from '../controllers/estado-cuenta.controller'
import { clienteRouter } from '../controllers/cliente.controller'

const router = Router()

router.use('/estado-cuenta', estadoCtaRouter)
router.use('/cliente', clienteRouter)

export default router
