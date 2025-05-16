import { Router } from 'express'
import { getConnection } from '../config/db'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body

  const pool = await getConnection()
  const result = await pool
    .request()
    .input('username', username)
    .input('password', password)
    .query(
      'SELECT * FROM dbo.usuarioKiosco WHERE username = @username AND password = @password'
    )

  if (result.recordset.length === 0) {
    res.status(401).json({ message: 'Credenciales invalidas' })
    return
  }

  const { password: _, ...user } = result.recordset[0]

  res.status(200).json({ message: 'Login exitoso', user })
})
