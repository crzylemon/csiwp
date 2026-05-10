// gamepad stuff
// mapping: https://w3c.github.io/gamepad/#remapping

const DEADZONE = 0.2;

export const gamepadState = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  start: false,
  startPressed: false,
  axisX: 0,
};

let prevJump = false;
let prevStart = false;

export function pollGamepad() {
  const gamepads = navigator.getGamepads();
  let gp = null;
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].connected) {
      gp = gamepads[i];
      break;
    }
  }

  if (!gp) {
    gamepadState.left = false;
    gamepadState.right = false;
    gamepadState.jump = false;
    gamepadState.jumpPressed = false;
    gamepadState.start = false;
    gamepadState.startPressed = false;
    gamepadState.axisX = 0;
    return;
  }

  // axis 0 = horizontal
  const axisX = gp.axes[0] || 0;
  gamepadState.axisX = axisX;

  // d-pad
  const hasEnoughButtons = gp.buttons.length > 15;
  const dpadLeft = hasEnoughButtons && gp.buttons[14].pressed;
  const dpadRight = hasEnoughButtons && gp.buttons[15].pressed;
  const dpadUp = hasEnoughButtons && gp.buttons[12].pressed;

  gamepadState.left = axisX < -DEADZONE || dpadLeft;
  gamepadState.right = axisX > DEADZONE || dpadRight;

  // jump with anything or d-pad up
  const jumpNow = (gp.buttons[0] && gp.buttons[0].pressed) ||
                  (gp.buttons[1] && gp.buttons[1].pressed) ||
                  dpadUp;
  gamepadState.jump = jumpNow;
  gamepadState.jumpPressed = jumpNow && !prevJump;
  prevJump = jumpNow;

  // start or a for skip/confirm
  const startNow = (gp.buttons.length > 9 && gp.buttons[9].pressed) ||
                   (gp.buttons[0] && gp.buttons[0].pressed);
  gamepadState.start = startNow;
  gamepadState.startPressed = startNow && !prevStart;
  prevStart = startNow;
}
