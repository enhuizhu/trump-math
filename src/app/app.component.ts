import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { GameButton } from './interfaces/gamebutton.interface';
import _ from 'lodash';
import * as PIXI from 'pixi.js';

declare var navigator: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  public gamepads = {};
  public message = '';
  public position = '';
  public gameSize = {width: window.innerWidth, height: window.innerHeight};
  
  public directionMap = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  
  public buttonsMap = {
    increase: false,
    decrease: false,
  }

  public minSpeed = 2;
  public maxSpeed = 5;
  public speed = 2;
  public img: any;
  public app: any;

  public gameStopped = false;

  public sheetMap = {
    'standFront': [],
    'standBack': [],
    'runRight': [],
    'runLeft': [],
    'runUp': [],
    'runDown': [],
  };

  public textArray = [];

  public animatedTrump;
  public animatedBoom;
  public explosionTextures;
  public question;

  public operators = ['+', '-', '*'];

  constructor() {
    this.initListeners();
    
    this.app = new PIXI.Application({
      ...this.gameSize,
      transparent: true,
    });
  }

  ngAfterViewInit() {
    this.initGame();
  }

  initGame() {
    document.getElementById('game-container').appendChild(this.app.view);
    this.loadAssets();
  }

  setSheet(sheet) {
    const fn = (v) => sheet.textures[`trump_run-${v}.png`];
    this.sheetMap.standFront = [sheet.textures['trump_run-0.png']];
    this.sheetMap.standBack = [sheet.textures['trump_run-12.png']];
    this.sheetMap.runRight = [6, 7, 8, 9, 10, 11].map(fn);
    this.sheetMap.runLeft = [18, 19, 20, 21, 22, 23].map(fn);
    this.sheetMap.runUp = [12, 13, 14, 15, 16, 17].map(fn);
    this.sheetMap.runDown = [0, 1, 2, 3, 4, 5].map(fn);
  }

  touchEach(obj1, obj2) {
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();

    const obj1RightBorderPos = bounds1.x + bounds1.width / 2;
    const obj1LeftBorderPos = bounds1.x - bounds1.width / 2;
    const obj2LeftBorderPos = bounds2.x - bounds2.width / 2;
    const obj2RightBorderPos = bounds2.x + bounds2.width / 2;
    const obj1BottomBorderPos = bounds1.y + bounds1.height / 2;
    const obj1TopBorderPos = bounds1.y - bounds1.height / 2;
    const obj2TopBorderPos = bounds2.y  - bounds2.height / 2;
    const obj2BottomBorderPos = bounds2.y + bounds2.height / 2;

    const condition1 = obj1RightBorderPos > obj2LeftBorderPos && obj1RightBorderPos < obj2RightBorderPos;
    const condition2 = obj1LeftBorderPos < obj2RightBorderPos && obj1LeftBorderPos > obj2LeftBorderPos;
    const condition3 = obj1BottomBorderPos > obj2TopBorderPos && obj2BottomBorderPos < obj2BottomBorderPos;
    const condition4 = obj1TopBorderPos < obj2BottomBorderPos && obj1TopBorderPos > obj2TopBorderPos;
    const condition5 = obj2TopBorderPos < obj1BottomBorderPos && obj2TopBorderPos > obj1TopBorderPos;
    const condition6 = obj2BottomBorderPos < obj1BottomBorderPos && obj2BottomBorderPos > obj1TopBorderPos;
    
    return (condition1 && (condition3 || condition4))
      || (condition2 && (condition3 || condition4))
      || (condition1 && (condition5 || condition6))
      || (condition2 && (condition5 || condition6))
  }


  initBoom() {
    const explotionSheet = this.app.loader.resources['/assets/explotion.json'];
    this.explosionTextures = _.map(explotionSheet.textures, (v, k) => v);
    this.animatedBoom = new PIXI.AnimatedSprite(this.explosionTextures);
    this.animatedBoom.anchor.set(0.5);
    this.animatedBoom.loop = false;
    this.animatedBoom.visible = false;
    
    this.animatedBoom.onComplete = () => {
      console.log('animation complete event');
      this.animatedBoom.visible = false;
      this.animatedBoom.textures = this.explosionTextures;
      this.animatedBoom.visible = false;
    }

    this.app.stage.addChild(this.animatedBoom);
  }

  initTrump() {
    const sheet = this.app.loader.resources['/assets/trump.json'];
    this.setSheet(sheet);

    this.animatedTrump = new PIXI.AnimatedSprite(this.sheetMap.standFront);
    this.animatedTrump.animationSpeed = 0.167;
    this.animatedTrump.anchor.set(0.5);
    this.animatedTrump.scale.set(0.4, 0.4);
    this.resetTrump();

    this.app.stage.addChild(this.animatedTrump);
  }

  initQuestion() {
    this.question = new PIXI.Text('', {fontFamily: 'Arial', fontSize: '57px', fill: 'green'});
    this.question.anchor.set(0.5);
    this.question.x = this.gameSize.width / 2;
    this.question.y = this.gameSize.height / 2;
    this.setQuestion();
    this.app.stage.addChild(this.question);
  }

  generateMathQuestion() {
    const numbers = [1, 2, 3].map(() => {
      return Math.round(Math.random() * 20);
    });

    const randomOperators = [1, 2].map(() => {
      const index = Math.round(Math.random() * 2);
      return this.operators[index];
    });

    return numbers.reduce((a, c, index) => {
      return `${a}${c}${randomOperators[index] || ''}`;
    }, '');
  }

  loadAssets() {
    this.app.loader
      .add('/assets/trump.json')
      .add('/assets/explotion.json')
      .load(() => {
        this.initQuestion();
        this.addRandomNumbers();
        this.initBoom();
        this.initTrump();
      });    
  }

  addRandomNumbers() {
     const distance = Math.round(this.gameSize.width / 5);
     this.textArray = [1, 2, 3, 4].map(v => {
       const text = new PIXI.Text(this.getRandomNumber(), {
         fontFamily: 'Arial', 
         fontSize: '60px', 
         fill: 'red',
         stroke: 'gray',
         dropShadow: true,
       });
       text.x = distance * v;
       text.y = 50;
       text.anchor.set(0.5);
       text.scale.set(1);

       this.app.stage.addChild(text);
       return text;
     });

     this.textArray[Math.round(Math.random() * (this.textArray.length - 1))].text = eval(this.question.q);
  }

  getRandomNumber() {
    return Math.round(Math.random() *100).toString();
  }

  initListeners() {
    window.addEventListener('gamepadconnected', this.gamepadConnectHandler(true));
    window.addEventListener('gamepaddisconnected', this.gamepadConnectHandler(false))
  }

  gamepadConnectHandler(connected: boolean) {
    return (e) => {
      const gamePad = e.gamepad;

      if (connected) {
        this.gamepads[gamePad.index] = gamePad;
      } else {
        delete this.gamepads[gamePad.index];
      }
    }
  }

  checkButtonPress(buttonList: any[]) {
    const pressedIndexArr = [];
    
    buttonList && buttonList.forEach((button: GameButton, index) => {
      if (button.pressed) {
        pressedIndexArr.push(index);
      }

      this.buttonsMap.increase = button.pressed && index == 0;
      this.buttonsMap.decrease = button.pressed && index == 3;

      if (this.buttonsMap.increase && this.speed < this.maxSpeed) {
        this.speed += 1;
      }

      if (this.buttonsMap.decrease && this.speed > this.minSpeed) {
        this.speed -= 1;
      }
    });

    this.message = `${pressedIndexArr.join(', ')} pressed!`;
  }

  checkPosition(axes) {
    this.position = `${axes.join(', ')}`;
    const [x, y] = axes;
    
    this.directionMap.left = x === -1;
    this.directionMap.right = x === 1;
    this.directionMap.up = y === -1;
    this.directionMap.down = y === 1;
  }

  move() {
    if (this.directionMap.left && this.animatedTrump.x > 0) {
      this.animatedTrump.x -= this.speed;
      
      if (this.animatedTrump.textures != this.sheetMap.runLeft) {
        this.animatedTrump.textures = this.sheetMap.runLeft;
      }
    } else if (this.directionMap.right && this.animatedTrump.x < this.gameSize.width - this.animatedTrump.width) {
      this.animatedTrump.x += this.speed;
      
      if (this.animatedTrump.textures != this.sheetMap.runRight) {
        this.animatedTrump.textures = this.sheetMap.runRight;
      }
    } else if (this.directionMap.up && this.animatedTrump.y > 0) {
      this.animatedTrump.y -= this.speed;
      
      if (this.animatedTrump.textures != this.sheetMap.runUp) {
        this.animatedTrump.textures = this.sheetMap.runUp;
      }
    } else if (this.directionMap.down && this.animatedTrump.y < this.gameSize.height - this.animatedTrump.height) {
      this.animatedTrump.y += this.speed;
      
      if (this.animatedTrump.textures != this.sheetMap.runDown) {
        this.animatedTrump.textures = this.sheetMap.runDown;
      }
    } else {
      this.animatedTrump.textures = this.sheetMap.standFront;
    }

    if (!this.animatedTrump.playing) {
      this.animatedTrump.play();
    }
  }

  checkCollision() {
    this.textArray.forEach(t => {
      if (this.touchEach(this.animatedTrump, t) && t.visible) {
        const explotionObj = t.text == eval(this.question.q) ? t : this.animatedTrump;
        explotionObj.visible = false;
        this.animatedBoom.visible = true;
        this.animatedBoom.x = explotionObj.x;
        this.animatedBoom.y = explotionObj.y;
        this.animatedBoom.play();
        this.gameStopped = true;
        this.gameStopped = true;
        
        setTimeout(() => {
          if (confirm(explotionObj === this.animatedTrump ? 'you lose the game.' : 'well done!')) {
            this.resetGame();
          }
        }, 500);
      }
    });
  }

  resetGame() {
    this.gameStopped = false;
    
    this.setQuestion();
    this.setRandomAnswers();

    this.animatedTrump.visible = true;
    this.animatedTrump.x = this.animatedTrump.width;
    this.animatedTrump.y = this.animatedTrump.height;

    this.animatedBoom.visible = false;
  }

  resetTrump() {
    this.animatedTrump.visible = true;
    this.animatedTrump.x = this.animatedTrump.width;
    this.animatedTrump.y = this.animatedTrump.height;
  }

  setQuestion() {
    this.question.q = this.generateMathQuestion();
    this.question.text = `${this.question.q} = ?`;
  }

  setRandomAnswers() {
    const randomIndex = Math.round(Math.random() * 3);
    
    this.textArray.forEach((t, index) => {
      t.visible = true;

      if (randomIndex === index) {
        t.text = eval(this.question.q);
      } else {
        t.text = this.getRandomNumber();
      }
    });
  };

  loopGame() {
    if (!_.isEmpty(this.gamepads) && !this.gameStopped) {
      this.checkButtonPress(navigator.getGamepads()[0].buttons);
      this.checkPosition(navigator.getGamepads()[0].axes);
      this.checkCollision();
      this.move();
    }

    window.requestAnimationFrame(this.loopGame.bind(this));
  }

  ngOnInit() {
    this.loopGame();
  }
}
