import Phaser from 'phaser';

export class GhostBoat extends Phaser.GameObjects.Container {
  private hullGraphics: Phaser.GameObjects.Graphics;
  private sailGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.hullGraphics = scene.add.graphics();
    this.add(this.hullGraphics);
    
    this.sailGraphics = scene.add.graphics();
    this.add(this.sailGraphics);

    this.drawHull();
    this.drawSail(); // Initial visuals

    // Ghost Effect: Transparency & Tint
    this.setAlpha(0.5);
    
    scene.add.existing(this);
  }

  updateState(x: number, y: number, heading: number, _sailTrim: number) {
      this.setPosition(x, y);
      this.setRotation(Phaser.Math.DegToRad(heading)); // Adjust for graphic orientation if needed
      this.hullGraphics.rotation = 0; // The container rotates
      
      // Update visual if needed (sail trim?)
      // For MVP ghost, just position/rotation is enough context.
  }

  private drawHull() {
    this.hullGraphics.clear();
    this.hullGraphics.lineStyle(2, 0x00ffff, 0.5); // Cyan Ghost
    // Simple hull shape
    const path = new Phaser.Curves.Path(0, -30);
    path.quadraticBezierTo(-10, 30, -15, 0);
    path.lineTo(10, 30);
    path.quadraticBezierTo(0, -30, 15, 0);
    path.closePath();
    path.draw(this.hullGraphics);
  }

  private drawSail() {
      // Simplified sail for ghost
      this.sailGraphics.clear();
      this.sailGraphics.lineStyle(2, 0x00ffff, 0.3);
      this.sailGraphics.beginPath();
      this.sailGraphics.moveTo(0, -15);
      this.sailGraphics.lineTo(0, 25);
      this.sailGraphics.strokePath();
  }
}
