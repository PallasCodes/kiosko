import { Router } from 'express'

import { estadoCtaRouter } from '../controllers/estado-cuenta.controller'
import { clienteRouter } from '../controllers/cliente.controller'
import { authRouter } from '../controllers/auth.controller'

const router = Router()

router.use('/estado-cuenta', estadoCtaRouter)
router.use('/cliente', clienteRouter)
router.use('/auth', authRouter)

export default router
