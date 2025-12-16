export const PHYSICS_CONFIG = {
  WIND_SPEED_MIN: 5, // knots
  WIND_SPEED_MAX: 15, // knots
  WIND_SHIFT_INTERVAL_MIN: 30000, // ms
  WIND_SHIFT_INTERVAL_MAX: 60000, // ms
  WIND_SHIFT_AMOUNT_MIN: 5, // degrees
  WIND_SHIFT_AMOUNT_MAX: 15, // degrees
  NO_GO_ZONE_ANGLE: 45, // degrees
  MAX_BOAT_SPEED: 8, // knots
  RUDDER_TURN_RATE: 2, // degrees/frame
  SAIL_ADJUST_RATE: 2, // %/frame
  DRAG_COEFFICIENT: 0.98, // multiplier/frame
  RUDDER_DRAG_PENALTY: 0.995, // multiplier/frame
  WAYPOINT_RADIUS: 40, // pixels
};
