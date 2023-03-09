import React from 'react'
import {Redirect, Route} from 'react-router-dom'
import uuid from 'uuid/v4'
import CreateNewUser from './signUp'
import img1 from '../chess/assets/image1.png';
const socket  = require('../connection/socket').socket

class CreateNewGame extends React.Component {
    state = {
        didGetUserName: false,
        inputText: "",
        gameId: ""
    }

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }
    
    send = () => {
        const newGameRoomId = uuid()

        this.setState({
            gameId: newGameRoomId
        })

        socket.emit('createNewGame', newGameRoomId)
    }

    typingUserName = () => {
        const typedText = this.textArea.current.value
        this.setState({
            inputText: typedText
        })
    }

    typingUserPassword = () => {
        const typedText = this.textArea.current.value
        this.setState({
            inputText: typedText
        })
    }

    render() {
        return (<React.Fragment>
            {
                this.state.didGetUserName ?

                <Redirect to = {"/game"}><button className="btn btn-success" style = {{marginLeft: String((window.innerWidth / 2) - 60) + "px", width: "120px"}}>Начать игру</button></Redirect>

            :
               <div>
                   <h1 style={{textAlign: "center", marginTop: String((window.innerHeight / 7)) + "px"}}>Авторизация:</h1>

                   <input style={{marginLeft: String((window.innerWidth / 2) - 120) + "px", width: "240px", marginTop: "10px"}}
                          ref = {this.textArea}
                          placeholder = {"Имя пользователя"}
                          onInput = {this.typingUserName}></input>

                   <input style={{marginLeft: String((window.innerWidth / 2) - 120) + "px", width: "240px", marginTop: "10px"}}
                          ref = {this.textArea}
                          placeholder = {"Пароль"}
                          type={"password"}
                          onInput = {this.typingUserPassword}></input>

                   <button className="btn btn-primary"
                        style = {{marginLeft: String((window.innerWidth / 2) - 60) + "px", width: "120px", marginTop: "10px", background: 'grey',
                            border: 'darkgrey', color: 'black'}}

                        disabled = {!(this.state.inputText.length > 0)} 
                        onClick = {() => {
                            this.props.setUserName(this.state.inputText) 
                            this.setState({
                                didGetUserName: true
                            })
                            this.send()
                        }}><b>Войти</b></button>


                   <a href = "signUp.js" style = {{marginLeft: String((window.innerWidth / 2) - 75) + "px",marginTop: "10px", }}>
                       <b>Зарегитрироваться</b></a>

                   <img src={img1} alt="img1" style={{marginLeft: String((window.innerWidth / 2) - 350) + "px", marginTop: "50px" }}/>

                </div>
            }
            </React.Fragment>)
    }
}

const Onboard = (props) => {
    return <CreateNewGame  setUserName = {props.setUserName}/>
}


export default Onboard