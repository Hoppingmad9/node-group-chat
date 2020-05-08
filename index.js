const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const dbName = './data.json';
const db = require(dbName);

var play_deck = '';
var max_players = 8;
var current_players;

app.get('/', function(req, res) {
  res.render('index.ejs');
});

app.get('/dealer23101996', function(req, res) {
  res.render('dealer.ejs');
});

function newGame() {
  fs.copyFile('./default_data.json', dbName, function copyErr(err) {
    if (err) return console.log(err);
    io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + 'Game Ready!');
  });

  play_deck = newDeck();
  //console.log(play_deck);
  current_players = 0;
}

io.sockets.on('connection', function(socket) {
  socket.on('username', function(username) {
    socket.username = username;
    console.log('id' + socket.id);
    if (!(username == 'Dealer')) {
      let player_type_message = '';
      if (current_players < max_players) {
        let playerNumberText = 'player' + current_players;
        db.players[playerNumberText].id = socket.id;
        writeToDB();
        current_players++;
        player_type_message = 'as player ' + current_players;
      } else {
        player_type_message = 'as a spectator ';
      }
      io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat ' + player_type_message + '</i>');
      console.log(socket.username + ' joined')
    }
  });

  socket.on('disconnect', function(username) {
    if (!(socket.username === 'Dealer')) {
      io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat</i>');
    }
  })

  socket.on('chat_message', function(message) {
    io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
  });

  socket.on('new_game', function() {
    newGame();
  })

  socket.on('deal_cards', function() {

    for (let i = 0; i < current_players; i++) {
      let playerNum = 'player' + i;
      db.players[playerNum].card0 = getCard();
      db.players[playerNum].card1 = getCard();
    }
    /*
    db.players.player0.card1 = getCard();
    db.players.player0.card2 = getCard();
    db.players.player1.card1 = getCard();
    db.players.player1.card2 = getCard();
    db.players.player2.card1 = getCard();
    db.players.player2.card2 = getCard();
    db.players.player3.card1 = getCard();
    db.players.player3.card2 = getCard();
    db.players.player4.card1 = getCard();
    db.players.player4.card2 = getCard();
    db.players.player5.card1 = getCard();
    db.players.player5.card2 = getCard();
    db.players.player6.card1 = getCard();
    db.players.player6.card2 = getCard();
    db.players.player7.card1 = getCard();
    db.players.player7.card2 = getCard();
    */
    writeToDB();

    //console.log(io.sockets);
    for (let i = 0; i < current_players; i++) {
      let playerNumberText = 'player' + i;
      let socketId = db.players[playerNumberText].id;
      io.to(socketId).emit('hey', 'I just met you');
    }

  });

});

function writeToDB() {
  fs.writeFile(dbName,JSON.stringify(db, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
    //console.log(JSON.stringify(db));
    console.log('writing to ' + dbName)
    //console.log(play_deck);
    io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + 'Cards Dealt!');
  });
}

function getCard() {
  return deck.pop();
}

const server = http.listen(8080, function() {
  console.log('listening on *:8080');
});

const deck = ['A Spades','2 Spades','3 Spades','4 Spades','5 Spades','6 Spades','7 Spades','8 Spades','9 Spades','10 Spades','J Spades','Q Spades','K Spades','A Diamonds','2 Diamonds','3 Diamonds','4 Diamonds','5 Diamonds','6 Diamonds','7 Diamonds','8 Diamonds','9 Diamonds','10 Diamonds','J Diamonds','Q Diamonds','K Diamonds','A Hearts','2 Hearts','3 Hearts','4 Hearts','5 Hearts','6 Hearts','7 Hearts','8 Hearts','9 Hearts','10 Hearts','J Hearts','Q Hearts','K Hearts','A Clubs','2 Clubs','3 Clubs','4 Clubs','5 Clubs','6 Clubs','7 Clubs','8 Clubs','9 Clubs','10 Clubs','J Clubs','Q Clubs','K Clubs',];

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function newDeck() {
  let new_deck = deck;
  return shuffle(new_deck);
}
