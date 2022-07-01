const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const People = require('../models/people');

router.get('/people/:sender_id', async (req, res) => {
  try {
    const people = await People.find({
      id: { $ne: req.params.sender_id },
    });
    res.json(people);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/people/person', async (req, res) => {
  try {
    const people = await People.find({ email: req.body.email });
    res.json(people);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/people/person/:email/:password', async (req, res) => {
  try {
    const people = await People.find({
      email: req.params.email,
      password: req.params.password,
    });
    res.json(people);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/people/update_status/:target_id', async (req, res) => {
  try {
    await People.findOneAndUpdate({ id: req.params.target_id }, req.body);
    res.status(201).json({});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/people/personbyid/:target_id', async (req, res) => {
  try {
    const person = await People.find({ id: req.params.target_id });
    res.status(201).json(person);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/people/:sender_id/:letters', async (req, res) => {
  try {
    const people = await People.find({
      $and: [
        {
          $or: [
            { first_name: { $regex: '^' + req.params.letters, $options: 'i' } },
            { last_name: { $regex: '^' + req.params.letters, $options: 'i' } },
            { full_name: { $regex: '^' + req.params.letters, $options: 'i' } },
          ],
        },
        { id: { $ne: req.params.sender_id } },
      ],
    });
    if (people == null) {
      return res.status(404).json({ message: 'Cannot find people' });
    }
    res.status(201).send(people);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/people', async (req, res) => {
  const person = new People({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    full_name: `${req.body.first_name} ${req.body.last_name}`,
    id: req.body.id,
  });
  try {
    const newPerson = await person.save();
    res.status(201).json(newPerson);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/chat/:receiver_id/:sender_id', async (req, res) => {
  try {
    const chat = await Chat.find({
      $and: [
        {
          $or: [
            { receiver_id: req.params.receiver_id },
            { receiver_id: req.params.sender_id },
          ],
        },
        {
          $or: [
            { sender_id: req.params.receiver_id },
            { sender_id: req.params.sender_id },
          ],
        },
      ],
    }).sort({ date: -1 });
    if (chat == null) {
      return res.status(404).json({ message: 'Cannot find chat' });
    }
    res.status(201).send(chat);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.patch(
  '/chat/msg/remove/:receiver_id/:sender_id/:target_id',
  async (req, res) => {
    try {
      await Chat.findOneAndUpdate({ id: req.params.target_id }, req.body);
      await Chat.find({
        'replyTo.id': req.params.target_id,
      }).updateMany({ 'replyTo.chatData': '', 'replyTo.isRemoved': true });
      const chat = await Chat.find({
        $and: [
          {
            $or: [
              { receiver_id: req.params.receiver_id },
              { receiver_id: req.params.sender_id },
            ],
          },
          {
            $or: [
              { sender_id: req.params.receiver_id },
              { sender_id: req.params.sender_id },
            ],
          },
        ],
      }).sort({ date: -1 });
      res.status(201).json(chat);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);
router.patch(
  `/notifications/:receiver_id/:sender_id/:operation`,
  async (req, res) => {
    try {
      let person = await People.find({ id: req.params.receiver_id });
      if (req.params.operation === 'update') {
        if (
          person[0].notifications &&
          Object.keys(person[0].notifications).length > 0 &&
          Object.keys(person[0].notifications).find(
            (e) => e === req.params.sender_id
          )
        ) {
          person[0].notifications[
            Object.keys(person[0].notifications).find(
              (e) => e === req.params.sender_id
            )
          ].number += 1;
          person[0].notifications[
            Object.keys(person[0].notifications).find(
              (e) => e === req.params.sender_id
            )
          ].date = Date.now();
        } else {
          person[0].notifications = {
            ...person[0].notifications,
            [req.params.sender_id]: { number: 1, date: Date.now() },
          };
        }
      } else if (req.params.operation === 'onSeen') {
        if (
          person[0].notifications &&
          Object.keys(person[0].notifications).length > 0 &&
          Object.keys(person[0].notifications).find(
            (e) => e === req.params.sender_id
          )
        ) {
          const updatedNotifications = {};
          Object.keys(person[0].notifications).forEach((key) => {
            if (
              !Object.keys(person[0].notifications).find(
                (e) => e === req.params.sender_id
              )
            ) {
              updatedNotifications[id] =
                person[0].notifications[req.params.sender_id];
            }
          });
          person[0].notifications = updatedNotifications;
        }
      }
      await People.findOneAndUpdate(
        { id: req.params.receiver_id },
        { ...person[0] }
      );
      res.status(201).json();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(`/chat`, async (req, res) => {
  const chat = new Chat({
    chatData: req.body.chatData,
    sender_id: req.body.sender_id,
    receiver_id: req.body.receiver_id,
    id: req.body.id,
    replyTo: req.body.replyTo,
  });
  try {
    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
