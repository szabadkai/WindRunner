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

export const FOG_CONFIG = {
  OPACITY: 0.22, // Increased for visibility testing
  DRIFT_MULTIPLIER: 1.5, // Scale fog drift with wind
};

export const HEEL_CONFIG = {
  OPTIMAL_MIN: 15, // degrees - lower bound of optimal zone
  OPTIMAL_MAX: 25, // degrees - upper bound of optimal zone
  MAX_HEEL: 45, // degrees - physical clamp
  SENSITIVITY: 1.5, // wind-to-heel response multiplier
};

export const COURIER_CONFIG = {
  SESSION_DURATION: 360000, // 6 minutes in ms
  ISLAND_COUNT: 10,
  ISLAND_MIN_DISTANCE: 2500, // pixels - drastically increased for 10x scale
  MAX_CARGO: 2,
  CARGO_WEIGHT_MULTIPLIER: 1.2, // per item
  BASE_DELIVERY_TIME: 60000, // 60s
  UPWIND_PAYOUT_BONUS: 1.5, // multiplier
  BASE_PAYOUT: 100,
  DELIVERY_RADIUS: 150, // pixels (increased for easier docking with larger scale)
};
