export const HOUSE_ROOMS = [
  { id: 'bedroom', name: 'Bedroom', title: 'Home, sweet home.', minX: -3.3, maxX: 3.3, minZ: -3.6, maxZ: 3.6 },
  { id: 'hall', name: 'Hall', title: 'A little hello.', minX: 3.3, maxX: 5.3, minZ: -4.3, maxZ: 3.6 },
  { id: 'living', name: 'Living room', title: 'Room to be together.', minX: 5.3, maxX: 11.3, minZ: -.9, maxZ: 4.7 },
  { id: 'kitchen', name: 'Kitchen', title: 'Something good cooking.', minX: 11.3, maxX: 16.3, minZ: -.9, maxZ: 4.7 },
  { id: 'laundry', name: 'Laundry room', title: 'Fresh little folds.', minX: 9.3, maxX: 13.8, minZ: -4.3, maxZ: -.9 },
  { id: 'bathroom', name: 'Bathroom', title: 'A little freshen up.', minX: 5.3, maxX: 9.3, minZ: -4.3, maxZ: -.9 },
] as const;
export type RoomId = typeof HOUSE_ROOMS[number]['id'];
export const HOUSE_DOORS: { id: string; a: RoomId; b: RoomId; x: number; z: number; axis: 'x' | 'z'; width: number }[] = [
  { id: 'bedroom-hall', a: 'bedroom', b: 'hall', x: 3.3, z: 0, axis: 'z', width: 1.7 },
  { id: 'hall-living', a: 'hall', b: 'living', x: 5.3, z: 1.15, axis: 'z', width: 1.8 },
  { id: 'hall-bathroom', a: 'hall', b: 'bathroom', x: 5.3, z: -2.35, axis: 'z', width: 1.6 },
  { id: 'living-kitchen', a: 'living', b: 'kitchen', x: 11.3, z: 2.2, axis: 'z', width: 1.8 },
  { id: 'living-laundry', a: 'living', b: 'laundry', x: 10.25, z: -.9, axis: 'x', width: 1.6 },
  { id: 'kitchen-laundry', a: 'kitchen', b: 'laundry', x: 12.5, z: -.9, axis: 'x', width: 1.6 },
  { id: 'laundry-bathroom', a: 'laundry', b: 'bathroom', x: 9.3, z: -2.35, axis: 'z', width: 1.6 },
];
export const HOUSE_TASKS = [
  { id: 'book', name: 'Book', icon: '📘', room: 'Bedroom' },
  { id: 'living-toy', name: 'Toy', icon: '🧸', room: 'Living room' },
  { id: 'kitchen-dish', name: 'Dish', icon: '🍽', room: 'Kitchen' },
  { id: 'kitchen-trash', name: 'Trash', icon: '♻', room: 'Kitchen' },
  { id: 'laundry-clothes', name: 'Laundry', icon: '👕', room: 'Laundry room' },
  { id: 'bath-towel', name: 'Towel', icon: '▤', room: 'Bathroom' },
];
export const EXTRA_HOUSE_TASKS = [
  { id: 'hall-shoes', name: 'Shoes', icon: '👟', room: 'Hall' },
  { id: 'hall-mail', name: 'Mail', icon: '✉', room: 'Hall' },
  { id: 'living-cushion', name: 'Cushion', icon: '♡', room: 'Living room' },
  { id: 'laundry-clean', name: 'Folded clothes', icon: '▤', room: 'Laundry room' },
  { id: 'bath-bottle', name: 'Toiletries', icon: '♧', room: 'Bathroom' },
];
