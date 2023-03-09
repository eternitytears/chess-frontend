import React from 'react'
import Game from '../model/chess'
import Square from '../model/square'
import { Stage, Layer } from 'react-konva';
import Board from '../assets/chessBoard.png'
import useSound from 'use-sound'
import chessMove from '../assets/moveSoundEffect.mp3'
import Piece from './piece'
import piecemap from './piecemap'
import { useParams } from 'react-router-dom'
import { ColorContext } from '../../context/colorcontext'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
const socket  = require('../../connection/socket').socket

class ChessGame extends React.Component {

    state = {
        gameState: new Game(this.),
        draggedPieceTargetId: "", // empty string means no piece is being dragged
        playerTurnToMoveIsWhite: true,
        whiteKingInCheck: false,
        blackKingInCheck: false
    }

    componentDidMount() {
        console.log(this.props.myUserName)
        console.log(this.props.opponentUserName)
        // register event listeners
        socket.on('opponent move', move => {
            // move == [pieceId, finalPosition]
            console.log("opponenet's move: " + move.selectedId + ", " + move.finalPosition)

            if (move.playerColorThatJustMovedIsWhite !== color) {
                this.movePiece(move.selectedId, move.finalPosition, this.state.gameState, false)
                this.setState({
                    playerTurnToMoveIsWhite: !move.playerColorThatJustMovedIsWhite
                })
            }

        })
    }

    startDragging = (e) => {
        this.setState({
            draggedPieceTargetId: e.target.attrs.id
        })
    }


    movePiece = (selectedId, finalPosition, currentGame, isMyMove) => {
        var whiteKingInCheck = false
        var blackKingInCheck = false
        var blackCheckmated = false
        var whiteCheckmated = false
        const update = currentGame.movePiece(selectedId, finalPosition, isMyMove)

        if (update === "moved in the same position.") {
            this.revertToPreviousState(selectedId) // pass in selected ID to identify the piece that messed up
            return
        } else if (update === "user tried to capture their own piece") {
            this.revertToPreviousState(selectedId)
            return
        } else if (update === "b is in check" || update === "w is in check") {
            if (update[0] === "b") {
                blackKingInCheck = true
            } else {
                whiteKingInCheck = true
            }
        } else if (update === "b has been checkmated" || update === "w has been checkmated") {
            if (update[0] === "b") {
                blackCheckmated = true
            } else {
                whiteCheckmated = true
            }
        } else if (update === "invalid move") {
            this.revertToPreviousState(selectedId)
            return
        }

        if (isMyMove) {
            socket.emit('new move', {
                nextPlayerColorToMove: !this.state.gameState.thisPlayersColorIsWhite,
                playerColorThatJustMovedIsWhite: this.state.gameState.thisPlayersColorIsWhite,
                selectedId: selectedId,
                finalPosition: finalPosition,
                gameId: this.props.gameId
            })
        }


        this.props.playAudio()

        this.setState({
            draggedPieceTargetId: "",
            gameState: currentGame,
            playerTurnToMoveIsWhite: !color,
            whiteKingInCheck: whiteKingInCheck,
            blackKingInCheck: blackKingInCheck
        })

        if (blackCheckmated) {
            alert("WHITE WON BY CHECKMATE!")
        } else if (whiteCheckmated) {
            alert("BLACK WON BY CHECKMATE!")
        }
    }


    endDragging = (e) => {
        const currentGame = this.state.gameState
        const currentBoard = currentGame.getBoard()
        const finalPosition = this.inferCoord(e.target.x() + 90, e.target.y() + 90, currentBoard)
        const selectedId = this.state.draggedPieceTargetId
        this.movePiece(selectedId, finalPosition, currentGame, true)
    }

    revertToPreviousState = (selectedId) => {
        const oldGS = this.state.gameState
        const oldBoard = oldGS.getBoard()
        const tmpGS = new Game(true)
        const tmpBoard = []

        for (var i = 0; i < 8; i++) {
            tmpBoard.push([])
            for (var j = 0; j < 8; j++) {
                if (oldBoard[i][j].getPieceIdOnThisSquare() === selectedId) {
                    tmpBoard[i].push(new Square(j, i, null, oldBoard[i][j].canvasCoord))
                } else {
                    tmpBoard[i].push(oldBoard[i][j])
                }
            }
        }

        tmpGS.setBoard(tmpBoard)

        this.setState({
            gameState: tmpGS,
            draggedPieceTargetId: "",
        })

        this.setState({
            gameState: oldGS,
        })
    }


