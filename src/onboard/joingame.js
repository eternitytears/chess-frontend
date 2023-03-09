import React from 'react'
import { useParams } from 'react-router-dom'
const socket  = require('../connection/socket').socket

const JoinGameRoom = (userName) => {
    socket.emit("start quick game", userName)
}
  
  
const JoinGame = (props) => {
    JoinGameRoom(props.userName)
    return <div>
    </div>
}

export default JoinGame
  
