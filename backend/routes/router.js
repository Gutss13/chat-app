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

router.patch('/people/:target_id/:sender_id/:letters', async (req, res) => {
  try {
    await People.findOneAndUpdate({ id: req.params.target_id }, req.body);
    const people = { allPeople: [], foundPeople: [] };
    people.foundPeople = await People.find({
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
    people.allPeople = await People.find({ id: { $ne: req.params.sender_id } });
    res.status(201).json(people);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/people/personbyid/:target_id', async (req, res) => {
  try {
    const person = await People.find({ id: req.params.target_id });
    res.json(person);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/people/:sender_id/:letters', async (req, res) => {
  let people;
  try {
    people = await People.find({
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
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.send(people);
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
  let chat;
  try {
    chat = await Chat.find({
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
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.send(chat);
});

router.post('/chat', async (req, res) => {
  const chat = new Chat({
    chatData: req.body.chatData,
    sender_id: req.body.sender_id,
    receiver_id: req.body.receiver_id,
  });
  try {
    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
