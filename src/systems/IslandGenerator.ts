import Phaser from 'phaser';
import { Island } from '../objects/Island';
import { COURIER_CONFIG } from '../config';

export class IslandGenerator {
  static generateIslands(scene: Phaser.Scene): Island[] {
    const islands: Island[] = [];
    const width = scene.physics.world.bounds.width;
    const height = scene.physics.world.bounds.height;
    
    // Names for islands
    const names = ['Tortuga', 'Barbados', 'Havana', 'Nassau', 'Cayman', 'Jamaica', 'Bermuda', 'Antigua'];
    Phaser.Utils.Array.Shuffle(names);

    // Ensure Home Island is near center
    const homeX = width / 2;
    const homeY = height / 2;
    const homeIsland = new Island(scene, homeX, homeY, 'home', names[0]);
    islands.push(homeIsland);

    let attempts = 0;
    while (islands.length < COURIER_CONFIG.ISLAND_COUNT && attempts < 100) {
      attempts++;
      
      const padding = 100;
      const x = Phaser.Math.Between(padding, width - padding);
      const y = Phaser.Math.Between(padding, height - padding);

      // Check distance to existing
      let valid = true;
      for (const other of islands) {
        const dist = Phaser.Math.Distance.Between(x, y, other.x, other.y);
        if (dist < COURIER_CONFIG.ISLAND_MIN_DISTANCE) {
          valid = false;
          break;
        }
      }

      if (valid) {
        const id = `island_${islands.length}`;
        const name = names[islands.length] || `Island ${islands.length}`;
        const newIsland = new Island(scene, x, y, id, name);
        islands.push(newIsland);
      }
    }

    return islands;
  }
}
