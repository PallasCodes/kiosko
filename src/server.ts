// src/server.ts
import { app } from './app'
import { config } from './config/env'
import http from 'http'
import { initSocket } from './websocket'

const PORT = config.PORT

const server = http.createServer(app)

initSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
