import Phaser from 'phaser';
import { Waypoint } from './Waypoint';

export class Course {
  private scene: Phaser.Scene;
  private waypoints: Waypoint[] = [];
  private currentWaypointIndex: number = 0;
  private isFinished: boolean = false;

  constructor(scene: Phaser.Scene, data: { x: number; y: number }[]) {
    this.scene = scene;
    
    data.forEach((p, index) => {
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
  
  getCurrentIndex(): number {
      return this.currentWaypointIndex;
  }
}
