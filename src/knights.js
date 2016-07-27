// Modular workaround for browserify from https://www.npmjs.com/package/phaser#browserify--cjs
window.PIXI = require('phaser/build/custom/pixi');
window.p2 = require('phaser/build/custom/p2');
window.Phaser = require('phaser/build/custom/phaser-split');

// Copied from the hellophaser example.
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var CONTROL = {
  deck: [],
  discard: [],
  players: [],
  cardStates: ['Hidden', 'Back', 'Front'],
  activeCard: null,
  deselectActiveCard: function () {
    if (CONTROL.activeCard) {
      CONTROL.activeCard.unglow();
      CONTROL.activeCard = null;
    }
  }
}

function Player() {
  this.cards = {
    hand: [],
    knight: []
  };
  this.hp = 0;
  this.maxHP = 0;

  CONTROL.players.push(this);
}
Player.prototype.Draw = function () {
  this.hand.push(deck.pile.shift());
}
Player.prototype.Discard = function (card) {
  var self = this;
  var elementPos = array.map(function (x) {return x.id; }).indexOf(card.id);
  deck.discard.push(self.cards.hand.splice(elementPos, 1));
}

function Card(id, cardState, x, y) {
  // The id determines what card is shown.
  this.id = id;
  this.power = (this.id % 13) + 1;

  // Card.state is index in CONTROL.cardStates.
  this.state = (cardState) ? cardState : 0;

  if (this.state > 0) {
    x = (x) ? x : 0;
    y = (y) ? y : 0;
    this['show' + CONTROL.cardStates[this.state]](x, y);
  }
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
Card.prototype.showHidden = function (x, y) {
  if (this.sprite) this.sprite.destroy();

  this.sprite = null;
}
Card.prototype.showBack = function (x, y) {
  if (this.sprite) this.sprite.destroy();

  this.sprite = game.add.sprite(x, y, 'cardback');
  this.sprite.anchor.set(0.5, 0.5);
  this.activateDrag();
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

  this.activateDrag();
}
Card.prototype.activateDrag = function () {
  //  Enable input and allow for dragging
  this.sprite.inputEnabled = true;
  this.sprite.input.enableDrag();
  this.sprite.events.onDragStart.add(this.onDragStart, this);
  // this.sprite.events.onDragStop.add(this.onDragStop, this);
}
Card.prototype.onDragStart = function () {
  if (CONTROL.activeCard) {
    CONTROL.activeCard.unglow();
  }

  game.world.bringToTop(this.sprite);
  this.glow();

  CONTROL.activeCard = this;
}
Card.prototype.glow = function () {
  // Add a glow sprite in the sprite's first children index
  if (this.sprite) {
    var glow = game.add.sprite(0, 0, 'cardGlow');
    glow.anchor.set(0.5, 0.5);
    glow.scale.setTo(0.5, 0.5);
    this.sprite.addChildAt(glow, 0);
  }
}
Card.prototype.unglow = function () {
  if (this.sprite) {
    if (this.sprite.children[0].key === 'cardGlow') {
      var glow = this.sprite.removeChildAt(0);
      glow.destroy();
    }
  }
}

function preload() {
  // FIXME: add card front and back images
  game.load.image('card', 'images/draw-disabled.png');
  game.load.image('cardback', 'images/phaser.png');
  game.load.image('cardGlow', 'images/phaser.png');

  game.load.image('draw', 'images/draw.png');
  game.load.image('draw-disabled', 'images/draw-disabled.png');

  game.load.image('strength', 'images/strength.png');
  game.load.image('knowledge', 'images/knowledge.png');
  game.load.image('belief', 'images/belief.png');
  game.load.image('magic', 'images/magic.png');

  game.load.image('deflect', 'images/deflect.png');
  game.load.image('swap', 'images/swap.png');
}

function create() {
  createBackgroundImage();

  var card = new Card(1, 2, game.world.centerX - 100, game.world.centerY);
  var card2 = new Card(40, 0, game.world.centerX, game.world.centerY);
  var card3 = new Card(19, 1, game.world.centerX + 100, game.world.centerY);
}

function update() {

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
