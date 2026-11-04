// Lokale Lebensmitteldatenbank (Nährwerte pro 100 g, gerundete Durchschnittswerte).
// unit: typische Portion [Bezeichnung, Gramm]; alias: Suchwörter für die Texteingabe.
const F = (key, name, kcal, p, c, f, unit = null, alias = []) => ({ key, name, kcal, p, c, f, unit, alias, src: 'local' });

export const FOODS = [
  // Getreide & Brot
  F('haferflocken', 'Haferflocken', 372, 13.5, 58.7, 7, ['EL', 10], ['hafer', 'oats']),
  F('muesli', 'Müsli (ungezuckert)', 360, 10, 60, 6.5, ['Portion', 50]),
  F('cornflakes', 'Cornflakes', 378, 7.5, 84, 0.9, ['Portion', 30]),
  F('vollkornbrot', 'Vollkornbrot', 216, 7, 39, 1.8, ['Scheibe', 50], ['brot']),
  F('mischbrot', 'Mischbrot', 230, 6.5, 46, 1.2, ['Scheibe', 45]),
  F('toast', 'Toastbrot', 260, 8, 48, 3.5, ['Scheibe', 25]),
  F('broetchen', 'Brötchen (Weizen)', 270, 9, 53, 1.8, ['Stück', 55], ['semmel', 'schrippe']),
  F('vollkornbroetchen', 'Vollkornbrötchen', 245, 9.5, 42, 3, ['Stück', 60]),
  F('knaeckebrot', 'Knäckebrot', 345, 10, 66, 1.5, ['Scheibe', 10]),
  F('reis_gekocht', 'Reis (gekocht)', 130, 2.7, 28, 0.3, ['Portion', 180], ['reis']),
  F('reis_roh', 'Reis (roh)', 350, 7, 77, 0.6, ['Portion', 70]),
  F('nudeln_gekocht', 'Nudeln (gekocht)', 150, 5.5, 30, 0.9, ['Portion', 220], ['nudeln', 'pasta', 'spaghetti']),
  F('nudeln_roh', 'Nudeln (roh)', 355, 12.5, 71, 1.5, ['Portion', 100]),
  F('vollkornnudeln', 'Vollkornnudeln (gekocht)', 140, 5.8, 26, 1.1, ['Portion', 220]),
  F('kartoffeln', 'Kartoffeln (gekocht)', 72, 2, 15, 0.1, ['Stück', 90], ['kartoffel']),
  F('suesskartoffel', 'Süßkartoffel (gekocht)', 86, 1.6, 20, 0.1, ['Stück', 150]),
  F('pommes', 'Pommes frites', 290, 3.4, 36, 15, ['Portion', 150]),
  F('couscous', 'Couscous (gekocht)', 112, 3.8, 23, 0.2, ['Portion', 150]),
  F('quinoa', 'Quinoa (gekocht)', 120, 4.4, 21, 1.9, ['Portion', 150]),
  F('wrap', 'Tortilla-Wrap', 300, 8, 50, 7, ['Stück', 60]),

  // Milchprodukte & Eier
  F('ei', 'Ei', 155, 13, 1.1, 11, ['Stück', 60], ['eier']),
  F('eiklar', 'Eiklar', 52, 11, 0.7, 0.2, ['Stück', 33], ['eiweiss']),
  F('milch', 'Milch 1,5 %', 47, 3.4, 4.8, 1.5, ['Glas', 200]),
  F('vollmilch', 'Vollmilch 3,5 %', 64, 3.3, 4.8, 3.5, ['Glas', 200]),
  F('hafermilch', 'Haferdrink', 46, 0.5, 6.7, 1.5, ['Glas', 200]),
  F('magerquark', 'Magerquark', 67, 12, 4, 0.3, ['Becher', 250], ['quark']),
  F('skyr', 'Skyr natur', 63, 11, 4, 0.2, ['Becher', 150]),
  F('joghurt', 'Naturjoghurt 3,5 %', 66, 3.8, 4.7, 3.5, ['Becher', 150], ['jogurt']),
  F('griech_joghurt', 'Griechischer Joghurt 10 %', 120, 4.5, 4, 10, ['Becher', 150]),
  F('huettenkaese', 'Hüttenkäse', 98, 12, 3, 4.3, ['Becher', 200], ['koernigerfrischkaese']),
  F('gouda', 'Gouda', 360, 25, 0, 29, ['Scheibe', 20], ['kaese']),
  F('mozzarella', 'Mozzarella', 250, 18, 1, 19, ['Kugel', 125]),
  F('feta', 'Feta', 265, 17, 0.5, 21, ['Portion', 50]),
  F('frischkaese', 'Frischkäse', 250, 6, 3.5, 24, ['EL', 20]),
  F('butter', 'Butter', 740, 0.7, 0.6, 82, ['TL', 5]),
  F('sahne', 'Sahne 30 %', 290, 2.4, 3.3, 30, ['EL', 15]),

  // Fleisch & Fisch
  F('haehnchenbrust', 'Hähnchenbrust (gegart)', 165, 31, 0, 3.6, ['Stück', 150], ['haehnchen', 'huehnchen', 'chicken']),
  F('putenbrust', 'Putenbrust (gegart)', 150, 30, 0, 2, ['Stück', 150], ['pute']),
  F('rinderhack', 'Rinderhack (gegart)', 250, 26, 0, 17, ['Portion', 125], ['hackfleisch', 'hack']),
  F('rindersteak', 'Rindersteak', 190, 29, 0, 8, ['Stück', 200], ['steak']),
  F('schweinefilet', 'Schweinefilet', 140, 26, 0, 4, ['Stück', 150]),
  F('schinken', 'Kochschinken', 110, 20, 1, 3, ['Scheibe', 20]),
  F('salami', 'Salami', 380, 22, 1, 32, ['Scheibe', 10]),
  F('bratwurst', 'Bratwurst', 300, 13, 1, 27, ['Stück', 100]),
  F('lachs', 'Lachs', 208, 20, 0, 13, ['Filet', 125]),
  F('thunfisch', 'Thunfisch (Dose, naturell)', 110, 25, 0, 1, ['Dose', 150]),
  F('garnelen', 'Garnelen', 90, 20, 0, 1, ['Portion', 100]),
  F('kabeljau', 'Kabeljau', 82, 18, 0, 0.7, ['Filet', 150], ['fisch']),

  // Pflanzliche Proteine
  F('tofu', 'Tofu natur', 120, 13, 1.5, 7, ['Portion', 100]),
  F('linsen', 'Linsen (gekocht)', 116, 9, 20, 0.4, ['Portion', 150]),
  F('kichererbsen', 'Kichererbsen (gekocht)', 140, 8, 21, 2.5, ['Portion', 150]),
  F('kidneybohnen', 'Kidneybohnen (Dose)', 100, 7, 15, 0.5, ['Portion', 120], ['bohnen']),
  F('proteinpulver', 'Proteinpulver (Whey)', 380, 78, 6, 5, ['Scoop', 30], ['whey', 'shake', 'proteinshake', 'eiweisspulver']),
  F('hummus', 'Hummus', 270, 7.5, 13, 20, ['EL', 20]),

  // Obst
  F('apfel', 'Apfel', 52, 0.3, 12, 0.2, ['Stück', 180]),
  F('banane', 'Banane', 89, 1.1, 21, 0.3, ['Stück', 120]),
  F('orange', 'Orange', 47, 1, 9, 0.2, ['Stück', 160]),
  F('birne', 'Birne', 57, 0.4, 13, 0.1, ['Stück', 170]),
  F('erdbeeren', 'Erdbeeren', 32, 0.7, 6, 0.3, ['Schale', 150]),
  F('heidelbeeren', 'Heidelbeeren', 57, 0.7, 12, 0.3, ['Schale', 125], ['blaubeeren']),
  F('trauben', 'Weintrauben', 69, 0.7, 16, 0.2, ['Handvoll', 80]),
  F('kiwi', 'Kiwi', 61, 1.1, 11, 0.5, ['Stück', 75]),
  F('mango', 'Mango', 60, 0.8, 13, 0.4, ['Stück', 300]),
  F('ananas', 'Ananas', 50, 0.5, 12, 0.1, ['Scheibe', 80]),
  F('wassermelone', 'Wassermelone', 30, 0.6, 7.5, 0.2, ['Stück', 250]),
  F('avocado', 'Avocado', 160, 2, 2, 15, ['Stück', 150]),
  F('datteln', 'Datteln (getrocknet)', 280, 2.5, 66, 0.4, ['Stück', 8]),

  // Gemüse
  F('brokkoli', 'Brokkoli', 34, 2.8, 4, 0.4, ['Portion', 200]),
  F('tomate', 'Tomate', 18, 0.9, 2.6, 0.2, ['Stück', 100], ['tomaten']),
  F('gurke', 'Gurke', 15, 0.6, 2.2, 0.1, ['Stück', 400]),
  F('paprika', 'Paprika', 31, 1, 6, 0.3, ['Stück', 160]),
  F('karotte', 'Karotte', 41, 0.9, 7.5, 0.2, ['Stück', 80], ['moehre', 'karotten']),
  F('spinat', 'Spinat', 23, 2.9, 1.4, 0.4, ['Portion', 150]),
  F('salat', 'Blattsalat', 15, 1.3, 1.7, 0.2, ['Portion', 80]),
  F('zucchini', 'Zucchini', 17, 1.2, 2.2, 0.3, ['Stück', 250]),
  F('pilze', 'Champignons', 22, 3, 0.6, 0.3, ['Portion', 100]),
  F('zwiebel', 'Zwiebel', 40, 1.1, 8, 0.1, ['Stück', 80]),
  F('mais', 'Mais (Dose)', 85, 3, 15, 1.2, ['Portion', 80]),
  F('erbsen', 'Erbsen', 80, 5.5, 11, 0.4, ['Portion', 100]),
  F('blumenkohl', 'Blumenkohl', 25, 2, 3, 0.3, ['Portion', 200]),
  F('gruene_bohnen', 'Grüne Bohnen', 31, 1.8, 5, 0.2, ['Portion', 150]),

  // Nüsse, Fette, Aufstriche
  F('mandeln', 'Mandeln', 600, 21, 7, 52, ['Handvoll', 25], ['nuesse']),
  F('walnuesse', 'Walnüsse', 654, 15, 7, 65, ['Handvoll', 25]),
  F('erdnuesse', 'Erdnüsse', 590, 26, 10, 49, ['Handvoll', 25]),
  F('erdnussbutter', 'Erdnussbutter', 600, 25, 14, 50, ['EL', 15], ['erdnussmus']),
  F('olivenoel', 'Olivenöl', 884, 0, 0, 100, ['EL', 10], ['oel']),
  F('honig', 'Honig', 310, 0.4, 76, 0, ['TL', 10]),
  F('marmelade', 'Konfitüre', 250, 0.4, 60, 0.1, ['TL', 15], ['marmelade']),
  F('nutella', 'Nuss-Nougat-Creme', 540, 6, 58, 31, ['TL', 15]),
  F('chiasamen', 'Chiasamen', 490, 17, 8, 31, ['EL', 10]),

  // Snacks & Süßes
  F('schokolade', 'Vollmilchschokolade', 540, 7, 57, 31, ['Riegel', 25]),
  F('zartbitter', 'Zartbitterschokolade 70 %', 580, 8, 33, 43, ['Stück', 10]),
  F('chips', 'Kartoffelchips', 540, 6, 50, 34, ['Handvoll', 30]),
  F('gummibaerchen', 'Fruchtgummi', 340, 6.5, 77, 0.2, ['Handvoll', 30]),
  F('proteinriegel', 'Proteinriegel', 360, 32, 33, 12, ['Stück', 60]),
  F('muesliriegel', 'Müsliriegel', 410, 6, 63, 14, ['Stück', 25]),
  F('reiswaffel', 'Reiswaffel', 380, 8, 80, 3, ['Stück', 8]),
  F('kuchen', 'Kuchen (Rührkuchen)', 380, 5, 50, 18, ['Stück', 80]),
  F('eis', 'Speiseeis', 210, 3.5, 25, 11, ['Kugel', 60]),

  // Gerichte
  F('pizza', 'Pizza Margherita', 250, 11, 31, 9, ['Stück (ganze Pizza)', 350]),
  F('doener', 'Döner Kebab', 215, 12, 20, 10, ['Stück', 400]),
  F('burger', 'Hamburger', 255, 13, 29, 10, ['Stück', 220]),
  F('lasagne', 'Lasagne', 160, 8, 13, 8.5, ['Portion', 350]),
  F('spaghetti_bolo', 'Spaghetti Bolognese', 150, 7, 19, 5, ['Teller', 400]),
  F('currywurst', 'Currywurst', 260, 11, 9, 20, ['Portion', 200]),
  F('salat_bowl', 'Salat-Bowl mit Hähnchen', 110, 9, 7, 5, ['Schüssel', 350]),
  F('sushi', 'Sushi (Maki)', 150, 5, 28, 2, ['Stück', 25]),
  F('omelett', 'Omelett (2 Eier)', 155, 11, 1, 12, ['Stück', 130]),
  F('porridge', 'Porridge mit Milch', 110, 4.5, 16, 3, ['Schüssel', 300]),

  // Getränke
  F('kaffee', 'Kaffee schwarz', 2, 0.1, 0, 0, ['Tasse', 200]),
  F('cappuccino', 'Cappuccino', 40, 2, 3.5, 2, ['Tasse', 200]),
  F('latte', 'Latte Macchiato', 50, 2.8, 4, 2.5, ['Glas', 300]),
  F('orangensaft', 'Orangensaft', 45, 0.7, 10, 0.2, ['Glas', 200], ['saft']),
  F('cola', 'Cola', 42, 0, 10.6, 0, ['Glas', 330]),
  F('cola_zero', 'Cola Zero', 0.3, 0, 0, 0, ['Glas', 330]),
  F('bier', 'Bier', 43, 0.5, 3.6, 0, ['Flasche', 500]),
  F('wein', 'Wein', 83, 0.1, 2.6, 0, ['Glas', 200]),
  F('smoothie', 'Smoothie', 55, 0.7, 12, 0.2, ['Flasche', 250]),
];

const norm = (s) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, '');

export { norm };

export function searchLocal(q, extra = []) {
  const n = norm(q).trim();
  if (!n) return [];
  const all = [...extra, ...FOODS];
  return all
    .map((f) => {
      const name = norm(f.name);
      const words = [name, ...(f.alias || [])];
      let score = 0;
      if (name.startsWith(n)) score = 3;
      else if (words.some((w) => w.startsWith(n))) score = 2.5;
      else if (words.some((w) => w.includes(n))) score = 1.5;
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.f.name.length - b.f.name.length)
    .slice(0, 25)
    .map((x) => x.f);
}

export const MEALS = [
  { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
  { id: 'mittag', name: 'Mittagessen', icon: '☀️' },
  { id: 'abend', name: 'Abendessen', icon: '🌙' },
  { id: 'snack', name: 'Snacks', icon: '🍎' },
];

// Meal nach Uhrzeit vorschlagen
export function mealForNow() {
  const h = new Date().getHours();
  if (h < 11) return 'fruehstueck';
  if (h < 15) return 'mittag';
  if (h < 17) return 'snack';
  return 'abend';
}
