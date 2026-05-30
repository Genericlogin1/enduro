export type BikeMake = {
  name: string;
  color: string;      // brand color for badge
  textColor: string;
  models: string[];
};

export const BIKE_MAKES: BikeMake[] = [
  {
    name: 'KTM', color: '#FF6600', textColor: '#fff',
    models: ['EXC 125', 'EXC 150', 'EXC 200', 'EXC 250', 'EXC 300', 'EXC-F 250', 'EXC-F 350', 'EXC-F 450', 'EXC-F 500', 'SX 125', 'SX 250', 'SX-F 250', 'SX-F 350', 'SX-F 450', 'Freeride E-XC'],
  },
  {
    name: 'Husqvarna', color: '#003DA5', textColor: '#fff',
    models: ['TE 150', 'TE 250', 'TE 300', 'FE 250', 'FE 350', 'FE 450', 'FE 501', 'TC 125', 'TC 250', 'FC 250', 'FC 350', 'FC 450'],
  },
  {
    name: 'Beta', color: '#E30613', textColor: '#fff',
    models: ['RR 125', 'RR 200', 'RR 250', 'RR 300', 'RR-S 350', 'RR-S 390', 'RR-S 430', 'RR-S 480', 'X-Trainer 250', 'X-Trainer 300'],
  },
  {
    name: 'GASGAS', color: '#D0021B', textColor: '#fff',
    models: ['EC 250', 'EC 300', 'EX 250F', 'EX 350F', 'EX 450F', 'MC 125', 'MC 250F', 'MC 450F'],
  },
  {
    name: 'Sherco', color: '#00A651', textColor: '#fff',
    models: ['SE 125', 'SE 250', 'SE 300', 'SE-F 250', 'SE-F 300', 'SE-F 450', 'SEF-R 450', 'SEF-R 500'],
  },
  {
    name: 'TM Racing', color: '#1C1C1C', textColor: '#fff',
    models: ['EN 125', 'EN 250', 'EN 300', 'EN-F 250', 'EN-F 300', 'EN-F 450', 'MX 125', 'MX 250F', 'MX 450F'],
  },
  {
    name: 'Yamaha', color: '#003087', textColor: '#fff',
    models: ['WR 125R', 'WR 250F', 'WR 450F', 'YZ 125', 'YZ 250', 'YZ 250F', 'YZ 450F', 'TT-R 230'],
  },
  {
    name: 'Honda', color: '#CC0000', textColor: '#fff',
    models: ['CRF 250RX', 'CRF 300L', 'CRF 300 Rally', 'CRF 450RX', 'CRF 450X', 'CRF 450L', 'CRF 125F', 'CRF 150R'],
  },
  {
    name: 'Kawasaki', color: '#009900', textColor: '#fff',
    models: ['KLX 300R', 'KX 250', 'KX 450', 'KX 250X', 'KX 450X', 'KLX 450R'],
  },
  {
    name: 'Suzuki', color: '#003087', textColor: '#fff',
    models: ['DR-Z 400S', 'DR-Z 400E', 'RM-Z 250', 'RM-Z 450', 'RM 125', 'RM 250'],
  },
  {
    name: 'Rieju', color: '#C8A000', textColor: '#000',
    models: ['MR 250', 'MR 300', 'MR 200', 'Marathon 125', 'Marathon 500'],
  },
  {
    name: 'Other', color: '#4B5563', textColor: '#fff',
    models: [],
  },
];

export function getMake(name: string): BikeMake | undefined {
  return BIKE_MAKES.find(m => m.name === name);
}
