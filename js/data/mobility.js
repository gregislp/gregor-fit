// Mobility-Übungen (zeitbasiert) und daraus zusammengestellte Routinen.
const M = (id, name, icon, sec, side, steps, area) => ({ id, name, icon, sec, side, steps, area });

export const MOBILITY = [
  M('katze_kuh', 'Katze-Kuh', '🐈', 45, false, ['Vierfüßlerstand.', 'Einatmend Rücken durchhängen lassen, Blick nach vorne.', 'Ausatmend Rücken rund machen, Kinn zur Brust.'], 'ruecken'),
  M('kindhaltung', 'Kindhaltung', '🧎', 45, false, ['Auf die Fersen setzen.', 'Arme nach vorne lang machen, Stirn ablegen.', 'Ruhig in den Rücken atmen.'], 'ruecken'),
  M('thorax_rotation', 'Brustwirbel-Rotation (Vierfüßler)', '🔄', 40, true, ['Vierfüßlerstand, eine Hand an den Hinterkopf.', 'Ellbogen zur gegenüberliegenden Hand führen.', 'Dann weit nach oben aufdrehen.'], 'ruecken'),
  M('open_book', 'Open Book', '📖', 40, true, ['Seitlage, Knie 90° angewinkelt, Arme gestreckt vor dir.', 'Oberen Arm wie ein Buch zur anderen Seite öffnen.', 'Blick folgt der Hand.'], 'ruecken'),
  M('worlds_greatest', "World's Greatest Stretch", '🌍', 45, true, ['Großer Ausfallschritt, hinteres Knie gestreckt.', 'Gleichseitigen Ellbogen Richtung Fußinnenseite.', 'Arm nach oben aufdrehen.'], 'huefte'),
  M('hueftbeuger', 'Hüftbeuger-Dehnung kniend', '🧎', 45, true, ['Halbkniestand.', 'Becken aufrichten, Gesäß anspannen.', 'Hüfte sanft nach vorne schieben.'], 'huefte'),
  M('taube', 'Taube', '🕊', 60, true, ['Vorderes Bein angewinkelt vor dem Körper, hinteres gestreckt.', 'Oberkörper aufrecht oder nach vorne ablegen.', 'Gesäß der vorderen Seite dehnen.'], 'huefte'),
  M('90_90', '90/90 Hüftwechsel', '↔️', 45, false, ['Sitzend, beide Knie 90° zur Seite.', 'Knie langsam zur anderen Seite kippen.', 'Oberkörper aufrecht halten.'], 'huefte'),
  M('tiefe_hocke', 'Tiefe Hocke halten', '🪑', 45, false, ['Füße schulterbreit, tief in die Hocke.', 'Ellbogen drücken Knie leicht nach außen.', 'Fersen bleiben am Boden.'], 'huefte'),
  M('hamstring_dehnung', 'Beinbeuger-Dehnung', '🦵', 45, true, ['Ein Bein gestreckt auf Erhöhung.', 'Mit geradem Rücken aus der Hüfte nach vorne beugen.'], 'beine'),
  M('quad_dehnung', 'Oberschenkel-Dehnung stehend', '🦵', 40, true, ['Ferse zum Gesäß ziehen.', 'Knie zeigt nach unten, Becken aufrichten.'], 'beine'),
  M('waden_dehnung', 'Waden-Dehnung an der Wand', '🦶', 40, true, ['Hände an der Wand, ein Bein nach hinten.', 'Ferse in den Boden drücken.'], 'beine'),
  M('sprunggelenk', 'Sprunggelenk-Mobilisation', '🦶', 40, true, ['Fuß vor der Wand.', 'Knie Richtung Wand schieben, Ferse bleibt unten.'], 'beine'),
  M('arm_kreisen', 'Armkreisen', '🌀', 30, false, ['Arme gestreckt seitlich.', 'Erst kleine, dann große Kreise, Richtung wechseln.'], 'schulter'),
  M('wand_engel', 'Wall Angels', '👼', 45, false, ['Rücken an die Wand, Arme in U-Position.', 'Arme an der Wand nach oben und unten gleiten lassen.'], 'schulter'),
  M('brust_tuer', 'Brustdehnung im Türrahmen', '🚪', 40, true, ['Unterarm an den Türrahmen.', 'Oberkörper sanft wegdrehen.'], 'schulter'),
  M('schulter_quer', 'Schulter quer ziehen', '🤲', 30, true, ['Arm vor der Brust quer ziehen.', 'Schulter bleibt unten.'], 'schulter'),
  M('nacken_seite', 'Nacken seitlich dehnen', '🙆', 30, true, ['Ohr Richtung Schulter neigen.', 'Gegenüberliegende Schulter nach unten ziehen.'], 'nacken'),
  M('kinn_rueckzug', 'Kinn zurückziehen', '🙂', 30, false, ['Aufrecht sitzen.', 'Kinn gerade nach hinten schieben (Doppelkinn), 3 s halten.'], 'nacken'),
  M('handgelenk', 'Handgelenk-Kreisen & Dehnen', '✋', 40, false, ['Handgelenke kreisen.', 'Finger nach hinten ziehen, dann nach unten.'], 'arme'),
  M('cobra', 'Kobra', '🐍', 40, false, ['Bauchlage, Hände neben der Brust.', 'Oberkörper sanft aufrichten, Becken bleibt unten.'], 'ruecken'),
  M('knie_zur_brust', 'Knie zur Brust (liegend)', '🛌', 40, false, ['Rückenlage.', 'Beide Knie zur Brust ziehen und leicht wiegen.'], 'ruecken'),
  M('jefferson', 'Rücken einrollen stehend', '🙇', 40, false, ['Stehend Kinn zur Brust.', 'Wirbel für Wirbel nach unten einrollen.', 'Langsam wieder aufrollen.'], 'ruecken'),
  M('adduktoren', 'Adduktoren-Dehnung (Frosch)', '🐸', 45, false, ['Vierfüßler, Knie weit auseinander.', 'Gesäß langsam nach hinten schieben.'], 'huefte'),
];

