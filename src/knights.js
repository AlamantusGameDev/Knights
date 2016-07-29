// Modular workaround for browserify from https://www.npmjs.com/package/phaser#browserify--cjs
window.PIXI = require('phaser/build/custom/pixi');
window.p2 = require('phaser/build/custom/p2');
window.Phaser = require('phaser/build/custom/phaser-split');

var shuffle = require('knuth-shuffle').knuthShuffle;

// Copied from the hellophaser example.
var game = new Phaser.Game(800, 600, Phaser.AUTO, '');

var CONTROL = {
  // An array of the cards in the deck.
  deck: [],

  // The number of cards in the deck.
  // If this changes, the way cards are id'd will need to change too.
  DECKSIZE: 54,

  deckX: 100,
  deckY: 300,

  // An array of the discarded cards.
  discard: [],

  // An array of the current players (should only have 2).
  players: [],

  // The index of the current player whose turn it is.
  playerTurn: 0,

  // Reference for card states.
  cardStates: ['Hidden', 'Back', 'Front'],

  // The actively selected card. Null if no card selected.
  activeCard: null,

  // Reference for game phases.
  gamePhases: ['shuffle', 'build', 'play', 'end'],

  // The index of the current game phase.
  phase: 0,

  cardAnimationQueue: [],

  getCardSize: function () {
    // Create a card offscreen to measure.
    var card = new Card(0, null, 1, -100, -100);
    var data = {
      height: card.height,
      width: card.width,
      offsetX: card.offsetX,
      offsetY: card.offsetY
    };
    card.sprite.destroy();
    card = undefined;
    return data;
  },

  deselectActiveCard: function () {
    if (CONTROL.activeCard) {
      CONTROL.activeCard.unglow();
      CONTROL.activeCard = null;
    }
    if (CONTROL.cardAnimationQueue.length) {
      var cardToAnimate = CONTROL.cardAnimationQueue.shift();
      cardToAnimate.tween.start();
    }
  },
  prepareDeck: function (clearAll) {
    if (clearAll) {
      CONTROL.deck = [];
      CONTROL.discard = [];
      CONTROL.players.forEach(function (player) {
        player.cards.hand = [];
        player.cards.knight = [];
      });
    }

    for (var i = 0; i < CONTROL.DECKSIZE; i++) {
      CONTROL.deck.push(new Card(i));
    }
    shuffle(CONTROL.deck);
  },

  // Hand out cards to the players and let them build.
  startGame: function () {
    if (CONTROL.players.length < 2) {
      // Clear the players array and create 2 new ones.
      CONTROL.players = [];
      CONTROL.players.push(new Player());
      CONTROL.players.push(new Player());
      CONTROL.players[0].handX = 100;
      CONTROL.players[0].handY = 450;
      CONTROL.players[1].handX = 700;
      CONTROL.players[1].handY = 150;
      console.log(CONTROL.players);
      // player1.knightX = game.world.centerX - (CONTROL.getCardSize().width * 2) - 10;
      // player1.knightY = game.world.centerY + (CONTROL.getCardSize().width * 2) + 10;
      // player2.knightX = game.world.centerX + (CONTROL.getCardSize().width * 2) + 10;
      // player2.knightY = game.world.centerY - (CONTROL.getCardSize().width * 2) - 10;
    }

    for (var i = 0; i < 10; i++) {
      CONTROL.players[0].draw(2);
      CONTROL.players[1].draw(1);
    }
    console.log(CONTROL.cardAnimationQueue);

    // Kick off the animation queue.
    // CONTROL.cardAnimationQueue.shift().tween.start();

    CONTROL.phase++;
  }
}

