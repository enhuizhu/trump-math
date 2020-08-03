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
  // @ViewChild("canvas", {read: ElementRef}) canvas: ElementRef;
  public gamepads = {};
  public message = '';
  public position = '';
  public gameSize = {width: 1600, height: 800};
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

  public speed = 1;
  public img: any;
  public app: any;

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

  loadAssets() {
    this.app.loader
      .add('/assets/trump.json')
      .add('/assets/explotion.json')
      .load(() => {
        const sheet = this.app.loader.resources['/assets/trump.json'];
        this.setSheet(sheet);
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
        this.addRandomNumbers();

        this.animatedTrump = new PIXI.AnimatedSprite(this.sheetMap.standFront);
        this.animatedTrump.animationSpeed = 0.167;
        this.animatedTrump.anchor.set(0.5);
        this.animatedTrump.scale.set(0.5, 0.5);

        this.app.stage.addChild(this.animatedTrump);
      });    
  }

  addRandomNumbers() {
     const distance = Math.round(this.gameSize.width / 5);
     this.textArray = [1, 2, 3, 4].map(v => {
       const text = new PIXI.Text(Math.round(Math.random() *100).toString(), {font: '300px Arial', fill: 'red'});
       text.x = distance * v;
       text.y = 50;
       text.anchor.set(0.5);
       text.scale.set(1);
       console.log('text-size', text.width, text.height, text.getBounds());

       this.app.stage.addChild(text);
       return text;
     })
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

      if (this.buttonsMap.increase && this.speed < 10) {
        this.speed += 1;
      }

      if (this.buttonsMap.decrease && this.speed > 0) {
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
        t.visible = false;
        this.animatedBoom.visible = true;
        this.animatedBoom.x = t.x;
        this.animatedBoom.y = t.y;
        this.animatedBoom.play();
      }
    });
  }

  loopGame() {
    if (!_.isEmpty(this.gamepads)) {
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
