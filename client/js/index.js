import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js'

const form = document.querySelector('#formMsg')
const input = document.querySelector('#inputMsg')
const messages = document.querySelector('#messages')
const button = document.querySelector('#buttonMsg')
const roomList = document.querySelector('#roomList')
const nameRoom = document.querySelector('#nameRoom')
const sessionName = document.querySelector('#sessionName')

let socket = io({
    auth: {
        username: 'anonymous',
        serverOffset: 0
    }
});

let username = null
let actualRoom = null

const tryLogin = () => {
    Swal.fire({
        title:'Login',
        input:'text',
        inputPlaceholder:'Type your username',
        inputAttributes: {
            autocapitalize: 'off'
        },
        confirmButtonText: 'SEND',
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        inputValidator: (value) => {

            if (!value) {
                return 'You need type a username!'
            }else{
                socket.auth.username = value
                socket.emit('tryLogin', value)
            }

        },
        preConfirm: async () => {
            return new Promise((resolve) => {
                socket.on('errorToLogin', (response) => {
                    console.log(`Error to login with ${response}`)
                    Swal.showValidationMessage('The user name is in use')
                    resolve(undefined)
                })
    
                socket.on('loginSuccess', (response) => {
                    console.log(`Login success with username: ${response}`)
                    resolve(response)
                })
            })
        },        
    }).then((response) => {
        if(response.value){
            socket.username = response.value
            username = response.value;
            button.disabled = false
            sessionName.innerHTML = username
        }else{
            throw new Error('Login error')
        }
    })
}

const signal = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
})

socket.on('connect', () => {
   tryLogin()
})

socket.on('clientConnected', (user) => {
    if(username != null){
        const item = `<li id=${user}>${user}</li>`
        roomList.insertAdjacentHTML('beforeend', item)
        document.querySelector(`#${user}`).addEventListener('click', () => {
            document.querySelector(`#${user}`).classList.remove('alertNewMsg')
            document.querySelectorAll('.message').forEach((msg) => msg.remove())
            actualRoom = user
            nameRoom.innerHTML = user
            socket.emit('getMsgs', user)
        })
    }
})

socket.on('clientDisconnected', (user) => {
    document.querySelector(`#${user}`).remove()
    if(actualRoom == user){
        actualRoom = null
        nameRoom.innerHTML = ''
        document.querySelectorAll('.message').forEach((msg) => msg.remove())
    }
})

socket.on('chat message', (msg) => {
    if(msg.username == actualRoom || msg.username == username){
        const item = `<li class="message">${msg.username}: ${msg.message}</li>`
        messages.insertAdjacentHTML('beforeend', item)
        socket.auth.serverOffset = msg.serverOffset
    }else if(msg.username != actualRoom){
        document.querySelector(`#${msg.username}`).classList.add('alertNewMsg')
        signal.fire({
            icon: 'info',
            title: `New message recived to ${msg.username}`
          })
    }

})

form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (input.value && username != null && socket != null && actualRoom != null) {
        socket.emit('chat message',
            {
                message: input.value.trim(),
                addressed: actualRoom
            })
        input.value = ''
    }
})