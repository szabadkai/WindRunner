import Phaser from 'phaser';
import { Waypoint } from './Waypoint';

export class Course {
  private scene: Phaser.Scene;
  private waypoints: Waypoint[] = [];
  private currentWaypointIndex: number = 0;
  private isFinished: boolean = false;
  private startLine: { x1: number, y1: number, x2: number, y2: number } | null = null;
  private startLineGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, data: { waypoints: { x: number; y: number }[], startLine?: { x1: number, y1: number, x2: number, y2: number } }) {
    this.scene = scene;
    this.startLineGraphics = scene.add.graphics();
    
    if (data.startLine) {
        this.startLine = data.startLine;
        this.drawStartLine();
    }
    
    data.waypoints.forEach((p, index) => {
        const wp = new Waypoint(scene, p.x, p.y, index);
        this.waypoints.push(wp);
    });

    // Start with first waypoint active
    if (this.waypoints.length > 0) {
        this.waypoints[0].setActiveState(true);
    }
  }

  update(boatX: number, boatY: number) {
    if (this.isFinished) return;

    const currentWP = this.waypoints[this.currentWaypointIndex];
    if (currentWP.checkCollision(boatX, boatY)) {
        this.advanceWaypoint();
    }
  }

  private advanceWaypoint() {
    const currentWP = this.waypoints[this.currentWaypointIndex];
    currentWP.complete();

    this.currentWaypointIndex++;
    
    if (this.currentWaypointIndex < this.waypoints.length) {
        // Activate next
        this.waypoints[this.currentWaypointIndex].setActiveState(true);
        this.scene.events.emit('waypointPassed', {
            index: this.currentWaypointIndex,
            total: this.waypoints.length
        });
    } else {
        // Finish
        this.isFinished = true;
        this.scene.events.emit('raceFinished');
    }
  }

  getCurrentTarget(): Waypoint | null {
    if (this.isFinished) return null;
    return this.waypoints[this.currentWaypointIndex];
  }
  
  getTotalWaypoints(): number {
      return this.waypoints.length;
  }
  
  private drawStartLine() {
      if (!this.startLine) return;
      this.startLineGraphics.clear();
      // Draw Line
      this.startLineGraphics.lineStyle(4, 0x00ff00);
      this.startLineGraphics.lineBetween(this.startLine.x1, this.startLine.y1, this.startLine.x2, this.startLine.y2);
      
      // Draw ends as flags?
      this.startLineGraphics.fillStyle(0xff0000);
      this.startLineGraphics.fillCircle(this.startLine.x1, this.startLine.y1, 5);
      this.startLineGraphics.fillCircle(this.startLine.x2, this.startLine.y2, 5);
  }

  // Returns true if boat is "behind" line relative to first waypoint? 
  // No, sailing start means you must cross the line in direction of course AFTER value 0.
  // Simple check: Just check if boat y < startLine y (assuming start line is horizontal and course is UP).
  // For MVP: Check if y < startLine.y
  checkOCS(boatY: number): boolean {
      if (!this.startLine) return false;
      // If boat is ABOVE the line (smaller Y)
      // Assuming wind from N and start is at bottom going up.
      return boatY < this.startLine.y1; // Simplified for horizontal line
  }
  
  hideStartLine() {
      this.startLineGraphics.setVisible(false);
  }

  getCurrentIndex(): number {
      return this.currentWaypointIndex;
  }
}
