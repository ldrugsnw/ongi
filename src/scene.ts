// All effect coordinates refer to this image's original pixel dimensions.
export const scene = {
  background: `${import.meta.env.BASE_URL}assets/backgrounds/winter-house.png`,
  width: 1672,
  height: 941,
  audio: `${import.meta.env.BASE_URL}audio/269062__nebulousflynn__wood-burning-stove.wav`,
  steamSeconds: 10,
  fireSeconds: 3,
  cup: { x: 1174, y: 622 },
  fire: { x: 198, y: 451, radius: 230 },
  // Keep the brighter moving light inside the stove's glass opening.
  fireOpening: 'M116 399 Q195 360 282 393 L282 510 Q199 533 116 520 Z',
  // Inset from the wooden frames, including each pane's sloping edge.
  panes: [
    '1180,0 1383,0 1383,147 1180,189',
    '1427,0 1617,0 1617,99 1427,140',
    '1181,222 1382,180 1382,481 1181,453',
    '1427,173 1617,132 1617,516 1427,489',
  ],
  // Conservative exclusions protect the indoor lamp, plants, house and branches.
  foreground: [
    '1160,0 1234,0 1234,45 1279,68 1318,126 1280,149 1160,158',
    '1160,342 1228,354 1252,390 1262,414 1270,483 1160,483',
    '1597,209 1624,210 1624,533 1594,533 1594,424 1550,371 1517,346 1501,311 1538,315 1569,340 1544,282 1500,279 1500,242 1539,240 1587,299',
  ],
};
