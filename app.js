const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
require('dotenv/config')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const axios = require('axios')
const winston = require('winston')
const expressWinston = require('express-winston')
require('winston-daily-rotate-file')

const passport = require('./passport/setup')
const auth = require('./routes/auth')

//Require Routes
const user = require('./routes/user')
const room = require('./routes/room')
const checkFriendStatus = require('./routes/checkFriendStatus')

const twitchApi = require('./routes/twitchApi')

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const clients = {}
const disconnectedClients = {}
const rooms = {}

io.on('connection', (socket) => {
  //Add user to list of connected clients and broadcast that user is online
  socket.on('online', (userId, callback) => {
    if (!(userId in clients)) {
      clients[userId] = { socketId: socket.id, status: '' }
      io.sockets.emit('new-user-online', userId, clients)
    } else {
      //Update socket id but do not broadcast new user online
      clients[userId] = { socketId: socket.id }
    }

    //If a user is has recently disconnected and is waiting to be purged, remove them
    if (userId in disconnectedClients) delete disconnectedClients[userId]

    //Emit updated connected clients to users
    io.sockets.emit('new-user-online', userId, clients)

    //Send back list of active clients when user logs on
    callback(clients)
  })

  //To avoid users being spammed with refresh appearing them offline, when a user leaves, they will be added to a object, and after 30 seconsds anyone in this object is purged/remove from list of active clients
  const purgeDisconnectedClients = () => {
    Object.keys(disconnectedClients).map((disconnectedUser) => {
      if (disconnectedUser in clients) delete clients[disconnectedUser]
    })
    io.sockets.emit('user-offline-update', clients)
  }

  socket.on('user-offline', (userId) => {
    disconnectedClients[userId] = {}
    //Allow for 5 seconds before client is purged and made offline
    setTimeout(() => {
      purgeDisconnectedClients()
    }, 1000 * 5)
  })

  socket.on('leave-room', (roomId, userId) => {
    //On disconnect remove peer from list of connected peers
    let updateRoomPeers
    updateRoomPeers = rooms[roomId]
    updateRoomPeers = updateRoomPeers.filter((item) => item !== userId)
    rooms[roomId] = updateRoomPeers

    //Send notitification of user left room, use to trigger audio que
    socket.to(roomId).broadcast.emit('user-disconnected', userId, rooms[roomId])

    //Broadcast to anyone that may have this room favourited that a user has joined and update room size
    socket.broadcast.emit('user-left-room', roomId, rooms[roomId])
    socket.emit('user-left-room', roomId, rooms[roomId])

    //Leave room
    socket.leave(roomId)
  })

  socket.on('join-room', (roomId, userId) => {
    //Join new room
    socket.join(roomId)

    //If room is newly created or empty, add first peer
    if (typeof rooms[roomId] == 'undefined') {
      rooms[roomId] = [userId]
    } else {
      //If room is already populated with a peer(s), append new peer to room
      //Prevent user being added to same room twice
      if (!rooms[roomId].includes(userId, 0)) {
        let updateRoomPeers
        updateRoomPeers = rooms[roomId].concat(userId)
        rooms[roomId] = updateRoomPeers
      }
    }

    //Broadcast to anyone that may have this room favourited that a user has joined and update room size
    socket.broadcast.emit('user-joined-room', roomId, rooms[roomId])
    socket.emit('user-joined-room', roomId, rooms[roomId])

    //Need to send a direct message to the client of peers list, emit does not seem to work
    socket.emit('client-connected', userId, rooms[roomId])

    //Broadcast to other users in room, that a new user has connected
    socket.to(roomId).broadcast.emit('user-connected', userId, rooms[roomId])

    socket.on('disconnect', () => {
      //On disconnect remove peer from list of connected peers
      let updateRoomPeers
      updateRoomPeers = rooms[roomId]
      updateRoomPeers = updateRoomPeers.filter((item) => item !== userId)
      rooms[roomId] = updateRoomPeers

      //Send updated peers list minus disconnected user
      socket.to(roomId).broadcast.emit('user-disconnected', userId, rooms[roomId])
    })
  })

  socket.on('request-peers', (roomId, callback) => {
    callback(rooms[roomId])
  })

  //Check friends status on load, all active clients status are tracked in client object
  socket.on('check-status', (user, callback) => {
    if (typeof clients[user] !== 'undefined') callback(clients[user].status)
  })

  socket.on('update-this-room', (roomId) => {
    socket.emit('update-room', roomId)
    socket.broadcast.emit('update-room', roomId)
  })

  //Listen for users watching streams and broadcast to their friends
  socket.on('now-watching', (user, game, callback) => {
    if (typeof clients[user] != 'undefined') {
      clients[user].status = 'Watching ' + game
      socket.broadcast.emit('update-status', user, game)
      socket.emit('update-status', user, game)
      callback()
    }
  })

  socket.on('room-invite', (inviter, invitee, roomId) => {
    if (typeof clients[invitee] !== 'undefined') io.to(clients[invitee].socketId).emit('inc-room-invite', invitee, inviter, roomId)
  })

  //Listening for Users automatically querying room size on load/refresh
  socket.on('room-size-query', (roomId, callback) => {
    if (typeof rooms[roomId] != 'undefined') callback(rooms[roomId])
    else callback(0)
  })

  //Listening for Users automatically querying room size on load/refresh
  socket.on('room-query', (roomId, callback) => {
    if (typeof rooms[roomId] != 'undefined') callback(rooms[roomId])
    else callback(0)
  })

  socket.on('voice-active', (roomId, userId) => {
    socket.to(roomId).broadcast.emit('user-speaking', userId)
  })

  socket.on('voice-inactive', (roomId, userId) => {
    socket.to(roomId).broadcast.emit('user-stopped-speaking', userId)
  })

  socket.on('start-vote', (roomId, userId, stream) => {
    const peers = Object.keys(io.sockets.adapter.rooms[roomId].sockets).length
    io.in(roomId).emit('vote', userId, stream, peers)
  })

  socket.on('vote-actions', (roomId, userId, vote) => {
    io.in(roomId).emit('vote-poll', userId, vote)
  })

  socket.on('finish-vote', (roomId, result) => {
    io.in(roomId).emit('end-vote', result)
  })

  socket.on('change-stream', (roomId, stream) => {
    io.in(roomId).emit('update-stream', stream)
  })

  socket.on('add-friend', (senderId, receiverId) => {
    socket.broadcast.emit('pending-invitation', senderId, receiverId)
  })

  socket.on('friend-event', (type, senderId, receiverId) => {
    if (type === 'accept' && typeof clients[receiverId].socketId != 'undefined') io.to(clients[receiverId].socketId).emit('friend-event', type)

    if (type === 'invite' && typeof clients[receiverId].socketId != 'undefined') io.to(clients[receiverId].socketId).emit('friend-event', type)
  })
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(function (req, res, next) {
  app.locals.io = io
  next()
})

app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.DailyRotateFile({
        format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize(), winston.format.json()),
        name: 'file',
        level: 'info',
        filename: path.join(__dirname, 'logs', '%DATE%__log_file.json'),
        handleExceptions: true,
        json: true,
        maxsize: 5242880, //5MB
        maxFiles: 5,
        timestamp: true,
        meta: true,
        msg: 'HTTP  ',
        expressFormat: true
      })
    ]
  })
)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let client_id = process.env.TWITCH_CLIENT_ID
let client_secret = process.env.TWITCH_CLIENT_SECRET
let twitchUrl = `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`