function Player() {
  this.hand = [];
  this.knight = [];
  this.hp = 0;
  this.maxHP = 0;

  this.handX = 0;
  this.handY = 0;
  this.knightX = 0;
  this.knightY = 0;

  // CONTROL.players.push(this);
}
Player.prototype.draw = function (state) {
  var card = CONTROL.deck.shift();
  card.owner = this;
  card.state = (state) ? state : 0;
  card.displayByState(CONTROL.deckX, CONTROL.deckY);

  // Animate card to hand.
  var handX = this.handX;
  var handXOffset = (75 * this.hand.length);
  if (this === CONTROL.players[1]) {
    handX -= handXOffset;
  } else {
    handX += handXOffset;
  }
  var handY = this.handY;
  card.queueMovementTo(handX, handY);

  this.hand.push(card);
}
Player.prototype.discard = function (card) {
  var elementPos = this.hand.map(function (x) {return x.id; }).indexOf(card.id);
  card = this.hand.splice(elementPos, 1);
  card.owner = null;
  CONTROL.discard.push(card);
}
Player.prototype.calculateHP = function () {
  var result = 0;

  this.knight.forEach(function (card) { result += card.power; });

  return result;
}

function Card(id, owner, cardState, x, y) {
  // The id determines what card is shown.
  this.id = id;
  this.power = (this.id % 13) + 1;

  this.owner = (owner) ? owner : null;

  // Card.state is index in CONTROL.cardStates[].
  this.state = (cardState) ? cardState : 0;

  this.displayByState(x, y);
}
Card.prototype.getType = function () {
  if (this.id < 13) {
    return 'strength';
  } else if (this.id >= 13 && this.id < 27) {
    return 'knowledge';
  } else if (this.id >= 27 && this.id < 40) {
    return 'belief';
  } else if (this.id >= 40 && this.id < 52) {
    return 'magic';
  }

  // if 52 or above, set it to 'joker'
  return 'joker';
}
Card.prototype.getColor = function () {
  switch (this.getType()) {
    case 'strength': {
      return '#db0';
    }
    case 'knowledge': {
      return '#090';
    }
    case 'belief': {
      return '#f00';
    }
    case 'magic': {
      return '#00f';
    }
    case 'joker': {
      return '#a0c';
    }
  }

  return '#000';
}
Card.prototype.displayByState = function (x, y) {
  if (this.state > 0) {
    x = (x) ? x : 0;
    y = (y) ? y : 0;
    this['show' + CONTROL.cardStates[this.state]](x, y);
  }
}
Card.prototype.showHidden = function (x, y) {
  if (this.sprite) this.sprite.destroy();

  this.sprite = null;
}
Card.prototype.showBack = function (x, y) {
  if (this.sprite) this.sprite.destroy();

  this.sprite = game.add.sprite(x, y, 'card-back');
  this.sprite.anchor.set(0.5, 0.5);

  var cardImage = game.add.sprite(0, -8, 'logo');
  cardImage.scale.setTo(0.17, 0.17);
  cardImage.anchor.set(0.5, 0.5);

  this.sprite.addChild(cardImage);

  this.activateInteraction();
}
Card.prototype.showFront = function (x, y) {
  if (this.sprite) this.sprite.destroy();

  this.sprite = game.add.sprite(x, y, 'card');
  // this.sprite.scale.setTo(0.25, 0.25);
  this.sprite.anchor.set(0.5, 0.5);

  var cardImage = game.add.sprite(0, -32, this.getType());
  cardImage.scale.setTo(0.125, 0.125);
  cardImage.anchor.set(0.5, 0.5);

  var textStyle = { font: '32px Impact', fill: this.getColor(), align: "center" };
  var cardText = game.add.text(0, 32, this.power.toString(), textStyle);
  cardText.anchor.set(0.5, 0.5);

  this.sprite.addChild(cardImage);
  this.sprite.addChild(cardText);

  this.activateInteraction();
}
Card.prototype.activateInteraction = function () {
  //  Enable input and allow for dragging
  this.sprite.inputEnabled = true;
  this.sprite.input.enableDrag();
  this.sprite.events.onDragStart.add(this.onDragStart, this);
  // this.sprite.events.onDragStop.add(this.onDragStop, this);
}
Card.prototype.onDragStart = function (sprite, pointer) {
  if (CONTROL.activeCard) {
    CONTROL.activeCard.unglow();
  }

  if (game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
    this.flip();
  }

  game.world.bringToTop(this.sprite);
  this.glow();

  CONTROL.activeCard = this;
}
Card.prototype.flip = function () {
  if (this.state === 1) {
    this.state = 2;
  } else {
    this.state = 1;
  }
  this.displayByState(this.sprite.x, this.sprite.y);
}
Card.prototype.queueMovementTo = function (x, y) {
  if (this.sprite) {
    if (this.tween && this.tween.isRunning) this.tween.stop();
    this.tween = game.add.tween(this.sprite).to({ x: x, y: y }, 500, Phaser.Easing.Linear.None, false);

    this.tween.onComplete.add(function () {
      console.log('completed moving');
      console.log(CONTROL.cardAnimationQueue);
      console.log(CONTROL.cardAnimationQueue.length);
      if (CONTROL.cardAnimationQueue.length > 0) {
        var nextCard = CONTROL.cardAnimationQueue.shift();
        console.log(nextCard);
        nextCard.tween.start();
      }
    });

    CONTROL.cardAnimationQueue.push(this);
  }
}
Card.prototype.moveTo = function (x, y) {
  if (this.sprite) {
    this.sprite.inputEnabled = false;

    if (this.tween && this.tween.isRunning) this.tween.stop();
    this.tween = game.add.tween(this.sprite).to({ x: x, y: y }, 300, Phaser.Easing.Linear.None, true);
  }
}
Card.prototype.glow = function () {
  // Add a glow sprite in the sprite's first children index
  if (this.sprite) {
    var glow = game.add.sprite(0, 0, 'card-glow');
    glow.anchor.set(0.5, 0.5);
    this.sprite.addChildAt(glow, 0);
  }
}
Card.prototype.unglow = function () {
  if (this.sprite) {
    if (this.sprite.children[0].key === 'card-glow') {
      var glow = this.sprite.removeChildAt(0);
      glow.destroy();
    }
  }
}

