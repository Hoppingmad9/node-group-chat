const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const dbName = './data.json';
resetDB();
const db = require(dbName);

var play_deck = '';
var max_players = 8;
var current_players;
var hands;
var dealer;
var small_blind;
var big_blind;
var active_player;
var pot;
var active_game = false;

app.get('/', function(req, res) {
  res.render('index.ejs');
});

app.get('/dealer23101996', function(req, res) {
  res.render('dealer.ejs');
});

function startGame() {
  active_game = true;
  newHand();
}

function newHand() {
  hands++;
  dealCards();
  pot = 0;

  let player;

  dealer = 'player' + (hands+0)%current_players;
  player = db.players[dealer].name
  io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + player + ' is the dealer.');

  small_blind = 'player' + (hands+1)%current_players;
  player = db.players[small_blind].name
  io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + player + ' is the small blind.');

  big_blind = 'player' + (hands+2)%current_players;
  player = db.players[big_blind].name
  io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + player + ' is the big blind.');

  active_player = 'player' + (hands+3)%current_players;
  player = db.players[active_player].name
  io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: it\'s '+ player + '\'s turn.');

  updateActivePlayer();
}

function resetDB() {
  fs.copyFile('./default_data.json', dbName, function copyErr(err) {
    if (err) return console.log(err);
    io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + 'Game Ready!');
  });
}

function newGame() {
  active_game = false;
  resetDB();
  play_deck = newDeck();
  //console.log(play_deck);
  current_players = 0;
  hands = 0;
}

io.sockets.on('connection', function(socket) {
  socket.on('username', function(username) {
    socket.username = username;
    console.log('id ' + socket.id);
    if (!(username == 'Dealer')) {
      let player_type_message = '';
      if (current_players < max_players && !active_game) {
        let playerNumberText = 'player' + current_players;
        db.players[playerNumberText].id = socket.id;
        db.players[playerNumberText].chips = 10000;
        db.players[playerNumberText].name = username;
        writeToDB();
        updateChips(socket.id, 10000);
        current_players++;
        player_type_message = 'as player ' + current_players;
      } else {
        player_type_message = 'as a spectator ';
      }
      updateActivePlayer();
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

  socket.on('start_game', function() {
    startGame();
  })

  socket.on('new_hand', function() {
    newHand();
  })

});

function updateChips(id, chips) {
  io.to(id).emit('chips', chips);
}

function updateActivePlayer() {
  if (active_player) {
    io.emit('active_player', db.players[active_player].name);
    io.to(db.players[active_player].id).emit('active_player', 'YOU!');
  }
}

function writeToDB() {
  fs.writeFile(dbName,JSON.stringify(db, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
    //console.log(JSON.stringify(db));
    console.log('writing to ' + dbName)
    //console.log(play_deck);
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


function dealCards() {

  for (let i = 0; i < current_players; i++) {
    let playerNum = 'player' + i;
    db.players[playerNum].card0 = getCard();
    db.players[playerNum].card1 = getCard();
  }
  writeToDB();

  //console.log(io.sockets);
  for (let i = 0; i < current_players; i++) {
    let playerNumberText = 'player' + i;
    let socketId = db.players[playerNumberText].id;
    let cards = [db.players[playerNumberText].card0, db.players[playerNumberText].card1];
    io.to(socketId).emit('cards', cards);
  }


  io.emit('chat_message', '<strong>' + 'Dealer' + '</strong>: ' + 'Cards Dealt!');

}
