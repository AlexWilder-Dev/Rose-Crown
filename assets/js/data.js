/* Static data for the Rose & Crown demo. Edit here, not in the page. */
window.RC_DATA = {
  // Day index follows JavaScript: 0 = Sunday ... 6 = Saturday. Times are London time, "24:00" = midnight.
  hours: {
    0: { open: '12:00', close: '22:00', kitchen: { from: '12:00', until: '21:00' } },
    1: { open: '12:00', close: '22:00', kitchen: { from: '17:00', until: '21:00' } },
    2: { open: '12:00', close: '23:00', kitchen: { from: '17:00' } },
    3: { open: '12:00', close: '23:00', kitchen: { from: '17:00' } },
    4: { open: '12:00', close: '23:00', kitchen: { from: '17:00' } },
    5: { open: '12:00', close: '24:00', kitchen: { from: '12:00' } },
    6: { open: '11:30', close: '24:00', kitchen: { from: '12:00' } }
  },

  week: {
    1: { label: 'Highpress pizza, £8.50', short: 'Pizza Monday' },
    5: { label: 'shots night from about 9pm', short: 'Shots night' },
    0: { label: 'quiz at 7pm', short: 'Quiz night' }
  },

  menu: [
    {
      id: 'pizza',
      title: 'Pizza',
      note: 'Roman style. Flat, crisp, fast and filling.',
      items: [
        { num: 'No.001', name: 'Bufala naturale', desc: 'fior di latte, basil', diet: 'v', price: '13.65' },
        { num: 'No.002', name: 'Aubergine', desc: 'house pesto, crème fraîche, fior di latte, aged organic parmesan, basil', price: '13.85' },
        { num: 'No.006', name: 'Anchovy', desc: 'kalamata olives, crispy capers, fior di latte, fresh chilli, oregano', price: '14.45' },
        { num: 'No.009', name: 'Fennel sausage', desc: "'nduja, spinach, fior di latte, fresh chilli", price: '15.85' },
        { num: 'No.010', name: 'Cotto ham', desc: 'portobello mushrooms, porcini, fior di latte, truffle oil', price: '14.95' },
        { num: 'No.011', name: 'Pepperoni', desc: 'red onion, confit garlic, fior di latte, aged organic parmesan, basil', price: '15.45' },
        { num: 'No.027', name: 'Fennel sausage', desc: 'pepperoni, speck, green chilli, fior di latte, Roquito hot honey', price: '16.15' },
        { num: 'No.032', name: 'Aubergine', desc: 'baby spinach, sundried tomatoes, kalamata olives, smoked Applewood cheese, basil', diet: 've', price: '13.85' },
        { num: 'No.033', name: 'Lemon marinated courgette', desc: 'whipped ricotta, mozzarella, courgette crisps, white base', diet: 'v', price: '13.95' }
      ]
    },
    {
      id: 'dips',
      title: 'Dips',
      note: '2.35 each or 3 for 6.00',
      items: [
        { name: 'Garlic mayo', diet: 'v', price: '2.35' },
        { name: 'Calabrian hot', diet: 've', price: '2.35' },
        { name: 'Sriracha mayo', diet: 'v', price: '2.35' },
        { name: 'Roquito hot honey', price: '2.35' },
        { name: 'House pesto', price: '2.35' }
      ]
    },
    {
      id: 'more',
      title: 'More than pizza',
      items: [
        { name: 'Nachos to share', desc: 'mozzarella, guacamole, sour cream, salsa, jalapeños', diet: 'v', price: '9.95', extra: "Add 'nduja, pepperoni or fennel sausage +2.50" },
        { name: 'Chicken tenders', desc: 'garlic mayo dip', price: '8.15' },
        { name: 'Big halloumi fries', desc: 'honey & fresh chilli dip', price: '7.95' },
        { name: 'Fries', price: '5.35', extra: 'Add garlic mayo +2.35' },
        { name: 'Garlic bread', options: [{ name: 'Confit garlic', price: '5.55' }, { name: 'Cheesy garlic', price: '6.35' }] },
        { name: "Mac'n'cini", desc: "cheesy macaroni & 'nduja arancini", price: '7.75' },
        { name: "Jack's corn fritters", price: '5.55' }
      ]
    },
    {
      id: 'endings',
      title: 'Happy Endings',
      note: '5.50 each',
      items: [
        { name: 'Naughty One', desc: 'salted caramel, miso parfait, layered with chocolate cake', price: '5.50' },
        { name: 'Gay One', desc: 'malt shortbread, vanilla ice cream, salted caramel & honeycomb parfait, malt crumb chocolate', price: '5.50' }
      ]
    }
  ],

  // SAMPLE ONLY. Keyed by weekday (0 = Sunday ... 6 = Saturday) and shown over the next seven days.
  fixtures: [
    { dow: 1, time: '20:00', comp: 'Premier League', home: 'West Ham', away: 'Everton' },
    { dow: 2, time: '20:00', comp: 'Champions League', home: 'Arsenal', away: 'Bayern Munich' },
    { dow: 3, time: '19:45', comp: 'Cup', home: 'Crystal Palace', away: 'Brentford' },
    { dow: 3, time: '20:00', comp: 'Champions League', home: 'Real Madrid', away: 'Liverpool' },
    { dow: 6, time: '12:30', comp: 'Premier League', home: 'Chelsea', away: 'Spurs' },
    { dow: 6, time: '17:30', comp: 'Premier League', home: 'Man City', away: 'Newcastle' },
    { dow: 0, time: '14:00', comp: 'Premier League', home: 'Aston Villa', away: 'Man United' },
    { dow: 0, time: '16:30', comp: 'Premier League', home: 'Brighton', away: 'Fulham' }
  ]
};
