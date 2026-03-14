import { seed3Logger } from "../core";

const INPUT_KEYS = new Map<string, string>([
  ["ArrowUp", "MC_KEY_UP"],
  ["ArrowDown", "MC_KEY_DOWN"],
  ["ArrowLeft", "MC_KEY_LEFT"],
  ["ArrowRight", "MC_KEY_RIGHT"],
  ["Enter", "MC_KEY_SELECT"],
  ["Escape", "MC_KEY_CLEAR"],
  [" ", "MC_KEY_SELECT"],
]);

export function attachSeed3Keyboard(
  target: HTMLElement,
  onInput: (input: string) => void,
): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    const mapped = INPUT_KEYS.get(event.key);
    if (!mapped) {
      return;
    }

    event.preventDefault();
    seed3Logger.debug("input", mapped);
    onInput(mapped);
  };

  target.tabIndex = 0;
  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}
