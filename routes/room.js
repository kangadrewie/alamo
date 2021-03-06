const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/RoomSchema');
const ObjectId = require('mongoose').Types.ObjectId;

//Get room information
router.get('/', (req, res) => {
    const roomId = req.query.roomId;
    console.log(roomId)
    Room.findOne({roomId: roomId})
    .then(response => {
        res.status(200).json(response)
    })
    .catch(error => console.error(error));
})

//Create new room
router.post('/create-room', (req, res) => {
    const roomId = req.body.roomId
    const userId = req.body.userId
    const roomTitle = req.body.roomTitle
    const streamId = req.body.streamId

    //Store new room in db
    Room.create({roomId: roomId, room_title: roomTitle, stream: streamId})
    .then(response => {
        Room.updateOne({roomId: roomId}, {$push: {admins: userId}}, (err, object) => {
            if (!err)
                res.status(200).json({status: 'room successfully created'})
        })
    })
    .catch(error => console.error(error));
});

//Create new room
router.post('/update', (req, res) => {
    const roomId = req.body.roomId
    const roomTitle = req.body.roomTitle
    const streamId = req.body.streamId

    Room.updateOne({roomId: roomId}, {room_title: roomTitle, stream: streamId}, (err, object) => {
        if (!err)
            res.status(200).json({status: 'New admin added'})
    })
});

router.post('/admin', (req, res) => {
    const roomId = req.body.roomId
    const admin = req.body.adminId
    Room.updateOne({roomId: roomId}, {$push: {admins: admin}}, (err, object) => {
        if (!err)
            res.status(200).json({status: 'New admin added'})
    })

})

router.delete('/admin', (req, res) => {
    const roomId = req.body.roomId
    const admin = req.body.adminId
    console.log(admin, roomId)
    Room.updateOne({roomId: roomId}, {$pull: {admins: admin}})
        .then((response) => res.status(200).json({status: 'Admin removed'}))

})


//Get room information
router.post('/change-stream', (req, res) => {
    const roomId = req.body.roomId;
    const channel = req.body.channel;
    console.log(roomId, channel)
    Room.updateOne({roomId: roomId}, {stream: channel})
    .then(response => {
        res.status(200).json(response)
    })
    .catch(error => console.error(error));
})


module.exports = router;