authTwitch = () => {
  axios
    .post(twitchUrl)
    .then((response) => {
      let access_token = response.data.access_token
      app.locals.client_id = client_id
      app.locals.access_token = access_token
      setTimeout(() => {
        authTwitch()
      }, response.data.expires_in - 100)
    })
    .catch((err) => console.log(err))
}

authTwitch()

//MongoDB Connection
const url = process.env.MONGO_DB_URL

mongoose.connect(url, { useNewUrlParser: true })
console.log(mongoose.connection.readyState)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {})

// const SESSION_SECRET = undefined
const SESSION_SECRET = 'thisissecret'
app.use(
  session({
    secret: SESSION_SECRET,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
)

//Passport
app.use(passport.initialize())
app.use(passport.session())
app.use('/auth', auth)

//Routes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    return res.status(401).json({ status: 'User not Authorize' })
  }
}

app.use('/user', isAuthenticated, user)
app.use('/room', isAuthenticated, room)
app.use('/check-friend-status', isAuthenticated, checkFriendStatus)
app.use('/twitchapi', isAuthenticated, twitchApi)

const whitelist = ['http://localhost:3000', 'http://localhost:8080', 'https://alamo-d19124355.herokuapp.com/']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions))

// Serve any static files
app.use(express.static(path.join(__dirname, 'client/build')))
// Handle React routing, return all requests to React app
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = { app: app, server: server }
