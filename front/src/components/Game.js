import React, { useState, useEffect } from 'react'
import './Game.css'
import CodeField from './CodeField'
import Chat from './Chat'

const wsUrl = window.location.origin.replace(/^http/, 'ws')
const instructionMessage = {
  sender: 'liracer',
  content: 'To join a game, send "/join id". If a game by the given id exists you join that, otherwise a new game is created.'
}

const Game = () => {
  const [messages, setMessages] = useState([])
  const [code, setCode] = useState('')
  const [color, setColor] = useState(null)
  const [ws, setWs] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [gameId, setGameId] = useState(null)
  const [cursors, setCursors] = useState({})
  const [cursorPosition, setCursorPosition] = useState(0)
  const [wrongChars, setWrongChars] = useState(0)


  const send = (type, body, id) => {
    const message = {
      type,
      body,
      id
    }
    ws.send(JSON.stringify(message))
  }

  const addMessage = (sender, content) => setMessages((messages) => messages.concat({ sender, content }))
  const addInstructionMessage = () => setMessages((messages) => messages.concat(instructionMessage))

  useEffect(() => {
    addMessage('liracer', 'Welcome to liracer!')
    addInstructionMessage()
    const fetchWs = async () => {
      const websocket = new WebSocket(wsUrl)
      setWs(websocket)
    }
    fetchWs()
  }, [])

  useEffect(() => {
    if(ws === null){
      return
    }

    const dispatch = (message) => {
      const { type, body } = JSON.parse(message.data)

      switch(type){
        case('messages'):
        case('message'):
          setMessages((messages) => messages.concat(body))
          break
        case('quote'):
          setCode(body.code)
          addMessage('liracer', `The current quote is ${body.program} in the ${body.language} language`)
          setCursorPosition(0)
          setWrongChars(0)
          break
        case('cursor'):
          setCursors((cursors) => ({ ...cursors, [body.color]: body.cursorPosition }))
          break
        case('color'):
          setColor(body.color)
          break
        default:
          throw new Error('Could not dispatch message')
      }
    }

    ws.onmessage = dispatch
    // ws.onclose does not work as expected on Chrome.
    // Supposedly it waits 4minutes before calling it. I have not verified this
    // myself although certainly didn't call immediately after closing the
    // connection as I would expect. The workaround for this is to use the
    // onerror property instead.
    //
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1071708 for bug report.
    ws.onerror = () => addMessage('liracer', 'Connection closed. This can probably be resolved by reloading the page.')
  }, [ws])

  const handleSubmitChatInput = (event) => {
    event.preventDefault()

    if(chatInput === '') return

    const dispatch = () => {
      const words = chatInput.split(' ')
      const command = words[0]
      switch(command){
        case('/join'):
          const id = words[1]
          send('join', {}, id)
          setGameId(id)
          setCursors([])
          break
        default:
          if(gameId === null){
            addMessage('liracer', 'You need to be in a game to do this.')
            addInstructionMessage()
          }
          else {
            const message = {
              content: chatInput
            }
            send('message', message, gameId)
          }
      }
    }

    dispatch()
    setChatInput('')
  }

  return (
    <div id="game">
      <Chat messages={messages}
            onSubmitChatInput={handleSubmitChatInput}
            chatInput={chatInput}
            setChatInput={setChatInput}/>
      <CodeField code={code}
                 send={send}
                 gameId={gameId}
                 cursors={cursors}
                 cursorPosition={cursorPosition}
                 setCursorPosition={setCursorPosition}
                 wrongChars={wrongChars}
                 setWrongChars={setWrongChars}
                 color={color}/>
    </div> 
  )
}

export default Game