const R = (id, name, icon, desc, items, tags = []) => ({ id, name, icon, desc, items, tags });

export const ROUTINES = [
  R('morgen', 'Morgenroutine', '🌅', 'Sanft wach werden – ganzer Körper.', ['katze_kuh', 'thorax_rotation', 'worlds_greatest', 'tiefe_hocke', 'arm_kreisen', 'kindhaltung']),
  R('schreibtisch', 'Schreibtisch-Ausgleich', '💻', 'Gegen Sitzhaltung: Hüfte, Brust, Nacken.', ['hueftbeuger', 'brust_tuer', 'kinn_rueckzug', 'nacken_seite', 'open_book', 'cobra', 'wand_engel'], ['sitzend']),
  R('huefte', 'Hüfte öffnen', '🦋', 'Mehr Beweglichkeit für Kniebeugen & Alltag.', ['90_90', 'hueftbeuger', 'taube', 'adduktoren', 'tiefe_hocke']),
  R('schulter', 'Schulter-Check', '🎯', 'Schultergesundheit für Drück- und Zugübungen.', ['arm_kreisen', 'wand_engel', 'brust_tuer', 'schulter_quer', 'thorax_rotation']),
  R('ruecken', 'Rücken entlasten', '🧘', 'Lockert den unteren Rücken.', ['katze_kuh', 'knie_zur_brust', 'kindhaltung', 'cobra', 'open_book']),
  R('cooldown', 'Cool-down nach dem Training', '❄️', 'Kurzes Dehnen nach der Einheit.', ['hamstring_dehnung', 'quad_dehnung', 'waden_dehnung', 'brust_tuer', 'kindhaltung']),
  R('beine', 'Beine & Sprunggelenk', '🦵', 'Für Läufer und tiefe Kniebeugen.', ['sprunggelenk', 'waden_dehnung', 'hamstring_dehnung', 'quad_dehnung', 'tiefe_hocke']),
];

export const findMobility = (id) => MOBILITY.find((m) => m.id === id);
export const findRoutine = (id) => ROUTINES.find((r) => r.id === id);

export function routineSeconds(r) {
  return r.items.reduce((s, id) => {
    const m = findMobility(id);
    return s + (m ? m.sec * (m.side ? 2 : 1) : 0);
  }, 0);
}

// Selbsttests (manuelle Messung statt Kamera)
export const TESTS = [
  { id: 'fba', name: 'Finger-Boden-Abstand', unit: 'cm', better: 'lower', how: 'Stehend mit gestreckten Knien nach vorne beugen. Abstand der Fingerspitzen zum Boden messen (unterhalb des Bodens = negativ).', goal: 0 },
  { id: 'knie_wand', name: 'Knie-zur-Wand (Sprunggelenk)', unit: 'cm', better: 'higher', how: 'Fuß vor der Wand, Knie berührt die Wand, Ferse bleibt am Boden. Größten Abstand Zehen–Wand messen.', goal: 10 },
  { id: 'schulter_hand', name: 'Hände hinter dem Rücken', unit: 'cm', better: 'lower', how: 'Eine Hand von oben, eine von unten hinter den Rücken. Abstand der Mittelfinger messen (Überlappung = negativ).', goal: 0 },
  { id: 'tiefe_hocke_sek', name: 'Tiefe Hocke halten', unit: 's', better: 'higher', how: 'So lange wie möglich in der tiefen Hocke bleiben, Fersen am Boden.', goal: 60 },
];
