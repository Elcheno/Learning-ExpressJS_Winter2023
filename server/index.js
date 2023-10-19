import express from 'express'
import logger from 'morgan'
import { Server } from "socket.io";
import { createServer } from 'node:http'

const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
const io = new Server(server)

io.use((socket, next) => {
  console.log(socket.handshake.headers['username'])
  // AQUI COMPROBARIA LA CONEXION DEL CLIENTE MEDIATE EL USERNAME DEL USUARIO
  // CREAR UNA LISTA DE USUARIOS EN LA QUE METER EL USUARIO ACTUAL
  next() //PERMITO LA CONEXION CON EL CLIENTE
})

io.on('connection', (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('a user has disconnected!')
    // AQUI DEBERIA DE SACAR EL USUARIO DE LA LISTA DE USUARIOS DEBIDO A LA DESCONEXION DEL CLIENTE
  })

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  })
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

app.get('/style/style.css', (req, res) => {
  res.sendFile(process.cwd() + '/client/style/style.css')
})

server.listen(port, () => {
  console.log(`Server running in port ${port}`)
})