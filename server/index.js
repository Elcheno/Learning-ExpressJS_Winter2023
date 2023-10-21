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
const userList = []
const flag =false

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
  next()
})

io.on('connection', async (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', (reason) => {
    const username = socket.handshake.auth.username
    if(userList.includes(username)){
      userList.splice(userList.indexOf(username), 1)
      console.log(userList)
    }
    console.log('a user has disconnected!')
    // AQUI DEBERIA DE SACAR EL USUARIO DE LA LISTA DE USUARIOS DEBIDO A LA DESCONEXION DEL CLIENTE
  })

  socket.on('chat message', async (msg) => {
    let username = socket.handshake.auth.username
    if(username != null && username != 'anonymous' && username != ''){
      let result
      try{
        result = await db.execute({
          sql: 'INSERT INTO messages (user, content) VALUES (:user, :content)',
          args:{ 
            user: username ?? 'anonymous',
            content: msg.message
          }
        })
      }catch(e){
        console.error(e)
        return
      }
  
      io.emit('chat message', {
        username: socket.handshake.auth.username, 
        message: msg.message, 
        serverOffset: result.lastInsertRowid.toString()
      })
    }

  })

  socket.on('tryLogin', (username) => {
    if(username != 'anonymous' && username != null && username != '' && !userList.includes(username)){
      userList.push(username)
      socket.emit('loginSuccess', username)
      socket.handshake.auth.username = username
    }else{
      socket.emit('errorToLogin', username)
    }
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
        socket.emit('chat message', {
          username: row.user, 
          message: row.content, 
          serverOffset: row.id.toString()
        })
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

app.get('/js/index.js', (req, res) => {
  res.sendFile(process.cwd() + '/client/js/index.js')
})

app.get('/src/favicon/favicon.ico', (req, res) => {
  res.sendFile(process.cwd() + '/client/src/favicon/favicon.ico')
})

server.listen(port, () => {
  console.log(`Server running in port ${port}`)
})