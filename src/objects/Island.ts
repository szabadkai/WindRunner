import Phaser from 'phaser';

export class Island extends Phaser.GameObjects.Container {
  public id: string;
  public islandName: string;
  public radius: number = 40;

  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string) {
    super(scene, x, y);
    this.id = id;
    this.islandName = name;

    // Draw Island Visual
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawIsland();

    // Draw Label
    this.label = scene.add.text(0, -50, name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add(this.label);

    scene.add.existing(this);
  }

  private drawIsland() {
    this.graphics.clear();
    
    // Sand / Beach
    this.graphics.fillStyle(0xeebb88);
    this.graphics.fillCircle(0, 0, this.radius);
    
    // Vegetation / Center
    this.graphics.fillStyle(0x44aa44);
    this.graphics.fillCircle(0, 0, this.radius * 0.7);

    // Dock visual (simple rect)
    this.graphics.fillStyle(0x8b4513);
    this.graphics.fillRect(-10, this.radius - 5, 20, 15);
  }

  // Check if a point (boat) is within docking range
  isWithinRange(x: number, y: number, range: number): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    return dist <= (this.radius + range);
  }
}