// A game state.
// var testState = {};
//
// testState.preload = function () {
//   imagePreload();
// }
//
// testState.create = function () {
//   game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
//
//   createBackgroundImage();
//
//   var card = new Card(1, null, 2, game.world.centerX - 100, game.world.centerY);
//   var card2 = new Card(40, null, 0, game.world.centerX, game.world.centerY);
//   var card3 = new Card(19, null, 1, game.world.centerX + 100, game.world.centerY);
// }
//
// testState.update = function () {
//
// }

var playState = {};

playState.preload = function () {
  imagePreload();
}

playState.create = function () {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
 createBackgroundImage();

  CONTROL.prepareDeck(true);
  CONTROL.startGame();
}

playState.render = function () {
  game.debug.text('Click to deal', game.world.centerX, game.world.centerY);
}

function imagePreload() {
  game.load.image('logo', 'images/logo.png');

  game.load.image('card', 'images/card.png');
  game.load.image('card-back', 'images/card-back.png');
  game.load.image('card-glow', 'images/card-glow.png');

  game.load.image('draw', 'images/draw.png');
  game.load.image('draw-disabled', 'images/draw-disabled.png');

  game.load.image('strength', 'images/strength.png');
  game.load.image('knowledge', 'images/knowledge.png');
  game.load.image('belief', 'images/belief.png');
  game.load.image('magic', 'images/magic.png');

  game.load.image('deflect', 'images/deflect.png');
  game.load.image('swap', 'images/swap.png');
}

function createBackgroundImage() {
  // create a new bitmap data object
  var bmd = game.add.bitmapData(game.world.width, game.world.height);

  // draw to the canvas context like normal
  bmd.ctx.beginPath();
  bmd.ctx.rect(0, 0, game.world.width, game.world.height);
  bmd.ctx.fillStyle = '#fff';
  bmd.ctx.fill();

  // use the bitmap data as the texture for the sprite
  var background = game.add.sprite(0, 0, bmd);

  // Deselect active card if background is clicked.
  background.inputEnabled = true;
  background.events.onInputDown.add(CONTROL.deselectActiveCard, this);
}

// Add the testState state to the game and start it.
// game.state.add('test', testState);
// game.state.start('test');
game.state.add('test', playState);
game.state.start('test');
