import Phaser from 'phaser';

export class Minimap extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private boatMarker: Phaser.GameObjects.Graphics;
  private obstaclesLayer: Phaser.GameObjects.Graphics;
  private waypointsLayer: Phaser.GameObjects.Graphics;
  
  private mapWidth: number = 200;
  private mapHeight: number = 200;
  private mapScaleX: number = 1;
  private mapScaleY: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Add cleanup for text objects if we re-render or destroy
  // But setupIslands clears graphics, text needs manual cleanup if re-run.
  // For now assuming run once.

  constructor(scene: Phaser.Scene, x: number, y: number, courseWaypoints: { x: number, y: number }[] = [], courseObstacles: { x: number, y: number, radius: number }[] = []) {
    super(scene, x, y);

    // Background
    this.background = scene.add.rectangle(0, 0, this.mapWidth, this.mapHeight, 0x000000, 0.5).setOrigin(0.5);
    this.add(this.background);

    // Border
    const border = scene.add.graphics();
    border.lineStyle(2, 0xffffff, 0.5);
    border.strokeRect(-this.mapWidth/2, -this.mapHeight/2, this.mapWidth, this.mapHeight);
    this.add(border);

    // Graphics Layers
    this.obstaclesLayer = scene.add.graphics();
    this.add(this.obstaclesLayer);

    this.waypointsLayer = scene.add.graphics();
    this.add(this.waypointsLayer);

    this.boatMarker = scene.add.graphics();
    this.add(this.boatMarker);

    scene.add.existing(this);

    if (courseWaypoints.length > 0 || courseObstacles.length > 0) {
        this.setupCourse(courseWaypoints, courseObstacles);
    }
  }

  setupIslands(islands: { x: number, y: number, id: string, islandName: string }[], worldWidth: number, worldHeight: number) {
      // Set fixed world scale
      this.mapScaleX = this.mapWidth / worldWidth;
      this.mapScaleY = this.mapHeight / worldHeight;
      const scale = Math.min(this.mapScaleX, this.mapScaleY);
      this.mapScaleX = scale;
      this.mapScaleY = scale;
      
      this.offsetX = 0; // Starts at 0,0
      this.offsetY = 0;

      this.obstaclesLayer.clear();
      this.waypointsLayer.clear();
      
      // Draw Islands
      this.waypointsLayer.fillStyle(0x00ff00, 1); // Green for islands
      
      islands.forEach(island => {
          const mx = (island.x - this.offsetX) * this.mapScaleX - this.mapWidth/2;
          const my = (island.y - this.offsetY) * this.mapScaleY - this.mapHeight/2;
          
          this.waypointsLayer.fillCircle(mx, my, 4);
          
          // Island Names
          const text = this.scene.add.text(mx, my - 10, island.islandName, { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
          this.add(text); // Add to container
      });
  }

  private setupCourse(waypoints: { x: number, y: number }[], obstacles: { x: number, y: number, radius: number }[] = []) {
    if (waypoints.length === 0 && obstacles.length === 0) return;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    waypoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    });
    obstacles.forEach(o => {
        minX = Math.min(minX, o.x - o.radius);
        minY = Math.min(minY, o.y - o.radius);
        maxX = Math.max(maxX, o.x + o.radius);
        maxY = Math.max(maxY, o.y + o.radius);
    });

    // Add padding
    const padding = 200;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // Scale to fit map
    this.mapScaleX = this.mapWidth / worldWidth;
    this.mapScaleY = this.mapHeight / worldHeight;
    
    // Use uniform scale to keep aspect ratio
    const scale = Math.min(this.mapScaleX, this.mapScaleY);
    this.mapScaleX = scale;
    this.mapScaleY = scale;

    this.offsetX = minX;
    this.offsetY = minY;

    // Draw Waypoints and Obstacles
    this.obstaclesLayer.clear();
    this.waypointsLayer.clear();
    obstacles.forEach(obstacle => {
        const mx = (obstacle.x - this.offsetX) * this.mapScaleX - this.mapWidth/2;
        const my = (obstacle.y - this.offsetY) * this.mapScaleY - this.mapHeight/2;
        const radius = Math.max(6, obstacle.radius * scale);

        this.obstaclesLayer.fillStyle(0x555555, 0.7);
        this.obstaclesLayer.fillCircle(mx, my, radius);
        this.obstaclesLayer.lineStyle(1, 0x111111, 0.6);
        this.obstaclesLayer.strokeCircle(mx, my, radius + 2);
    });

    waypoints.forEach((p, index) => {
        const mx = (p.x - this.offsetX) * this.mapScaleX - this.mapWidth/2;
        const my = (p.y - this.offsetY) * this.mapScaleY - this.mapHeight/2;
        
        // Line to next
        if (index < waypoints.length - 1) {
            const next = waypoints[index + 1];
            const nx = (next.x - this.offsetX) * this.mapScaleX - this.mapWidth/2;
            const ny = (next.y - this.offsetY) * this.mapScaleY - this.mapHeight/2;
            this.waypointsLayer.lineStyle(2, 0xffffff, 0.3);
            this.waypointsLayer.lineBetween(mx, my, nx, ny);
        }

        // Point
        this.waypointsLayer.fillStyle(0xffaa00, 1);
        this.waypointsLayer.fillCircle(mx, my, 4);
    });
  }

  updateBoat(x: number, y: number, heading: number) {
      const mx = (x - this.offsetX) * this.mapScaleX - this.mapWidth/2;
      const my = (y - this.offsetY) * this.mapScaleY - this.mapHeight/2;

      // Clamp to bounds
      const clampedX = Phaser.Math.Clamp(mx, -this.mapWidth/2, this.mapWidth/2);
      const clampedY = Phaser.Math.Clamp(my, -this.mapHeight/2, this.mapHeight/2);

      this.boatMarker.clear();
      this.boatMarker.fillStyle(0x00ffff, 1);
      
      // Draw simple arrow
      this.boatMarker.setPosition(clampedX, clampedY);
      this.boatMarker.setRotation(Phaser.Math.DegToRad(heading));
      this.boatMarker.beginPath();
      this.boatMarker.moveTo(0, -6);
      this.boatMarker.lineTo(4, 4);
      this.boatMarker.lineTo(0, 2);
      this.boatMarker.lineTo(-4, 4);
      this.boatMarker.closePath();
      this.boatMarker.fillPath();
  }
}
