import Phaser from 'phaser';
import { Cargo } from './Cargo';
import { Island } from './Island';
import { COURIER_CONFIG } from '../config';

export class DeliveryBoard {
  private jobs: Cargo[] = [];
  private scene: Phaser.Scene;
  private islands: Island[];

  constructor(scene: Phaser.Scene, islands: Island[]) {
    this.scene = scene;
    this.islands = islands;
  }

  // Generate initial jobs
  generateJobs(count: number, currentTime: number) {
    for (let i = 0; i < count; i++) {
      this.spawnJob(currentTime);
    }
  }

  update(currentTime: number) {
    // Remove expired jobs
    this.jobs = this.jobs.filter(job => job.expiresAt > currentTime);

    // Replenish jobs if low
    if (this.jobs.length < 4) {
      if (Math.random() < 0.01) { // Random spawn chance
        this.spawnJob(currentTime);
      }
    }
  }

  spawnJob(currentTime: number) {
    if (this.islands.length < 2) return;

    // Pick random source and destination
    const source = Phaser.Utils.Array.GetRandom(this.islands);
    let dest = Phaser.Utils.Array.GetRandom(this.islands);
    while (dest === source) {
      dest = Phaser.Utils.Array.GetRandom(this.islands);
    }

    // Calculate Payout based on Distance & Wind (Placeholder for Wind check)
    // For now, distance based.
    const dist = Phaser.Math.Distance.Between(source.x, source.y, dest.x, dest.y);
    
    // Wind Bonus: If destination is UPWIND from source, multiplier.
    // Need access to Wind object or pass it in. For simplicity, random bonus or distance only first.
    // Let's assume standard time first.
    
    const timeLimit = COURIER_CONFIG.BASE_DELIVERY_TIME * (dist / 500); // Scale time by distance
    const payout = Math.floor(COURIER_CONFIG.BASE_PAYOUT + (dist * 0.5));

    const job: Cargo = {
      id: Phaser.Math.RND.uuid(),
      sourceId: source.id,
      destinationId: dest.id,
      payout: payout,
      expiresAt: currentTime + timeLimit + 30000, // 30s buffer to pickup
      description: `Deliver to ${dest.islandName}`
    };

    this.jobs.push(job);
    this.scene.events.emit('jobs-updated', this.jobs);
  }

  getJobsAtIsland(islandId: string): Cargo[] {
    return this.jobs.filter(j => j.sourceId === islandId);
  }

  getAllJobs(): Cargo[] {
    return this.jobs;
  }

  removeJob(jobId: string) {
    const idx = this.jobs.findIndex(j => j.id === jobId);
    if (idx >= 0) {
      this.jobs.splice(idx, 1);
      this.scene.events.emit('jobs-updated', this.jobs);
    }
  }
}
