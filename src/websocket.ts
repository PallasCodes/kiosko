import { Server, Socket } from 'socket.io'

let io: Server

export const initSocket = (server: any) => {
  io = new Server(server, {
    path: '/ws/socket.io',
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`)

    socket.on('messsage', (data: string) => {
      console.log('📨 Mensaje recibido:', data)
      socket.emit('respuesta', 'Hola desde el servidor!')
    })

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`)
    })
  })
}

export const getSocket = () => io
