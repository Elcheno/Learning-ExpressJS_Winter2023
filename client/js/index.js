import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js'

const btnUsername = document.querySelector('#setUsername')
const formUsername = document.querySelector('#user-form')
const inputUsername = document.querySelector('#user-input')
const form = document.querySelector('#formMsg')
const input = document.querySelector('#inputMsg')
const messages = document.querySelector('#messages')
const button = document.querySelector('#buttonMsg')
const chatSection = document.querySelector('#chatSection')

let socket = io({
    auth: {
        username: 'anonymous',
        serverOffset: 0
    }
});
let username = null

// socket.on('connect', () => {
//     console.log(socket.id)
// })

formUsername.addEventListener('submit', (e) => {
    e.preventDefault()
    if(inputUsername.value.trim()){
        username = inputUsername.value.trim()

        // socket.disconnect()
        
        socket.auth.username = username
        console.log(socket.auth.username)

        socket.emit('tryLogin', username)
    }
})

socket.on('loginSuccess', (username) => {
    console.log(`Login success with username: ${username}`)
    btnUsername.disabled = true
    inputUsername.disabled = true
    button.disabled = false
    chatSection.style.filter = 'none'
})

socket.on('errorToLogin', (username) => {
    console.log(`Error to login with ${username}`)
})

socket.on('chat message', (msg) => {
    const item = `<li>${msg.username}: ${msg.message}</li>`
    messages.insertAdjacentHTML('beforeend', item)
    socket.auth.serverOffset = msg.serverOffset
})

form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (input.value && username != null && socket != null) {
        socket.emit('chat message',
            {
                message: input.value.trim()
            })
        input.value = ''
    }
})