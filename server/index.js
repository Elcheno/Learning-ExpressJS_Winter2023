import express from 'express'
import logger from 'morgan'
import { Server } from "socket.io";
import { createServer } from 'node:http'

const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
const io = new Server(server)

io.on('connection', (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('a user has disconnected!')
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