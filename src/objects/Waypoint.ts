import Phaser from 'phaser';

export class Waypoint extends Phaser.GameObjects.Container {
  public index: number;
  public radius: number = 50;
  public isCompleted: boolean = false;
  
  private circle: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y);
    this.index = index;

    this.circle = scene.add.graphics();
    this.add(this.circle);

    this.label = scene.add.text(0, 0, `${index + 1}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add(this.label);

    this.setActiveState(false);
    
    scene.add.existing(this);
  }

  setActiveState(isActive: boolean) {
    this.circle.clear();
    if (this.isCompleted) {
        // Green for completed
        this.circle.lineStyle(3, 0x00ff00);
        this.circle.fillStyle(0x00ff00, 0.3);
    } else if (isActive) {
        // Orange for active target
        this.circle.lineStyle(3, 0xffaa00);
        this.circle.fillStyle(0xffaa00, 0.1);
    } else {
        // Gray for pending
        this.circle.lineStyle(2, 0xaaaaaa);
    }
    
    this.circle.strokeCircle(0, 0, this.radius);
    if (this.isCompleted || isActive) {
        this.circle.fillCircle(0, 0, this.radius);
    }
  }

  complete() {
    this.isCompleted = true;
    this.setActiveState(false);
  }

  checkCollision(x: number, y: number): boolean {
    if (this.isCompleted) return false;
    const dist = Phaser.Math.Distance.Between(x, y, this.x, this.y);
    return dist <= this.radius;
  }
}
