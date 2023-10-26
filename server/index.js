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

app.use(logger('dev'))

const userList = new Map()

const db = createClient({
  url:'libsql://deciding-warbound-elcheno.turso.io',
  authToken: process.env.DB_TOKEN
})

// await db.execute(`
//   DROP TABLE messages
// `)

// await db.execute(`
//     DELETE FROM messages WHERE id < 100
// `)

// await db.execute(`
//   CREATE TABLE IF NOT EXISTS messages (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     sender TEXT,
//     addressed TEXT,
//     content TEXT
//   )
// `)

io.use((socket, next) => {
  next()
})

io.on('connection', async (socket) => {
  console.log('Usuario conectado')

  socket.on('disconnect', (reason) => {
      userList.delete(socket.username)
      socket.broadcast.emit('clientDisconnected', socket.username)
      console.log('Usuario desconectado')

  })

  socket.on('chat message', async ({ message, addressed}) => {
    let username = socket.username
    const addressedId = userList.get(addressed).socketId

    if(username != null || username != 'anonymous' || username != '' || addressedId){
      let result
      try{
        result = await db.execute({
          sql: 'INSERT INTO messages (sender, addressed, content) VALUES (:sender, :addressed, :content)',
          args:{ 
            sender: username ?? 'anonymous',
            addressed: addressed,
            content: message
          }
        })
      }catch(e){
        console.error(e)
        return
      }
  
      io.to(addressedId).emit('chat message', {
        username: socket.username, 
        message: message,
        serverOffset: result.lastInsertRowid.toString()
      })

      socket.emit('chat message', {
        username: socket.username, 
        message: message,
        serverOffset: result.lastInsertRowid.toString()
      })
    }

  })

  socket.on('getMsgs', async (user) => {
    try{
      const result = await db.execute({
        sql: 'SELECT id, sender, addressed, content FROM messages WHERE sender LIKE :user1 AND addressed LIKE :user2 OR sender LIKE :user2 AND addressed LIKE :user1',
        args: {
          user1: socket.username,
          user2: user
        }
      })

      result.rows.forEach(row => {
        socket.emit('chat message', {
          username: row.sender,
          message: row.content, 
          serverOffset: row.id.toString()
        })
      })
    }catch(e){
      console.error(e)
    }
  })

  socket.on('tryLogin', async (username) => {
    if(username != null && username != '' && !userList.has(username)){
      userList.set(username, {username:username, socketId:socket.id})
      socket.emit('loginSuccess', username)
      socket.username = username

      userList.forEach((user) => {
        if(user.socketId != socket.id) socket.emit('clientConnected', user.username)
      })
      socket.broadcast.emit('clientConnected', socket.username)

    }else{
      socket.emit('errorToLogin', username)
    }
  })

})

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