import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js'

const form = document.querySelector('#formMsg')
const input = document.querySelector('#inputMsg')
const messages = document.querySelector('#messages')
const button = document.querySelector('#buttonMsg')

let socket = io({
    auth: {
        username: 'anonymous',
        serverOffset: 0
    }
});

let username = null

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
            username = response.value;
            button.disabled = false
            console.log(username)
        }else{
            throw new Error('Login error')
        }
    })
}

socket.on('connect', () => {
   tryLogin()
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