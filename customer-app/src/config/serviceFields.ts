export interface FieldOption {
  label: string;
  value: string;
}

export interface ServiceField {
  key: string;
  label: string;
  type: 'chips' | 'number' | 'text';
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  unit?: string;
}

export interface ServiceFieldConfig {
  fields: ServiceField[];
  /** Service-specific placeholder hint for the description textarea */
  descriptionTemplate: string;
}

const SERVICE_FIELDS: Record<string, ServiceFieldConfig> = {
  ac: {
    descriptionTemplate:
      'e.g. My 1.5 ton split AC is not cooling properly. It runs but the room stays warm. Bought 3 years ago.',
    fields: [
      {
        key: 'serviceType',
        label: 'Service Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Service / Cleaning', value: 'SERVICE' },
          { label: 'Repair', value: 'REPAIR' },
          { label: 'Installation', value: 'INSTALL' },
          { label: 'Uninstallation', value: 'UNINSTALL' },
          { label: 'Gas Refill', value: 'GAS_REFILL' },
        ],
      },
      {
        key: 'acType',
        label: 'AC Type',
        type: 'chips',
        options: [
          { label: 'Split', value: 'SPLIT' },
          { label: 'Window', value: 'WINDOW' },
          { label: 'Cassette', value: 'CASSETTE' },
          { label: 'Tower', value: 'TOWER' },
        ],
      },
      {
        key: 'tonnage',
        label: 'Tonnage',
        type: 'chips',
        options: [
          { label: '0.75 Ton', value: '0.75' },
          { label: '1 Ton', value: '1' },
          { label: '1.5 Ton', value: '1.5' },
          { label: '2 Ton', value: '2' },
        ],
      },
    ],
  },

  plumbing: {
    descriptionTemplate:
      'e.g. The kitchen tap is constantly dripping and the cabinet below has water damage. Needs urgent repair.',
    fields: [
      {
        key: 'issueType',
        label: 'Issue Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Leakage / Dripping', value: 'LEAKAGE' },
          { label: 'Blockage / Clog', value: 'BLOCKAGE' },
          { label: 'New Installation', value: 'INSTALL' },
          { label: 'Pipe Repair', value: 'PIPE_REPAIR' },
          { label: 'Motor / Pump', value: 'MOTOR' },
          { label: 'Tank / Geyser', value: 'TANK' },
        ],
      },
      {
        key: 'area',
        label: 'Area',
        type: 'chips',
        options: [
          { label: 'Kitchen', value: 'KITCHEN' },
          { label: 'Bathroom', value: 'BATHROOM' },
          { label: 'Outdoor', value: 'OUTDOOR' },
          { label: 'Terrace / Overhead', value: 'TERRACE' },
        ],
      },
    ],
  },

  electrical: {
    descriptionTemplate:
      'e.g. The bedroom fan stopped working suddenly. The switch board has a burning smell. Please check and fix.',
    fields: [
      {
        key: 'issueType',
        label: 'Issue Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Fan / Light', value: 'FAN_LIGHT' },
          { label: 'Switch / Socket', value: 'SWITCH' },
          { label: 'MCB / Short Circuit', value: 'MCB' },
          { label: 'Wiring / Rewiring', value: 'WIRING' },
          { label: 'Inverter / UPS', value: 'INVERTER' },
          { label: 'Power Point Install', value: 'POWERPOINT' },
        ],
      },
      {
        key: 'area',
        label: 'Location',
        type: 'chips',
        options: [
          { label: 'Living Room', value: 'LIVING' },
          { label: 'Bedroom', value: 'BEDROOM' },
          { label: 'Kitchen', value: 'KITCHEN' },
          { label: 'Outdoor', value: 'OUTDOOR' },
        ],
      },
    ],
  },

  cleaning: {
    descriptionTemplate:
      'e.g. Need a full 2 BHK deep clean — floors, bathroom tiles, kitchen slab and fans. Prefer morning slot.',
    fields: [
      {
        key: 'cleaningType',
        label: 'Cleaning Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Full Home', value: 'FULL_HOME' },
          { label: 'Bathroom', value: 'BATHROOM' },
          { label: 'Kitchen', value: 'KITCHEN' },
          { label: 'Sofa / Carpet', value: 'SOFA_CARPET' },
          { label: 'Water Tank', value: 'WATER_TANK' },
          { label: 'Commercial', value: 'COMMERCIAL' },
        ],
      },
      {
        key: 'propertySize',
        label: 'Property Size',
        type: 'chips',
        options: [
          { label: '1 BHK', value: '1BHK' },
          { label: '2 BHK', value: '2BHK' },
          { label: '3 BHK', value: '3BHK' },
          { label: '4 BHK+', value: '4BHK' },
          { label: 'Studio', value: 'STUDIO' },
          { label: 'Villa', value: 'VILLA' },
        ],
      },
    ],
  },

  painting: {
    descriptionTemplate:
      'e.g. 2 bedrooms need interior painting. Walls are already plastered. Need lemon yellow for one room and off-white for the other.',
    fields: [
      {
        key: 'paintingType',
        label: 'Painting Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Interior', value: 'INTERIOR' },
          { label: 'Exterior', value: 'EXTERIOR' },
          { label: 'Texture / Design', value: 'TEXTURE' },
          { label: 'Waterproofing', value: 'WATERPROOFING' },
          { label: 'Wall Putty', value: 'PUTTY' },
        ],
      },
      {
        key: 'rooms',
        label: 'Number of Rooms',
        type: 'chips',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5+', value: '5' },
        ],
      },
    ],
  },

  carpentry: {
    descriptionTemplate:
      'e.g. The bedroom wardrobe door hinge is broken and the door scrapes the floor when opened. Need repair and realignment.',
    fields: [
      {
        key: 'serviceType',
        label: 'Service Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Door / Window Repair', value: 'DOOR_WINDOW' },
          { label: 'Furniture Repair', value: 'FURNITURE' },
          { label: 'Wardrobe / Almirah', value: 'WARDROBE' },
          { label: 'Bed Assembly', value: 'BED' },
          { label: 'New Furniture', value: 'NEW_FURNITURE' },
          { label: 'Locks & Hinges', value: 'LOCKS' },
        ],
      },
    ],
  },

  'pest control': {
    descriptionTemplate:
      'e.g. Cockroach infestation in kitchen and bathroom. Have seen them near the sink area and inside cabinets. 2 BHK apartment.',
    fields: [
      {
        key: 'pestType',
        label: 'Pest Type',
        type: 'chips',
        required: true,
        options: [
          { label: 'Cockroach', value: 'COCKROACH' },
          { label: 'Termite / Whitants', value: 'TERMITE' },
          { label: 'Rodent / Rat', value: 'RODENT' },
          { label: 'Mosquito / Flies', value: 'MOSQUITO' },
          { label: 'Bed Bugs', value: 'BED_BUGS' },
          { label: 'General / All', value: 'GENERAL' },
        ],
      },
      {
        key: 'propertyType',
        label: 'Property Type',
        type: 'chips',
        options: [
          { label: 'Apartment', value: 'APARTMENT' },
          { label: 'Independent House', value: 'HOUSE' },
          { label: 'Office / Shop', value: 'COMMERCIAL' },
        ],
      },
    ],
  },

  appliance: {
    descriptionTemplate:
      'e.g. Washing machine makes a loud grinding noise during the spin cycle and sometimes stops mid-wash. Brand: Samsung, 6 kg, front-load.',
    fields: [
      {
        key: 'applianceType',
        label: 'Appliance',
        type: 'chips',
        required: true,
        options: [
          { label: 'Washing Machine', value: 'WASHING_MACHINE' },
          { label: 'Refrigerator', value: 'REFRIGERATOR' },
          { label: 'TV / Display', value: 'TV' },
          { label: 'Microwave / OTG', value: 'MICROWAVE' },
          { label: 'Water Purifier', value: 'WATER_PURIFIER' },
          { label: 'Geyser / Heater', value: 'GEYSER' },
          { label: 'Dishwasher', value: 'DISHWASHER' },
        ],
      },
      {
        key: 'issueType',
        label: 'Issue',
        type: 'chips',
        options: [
          { label: 'Not Working', value: 'NOT_WORKING' },
          { label: 'Making Noise', value: 'NOISE' },
          { label: 'Leaking', value: 'LEAKING' },
          { label: 'Installation', value: 'INSTALL' },
          { label: 'Service / Check', value: 'SERVICE' },
        ],
      },
    ],
  },
};

/** Match category name → field config (case-insensitive substring match) */
export function getServiceFields(categoryName: string): ServiceFieldConfig | null {
  const lower = categoryName.toLowerCase();
  for (const [key, config] of Object.entries(SERVICE_FIELDS)) {
    if (lower.includes(key)) return config;
  }
  return null;
}
