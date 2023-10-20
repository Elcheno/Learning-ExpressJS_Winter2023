import express from 'express'
import logger from 'morgan'
import dotenv from 'dotenv'

import { createClient } from '@libsql/client'
import { Server } from "socket.io"
import { createServer } from 'node:http'

dotenv.config()
const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
const io = new Server(server, {
  connectionStateRecovery: {}
})

const db = createClient({
  url:'libsql://deciding-warbound-elcheno.turso.io',
  authToken: process.env.DB_TOKEN
})

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    content TEXT
  )
`)

// await db.execute(`
//   DROP TABLE messages
// `)

// await db.execute(`
//     DELETE FROM messages WHERE id < 10
// `)

io.use((socket, next) => {
  // console.log(socket.handshake.headers)
  console.log(socket.handshake.auth.username)
  // AQUI COMPROBARIA LA CONEXION DEL CLIENTE MEDIATE EL USERNAME DEL USUARIO
  // CREAR UNA LISTA DE USUARIOS EN LA QUE METER EL USUARIO ACTUAL
  next() //PERMITO LA CONEXION CON EL CLIENTE
})

io.on('connection', async (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('a user has disconnected!')
    // AQUI DEBERIA DE SACAR EL USUARIO DE LA LISTA DE USUARIOS DEBIDO A LA DESCONEXION DEL CLIENTE
  })

  socket.on('chat message', async (msg) => {
    let result
    console.log(msg)
    try{
      result = await db.execute({
        sql: 'INSERT INTO messages (user, content) VALUES (:user, :content)',
        args:{ 
          user: socket.handshake.auth.username ?? 'notUser',
          content: msg.message
        }
      })
    }catch(e){
      console.error(e)
      return
    }

    io.emit('chat message', msg.user, msg.message, result.lastInsertRowid.toString())
  })

  if(!socket.recovered){
    try{
      const result = await db.execute({
        sql: 'SELECT id, user, content FROM messages WHERE id > (:content)',
        args: {
          content: socket.handshake.auth.serverOffset ?? 0
        }
      })
  
      result.rows.forEach(row => {
        console.log(row.content)
        socket.emit('chat message', row.user, row.content, row.id.toString())
      })
    }catch(e){
      console.error(e)
      return
    }
  }
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