    inferCoord = (x, y, chessBoard) => {
        // console.log("actual mouse coordinates: " + x + ", " + y)
        var hashmap = {}
        var shortestDistance = Infinity
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                const canvasCoord = chessBoard[i][j].getCanvasCoord()
                // calculate distance
                const delta_x = canvasCoord[0] - x
                const delta_y = canvasCoord[1] - y
                const newDistance = Math.sqrt(delta_x**2 + delta_y**2)
                hashmap[newDistance] = canvasCoord
                if (newDistance < shortestDistance) {
                    shortestDistance = newDistance
                }
            }
        }

        return hashmap[shortestDistance]
    }



    render() {
        // console.log(this.state.gameState.getBoard())
       //  console.log("it's white's move this time: " + this.state.playerTurnToMoveIsWhite)
        // console.log(this.state.gameState.getBoard())
        //let array = this.state.coordinate.split(" ")
        return (
        <React.Fragment>

        <div style={{display: "flex"}}>
        <div style = {{
            backgroundImage: `url(${Board})`,
            width: "640px",
            height: "640px",
            marginLeft: "75px"
        }}
        >
            <Stage width = {640} height = {640}>
                <Layer>
                {this.state.gameState.getBoard().map((row) => {
                        return (<React.Fragment>
                                {row.map((square) => {
                                    if (square.isOccupied()) {
                                        return (
                                            <Piece
                                                x = {square.getCanvasCoord()[0]}
                                                y = {square.getCanvasCoord()[1]}
                                                imgurls = {piecemap[square.getPiece().name]}
                                                isWhite = {square.getPiece().color === "white"}
                                                draggedPieceTargetId = {this.state.draggedPieceTargetId}
                                                onDragStart = {this.startDragging}
                                                onDragEnd = {this.endDragging}

                                                id = {square.getPieceIdOnThisSquare()}
                                                thisPlayersColorIsWhite = {color}
                                                playerTurnToMoveIsWhite = {this.state.playerTurnToMoveIsWhite}
                                                whiteKingInCheck = {this.state.whiteKingInCheck}
                                                blackKingInCheck = {this.state.blackKingInCheck}

                                                />)
                                    }
                                    return
                                })}
                            </React.Fragment>)
                    })}
                </Layer>
            </Stage>

        </div>
            <div>
                <TableContainer component={Paper} style={{height: "640px"}}>
                    <Table  aria-label="a dense table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Color</TableCell>
                                <TableCell align="right">Move</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.gameState.state.coordinate.map((row) => (
                                <TableRow key={row.color}>
                                    <TableCell align="center">{row.color}</TableCell>
                                    <TableCell align="right">{row.move}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
        </React.Fragment>)
    }
}



const ChessGameWrapper = (props) => {
    /**
     * player 1
     *      - socketId 1
     *      - socketId 2 ???
     * player 2
     *      - socketId 2
     *      - socketId 1
     */


    const domainName = 'http://localhost:3000'
    const [play] = useSound(chessMove);
    const [opponentDidJoinTheGame, didJoinGame] = React.useState(false)
    const [opponentUserName, setUserName] = React.useState('')
    const [gameid, setGameId] = React.useState('')


    React.useEffect(() => {
        socket.on('start game', (opponentUserName, color, gameId) => {
            console.log("START!")
                console.log(opponentUserName + " " +  color + " " + gameId)
                setUserName(opponentUserName)
                setGameId(gameId)
                color
                didJoinGame(true)
        })
    }, [])


    return (
      <React.Fragment>
        {opponentDidJoinTheGame ? (
          <div>
            <h5 style={{ marginLeft: "75px", marginTop: "15px" }}> Противник: {opponentUserName} </h5>
            <div style={{ display: "flex" }}>
              <ChessGame
                playAudio={play}
                gameId={gameid}
                color={color}
              />
            </div>
            <h5 style={{ marginLeft: "75px" }}> Вы: {props.myUserName} </h5>
            </div>
        ) :  (
          <div>
            <h1
              style={{
                textAlign: "center",
                marginTop: String(window.innerHeight / 8) + "px",
              }}
            >
              Привет, <strong>{props.myUserName}</strong>, скопируй и отправь ссылку другу:
            </h1>
            <textarea
              style={{ marginLeft: String((window.innerWidth / 2) - 290) + "px", marginTop: "30" + "px", width: "580px", height: "30px"}}
              onFocus={(event) => {
                  console.log('sd')
                  event.target.select()
              }}
              value = {domainName + "/game/" + gameid}
              type = "text">
              </textarea>
            <br></br>

            <h1 style={{ textAlign: "center", marginTop: "100px" }}>
              {" "}
              Подожди, пока оппонент подключиться...{" "}
            </h1>
          </div>
        )}
      </React.Fragment>
    );
};

export default ChessGameWrapper
