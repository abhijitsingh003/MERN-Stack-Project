import assert from 'assert';

const hslToHex = (h, s, l) => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (v) => {
    const hex = Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const generatePalette = (count) => {
  const colors = [];
  const used = new Set();
  let index = count;
  for (let i = 0; i < count; i += 1) {
    let color = '';
    let attempts = 0;
    while (attempts < 720) {
      const hue = (index * 137.508) % 360;
      const candidate = hslToHex(hue, 65, 55);
      index += 1;
      attempts += 1;
      if (!used.has(candidate)) {
        color = candidate;
        used.add(candidate);
        break;
      }
    }
    if (!color) {
      color = '#3b82f6';
    }
    colors.push(color);
  }
  return colors;
};

const colors = generatePalette(24);
const unique = new Set(colors);
assert.strictEqual(unique.size, colors.length, 'Colors must be unique');

const computeEventRect = (start, end) => {
  const totalMinutesInDay = 24 * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutesRaw = end.getHours() * 60 + end.getMinutes();
  const endMinutes = Math.max(endMinutesRaw, startMinutes + 15);
  const top = (startMinutes / totalMinutesInDay) * 100;
  const height = ((endMinutes - startMinutes) / totalMinutesInDay) * 100;
  return { top, height };
};

const start = new Date('2025-12-16T11:00:00');
const end = new Date('2025-12-16T15:00:00');
const rect = computeEventRect(start, end);
assert.ok(rect.top > 40 && rect.top < 50, 'Event starting at 11 AM should be near mid-day');
assert.ok(rect.height > 15 && rect.height < 20, 'Four hour event should cover about one sixth of the day');

console.log('colorUtils tests passed');

