// Übungsbibliothek. Felder:
// id, name, muscle (primär), sec (sekundär), equip (benötigt, alle), kind ('comp' Grundübung | 'iso'),
// avoid (Schmerzbereiche, bei denen die Übung nicht eingeplant wird), steps (Ausführung)

export const MUSCLES = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  quads: 'Oberschenkel vorne',
  hamstrings: 'Beinbeuger',
  gluteus: 'Gesäß',
  waden: 'Waden',
  bauch: 'Bauch',
  lowback: 'Unterer Rücken',
};

export const EQUIPMENT = {
  kg: 'Körpergewicht',
  kh: 'Kurzhanteln',
  lh: 'Langhantel',
  kb: 'Kettlebell',
  band: 'Widerstandsband',
  stange: 'Klimmzugstange',
  bank: 'Hantelbank',
  kabel: 'Kabelzug',
  maschine: 'Maschine',
};

export const MUSCLE_ICON = {
  brust: '🫁', ruecken: '🪽', schultern: '🎯', bizeps: '💪', trizeps: '🦾',
  quads: '🦵', hamstrings: '🦿', gluteus: '🍑', waden: '🦶', bauch: '🧱', lowback: '🧘',
};

// Schmerzbereiche aus dem Onboarding
export const PAIN_AREAS = {
  schulter: 'Schulter',
  ellbogen: 'Ellbogen',
  handgelenk: 'Handgelenk',
  nacken: 'Nacken',
  lowback: 'Unterer Rücken',
  huefte: 'Hüfte',
  knie: 'Knie',
  sprunggelenk: 'Sprunggelenk',
};

const E = (id, name, muscle, sec, equip, kind, avoid, steps) => ({ id, name, muscle, sec, equip, kind, avoid, steps });

export const EXERCISES = [
  // ---------- Brust ----------
  E('bankdruecken', 'Bankdrücken (Langhantel)', 'brust', ['trizeps', 'schultern'], ['lh', 'bank'], 'comp', ['schulter', 'handgelenk'], [
    'Flach auf die Bank legen, Füße fest am Boden, Schulterblätter zusammen und nach unten ziehen.',
    'Stange etwas breiter als schulterbreit greifen und aus der Ablage heben.',
    'Kontrolliert zur unteren Brust absenken, Ellbogen ca. 45° vom Körper.',
    'Kraftvoll nach oben drücken, ohne das Gesäß abzuheben.',
  ]),
  E('kh_bankdruecken', 'Kurzhantel-Bankdrücken', 'brust', ['trizeps', 'schultern'], ['kh', 'bank'], 'comp', ['schulter'], [
    'Mit den Hanteln auf den Oberschenkeln hinsetzen und in Rückenlage rollen.',
    'Hanteln über der Brust, Handflächen zeigen Richtung Füße.',
    'Langsam seitlich der Brust absenken, bis eine Dehnung spürbar ist.',
    'Hanteln in einem leichten Bogen wieder nach oben drücken.',
  ]),
  E('schraegbank_kh', 'Schrägbankdrücken (Kurzhantel)', 'brust', ['schultern', 'trizeps'], ['kh', 'bank'], 'comp', ['schulter'], [
    'Bank auf 30–45° stellen.',
    'Hanteln über der oberen Brust starten.',
    'Kontrolliert absenken, Ellbogen leicht unter Schulterhöhe.',
    'Nach oben drücken und oben die Brust anspannen.',
  ]),
  E('schraegbank_lh', 'Schrägbankdrücken (Langhantel)', 'brust', ['schultern', 'trizeps'], ['lh', 'bank'], 'comp', ['schulter', 'handgelenk'], [
    'Bank auf 30–45°, Schulterblätter zurückziehen.',
    'Stange zur oberen Brust absenken.',
    'Gerade nach oben drücken.',
  ]),
  E('liegestuetz', 'Liegestütz', 'brust', ['trizeps', 'schultern', 'bauch'], ['kg'], 'comp', ['handgelenk'], [
    'Hände etwas breiter als schulterbreit, Körper bildet eine Linie.',
    'Bauch und Gesäß anspannen.',
    'Brust bis knapp über den Boden absenken.',
    'Kraftvoll hochdrücken. Zu schwer? Knie aufsetzen oder Hände erhöht.',
  ]),
  E('liegestuetz_erhoeht', 'Liegestütz Füße erhöht', 'brust', ['schultern', 'trizeps'], ['kg'], 'comp', ['handgelenk', 'schulter'], [
    'Füße auf Stuhl oder Bank, Hände am Boden.',
    'Körper gerade halten und Brust Richtung Boden senken.',
    'Hochdrücken – trainiert besonders die obere Brust.',
  ]),
  E('dips', 'Dips', 'brust', ['trizeps', 'schultern'], ['kg'], 'comp', ['schulter', 'ellbogen'], [
    'An Barren oder zwei stabilen Stühlen abstützen.',
    'Oberkörper leicht nach vorne neigen.',
    'Absenken, bis die Oberarme etwa parallel zum Boden sind.',
    'Wieder hochdrücken.',
  ]),
  E('flys_kh', 'Fliegende (Kurzhantel)', 'brust', ['schultern'], ['kh', 'bank'], 'iso', ['schulter'], [
    'Rückenlage, Hanteln über der Brust, Arme leicht gebeugt.',
    'Arme in weitem Bogen seitlich öffnen bis zur Dehnung.',
    'Im gleichen Bogen zusammenführen.',
  ]),
  E('kabel_crossover', 'Kabel-Crossover', 'brust', ['schultern'], ['kabel'], 'iso', ['schulter'], [
    'Seilzüge oben einstellen, Schritt nach vorne.',
    'Mit leicht gebeugten Armen Griffe vor dem Körper zusammenführen.',
    'Kontrolliert zurück in die Dehnung.',
  ]),
  E('brustpresse', 'Brustpresse (Maschine)', 'brust', ['trizeps', 'schultern'], ['maschine'], 'comp', [], [
    'Sitz so einstellen, dass die Griffe auf Brusthöhe sind.',
    'Griffe nach vorne drücken, ohne die Ellbogen ganz zu blockieren.',
    'Langsam zurückführen.',
  ]),
  E('band_brustpresse', 'Brustpresse mit Band', 'brust', ['trizeps'], ['band'], 'comp', [], [
    'Band hinter dem Rücken auf Brusthöhe führen.',
    'Arme nach vorne strecken und Brust anspannen.',
    'Langsam zurück.',
  ]),
  E('butterfly', 'Butterfly (Maschine)', 'brust', [], ['maschine'], 'iso', ['schulter'], [
    'Sitz einstellen, Unterarme oder Hände an die Polster.',
    'Arme vor der Brust zusammenführen.',
    'Kontrolliert öffnen.',
  ]),

  // ---------- Rücken ----------
  E('klimmzug', 'Klimmzug', 'ruecken', ['bizeps'], ['stange'], 'comp', ['schulter', 'ellbogen'], [
    'Stange etwas breiter als schulterbreit im Obergriff fassen.',
    'Schulterblätter nach unten ziehen.',
    'Kinn über die Stange ziehen.',
    'Kontrolliert bis zur fast gestreckten Position ablassen.',
  ]),
  E('chinup', 'Klimmzug Untergriff', 'ruecken', ['bizeps'], ['stange'], 'comp', ['ellbogen'], [
    'Schulterbreit im Untergriff greifen.',
    'Brust zur Stange ziehen.',
    'Langsam ablassen.',
  ]),
  E('negativ_klimmzug', 'Negative Klimmzüge', 'ruecken', ['bizeps'], ['stange'], 'comp', ['schulter'], [
    'Mit Sprung oder Stuhl in die obere Position.',
    'In 3–5 Sekunden langsam ablassen.',
    'Ideal, um den ersten Klimmzug zu schaffen.',
  ]),
  E('latzug', 'Latzug', 'ruecken', ['bizeps'], ['kabel'], 'comp', ['schulter'], [
    'Knie unter die Polster, Stange breit greifen.',
    'Stange zur oberen Brust ziehen, Brust raus.',
    'Kontrolliert nach oben führen.',
  ]),
  E('kabelrudern', 'Rudern am Kabel (sitzend)', 'ruecken', ['bizeps'], ['kabel'], 'comp', [], [
    'Aufrecht sitzen, Füße an die Plattform.',
    'Griff zum Bauch ziehen, Schulterblätter zusammen.',
    'Langsam nach vorne, Rücken bleibt gerade.',
  ]),
  E('lh_rudern', 'Langhantelrudern', 'ruecken', ['bizeps', 'lowback'], ['lh'], 'comp', ['lowback'], [
    'Hüftbreit stehen, Oberkörper ca. 45° vorgebeugt, Rücken gerade.',
    'Stange zum Bauchnabel ziehen.',
    'Kontrolliert absenken.',
  ]),
  E('kh_rudern', 'Einarmiges Kurzhantelrudern', 'ruecken', ['bizeps'], ['kh'], 'comp', [], [
    'Eine Hand und ein Knie auf Bank oder Stuhl stützen.',
    'Hantel Richtung Hüfte ziehen, Ellbogen nah am Körper.',
    'Langsam ablassen, Seite wechseln.',
  ]),
  E('band_rudern', 'Rudern mit Band', 'ruecken', ['bizeps'], ['band'], 'comp', [], [
    'Band an Tür oder um die Füße befestigen.',
    'Enden zum Bauch ziehen, Schulterblätter zusammen.',
    'Kontrolliert zurück.',
  ]),
  E('tischrudern', 'Rudern am Tisch (umgekehrt)', 'ruecken', ['bizeps'], ['kg'], 'comp', [], [
    'Unter einen stabilen Tisch legen, Kante greifen.',
    'Körper gerade, Brust zur Tischkante ziehen.',
    'Langsam ablassen.',
  ]),
  E('kb_rudern', 'Kettlebell-Rudern', 'ruecken', ['bizeps'], ['kb'], 'comp', [], [
    'Vorgebeugt stehen, Kettlebell in einer Hand.',
    'Zur Hüfte ziehen.',
    'Langsam ablassen, Seite wechseln.',
  ]),
  E('ruderzug_maschine', 'Rudermaschine (Brustgestützt)', 'ruecken', ['bizeps'], ['maschine'], 'comp', [], [
    'Brust ans Polster, Griffe fassen.',
    'Griffe zum Körper ziehen.',
    'Langsam zurück.',
  ]),
  E('face_pull', 'Face Pulls', 'schultern', ['ruecken'], ['kabel'], 'iso', [], [
    'Seil auf Augenhöhe einstellen.',
    'Seil zum Gesicht ziehen, Hände auseinander, Ellbogen hoch.',
    'Langsam zurück – gut für die Schultergesundheit.',
  ]),
  E('band_pull_apart', 'Band Pull-Aparts', 'schultern', ['ruecken'], ['band'], 'iso', [], [
    'Band schulterbreit vor der Brust halten.',
    'Arme seitlich auseinanderziehen, bis das Band die Brust berührt.',
    'Kontrolliert zurück.',
  ]),
  E('superman', 'Superman', 'lowback', ['gluteus'], ['kg'], 'iso', [], [
    'Bauchlage, Arme nach vorne gestreckt.',
    'Arme, Brust und Beine gleichzeitig leicht anheben.',
    '2 Sekunden halten und ablegen.',
  ]),
  E('hyperextension', 'Hyperextensions', 'lowback', ['gluteus', 'hamstrings'], ['maschine'], 'iso', ['lowback'], [
    'Hüfte an das Polster, Füße fixiert.',
    'Oberkörper kontrolliert absenken.',
    'Bis zur geraden Linie aufrichten, nicht überstrecken.',
  ]),

  // ---------- Schultern ----------
  E('ohp', 'Schulterdrücken stehend (Langhantel)', 'schultern', ['trizeps', 'bauch'], ['lh'], 'comp', ['schulter', 'lowback'], [
    'Stange auf Höhe der Schlüsselbeine, schulterbreit greifen.',
    'Bauch und Gesäß anspannen.',
    'Stange senkrecht über den Kopf drücken.',
    'Kontrolliert zurück zur Brust.',
  ]),
  E('kh_schulterdruecken', 'Kurzhantel-Schulterdrücken', 'schultern', ['trizeps'], ['kh'], 'comp', ['schulter'], [
    'Sitzend oder stehend, Hanteln auf Schulterhöhe.',
    'Über den Kopf drücken, ohne ins Hohlkreuz zu gehen.',
    'Langsam absenken.',
  ]),
  E('pike_pushup', 'Pike-Liegestütz', 'schultern', ['trizeps'], ['kg'], 'comp', ['schulter', 'handgelenk'], [
    'Aus dem Liegestütz Hüfte hoch schieben (umgedrehtes V).',
    'Kopf Richtung Boden zwischen die Hände senken.',
    'Wieder hochdrücken.',
  ]),
  E('seitheben', 'Seitheben', 'schultern', [], ['kh'], 'iso', ['schulter'], [
    'Stehend, Hanteln seitlich, Arme leicht gebeugt.',
    'Arme seitlich bis Schulterhöhe heben.',
    'Langsam senken – Schwung vermeiden.',
  ]),
  E('band_seitheben', 'Seitheben mit Band', 'schultern', [], ['band'], 'iso', ['schulter'], [
    'Auf das Band stellen, Enden seitlich halten.',
    'Arme bis Schulterhöhe heben.',
    'Kontrolliert senken.',
  ]),
  E('kabel_seitheben', 'Seitheben am Kabel', 'schultern', [], ['kabel'], 'iso', ['schulter'], [
    'Kabel unten, Griff mit der entfernten Hand.',
    'Arm seitlich bis Schulterhöhe führen.',
    'Langsam zurück.',
  ]),
  E('reverse_flys', 'Reverse Flys', 'schultern', ['ruecken'], ['kh'], 'iso', [], [
    'Vorgebeugt, Rücken gerade, Hanteln hängen.',
    'Arme seitlich nach oben öffnen.',
    'Schulterblätter zusammen, langsam senken.',
  ]),
  E('schulterpresse', 'Schulterpresse (Maschine)', 'schultern', ['trizeps'], ['maschine'], 'comp', ['schulter'], [
    'Sitz so einstellen, dass die Griffe auf Schulterhöhe sind.',
    'Nach oben drücken.',
    'Kontrolliert zurück.',
  ]),
  E('kb_press', 'Kettlebell-Press', 'schultern', ['trizeps'], ['kb'], 'comp', ['schulter'], [
    'Kettlebell in Rack-Position an der Schulter.',
    'Senkrecht über den Kopf drücken.',
    'Langsam zurück in die Rack-Position.',
  ]),

  // ---------- Arme ----------
  E('kh_curl', 'Bizepscurls (Kurzhantel)', 'bizeps', [], ['kh'], 'iso', ['ellbogen'], [
    'Stehend, Hanteln seitlich, Handflächen nach vorne.',
    'Unterarme beugen, Ellbogen bleiben am Körper.',
    'Langsam strecken.',
  ]),
  E('hammer_curl', 'Hammercurls', 'bizeps', [], ['kh'], 'iso', ['ellbogen'], [
    'Hanteln mit neutralem Griff (Daumen oben).',
    'Hochbeugen, Ellbogen fixiert.',
    'Kontrolliert senken.',
  ]),
  E('lh_curl', 'Langhantel-Curls', 'bizeps', [], ['lh'], 'iso', ['ellbogen', 'handgelenk'], [
    'Schulterbreit im Untergriff.',
    'Stange zur Brust curlen, ohne Schwung.',
    'Langsam ablassen.',
  ]),
  E('band_curl', 'Bizepscurls mit Band', 'bizeps', [], ['band'], 'iso', [], [
    'Auf das Band stellen, Enden im Untergriff.',
    'Hochbeugen, Ellbogen am Körper.',
    'Langsam zurück.',
  ]),
  E('kabel_curl', 'Kabel-Curls', 'bizeps', [], ['kabel'], 'iso', [], [
    'Kabel unten, Stange im Untergriff.',
    'Hochcurlen.',
    'Kontrolliert senken.',
  ]),
  E('trizeps_pushdown', 'Trizepsdrücken am Kabel', 'trizeps', [], ['kabel'], 'iso', ['ellbogen'], [
    'Kabel oben, Seil oder Stange greifen.',
    'Ellbogen am Körper, Unterarme nach unten strecken.',
    'Langsam zurück bis 90°.',
  ]),
  E('ueberkopf_trizeps', 'Überkopf-Trizepsstrecken', 'trizeps', [], ['kh'], 'iso', ['ellbogen', 'schulter'], [
    'Eine Hantel mit beiden Händen über dem Kopf.',
    'Hinter den Kopf absenken, Ellbogen zeigen nach oben.',
    'Wieder strecken.',
  ]),
  E('enge_liegestuetz', 'Enge Liegestütz', 'trizeps', ['brust'], ['kg'], 'comp', ['handgelenk', 'ellbogen'], [
    'Hände unter den Schultern oder enger.',
    'Ellbogen eng am Körper absenken.',
    'Hochdrücken.',
  ]),
  E('bankdips', 'Dips an der Bank', 'trizeps', ['schultern'], ['kg'], 'iso', ['schulter', 'handgelenk'], [
    'Hände hinter dem Körper auf Bank oder Stuhl.',
    'Mit gebeugten Ellbogen Körper absenken.',
    'Wieder hochdrücken.',
  ]),
  E('band_trizeps', 'Trizepsstrecken mit Band', 'trizeps', [], ['band'], 'iso', [], [
    'Band oben befestigen.',
    'Unterarme nach unten strecken.',
    'Langsam zurück.',
  ]),
  E('enges_bankdruecken', 'Enges Bankdrücken', 'trizeps', ['brust'], ['lh', 'bank'], 'comp', ['handgelenk', 'ellbogen'], [
    'Schulterbreit greifen.',
    'Stange mit eng geführten Ellbogen zur unteren Brust.',
    'Hochdrücken.',
  ]),

  // ---------- Beine ----------
  E('kniebeuge', 'Kniebeuge (Langhantel)', 'quads', ['gluteus', 'hamstrings', 'lowback'], ['lh'], 'comp', ['knie', 'lowback', 'huefte'], [
    'Stange auf dem oberen Rücken, Füße schulterbreit, Zehen leicht nach außen.',
    'Tief einatmen, Bauch fest.',
    'Hüfte nach hinten unten, Knie folgen den Zehen.',
    'Mindestens bis Oberschenkel parallel, dann kraftvoll hoch.',
  ]),
  E('goblet_squat', 'Goblet Squat', 'quads', ['gluteus'], ['kh'], 'comp', ['knie'], [
    'Hantel oder Kettlebell vor der Brust halten.',
    'Tief in die Hocke, Oberkörper aufrecht.',
    'Über die Fersen hochdrücken.',
  ]),
  E('kb_goblet', 'Goblet Squat (Kettlebell)', 'quads', ['gluteus'], ['kb'], 'comp', ['knie'], [
    'Kettlebell an den Hörnern vor der Brust.',
    'Tief in die Hocke.',
    'Hochdrücken.',
  ]),
  E('squat_kg', 'Kniebeuge (Körpergewicht)', 'quads', ['gluteus'], ['kg'], 'comp', ['knie'], [
    'Füße schulterbreit, Arme nach vorne.',
    'Hüfte nach hinten und tief absenken.',
    'Über die Fersen hochdrücken.',
  ]),
  E('bulgarian', 'Bulgarian Split Squat', 'quads', ['gluteus'], ['kg'], 'comp', ['knie', 'huefte'], [
    'Hinteren Fuß auf Bank oder Stuhl.',
    'Vorderes Knie beugen, bis das hintere Knie fast den Boden berührt.',
    'Über die vordere Ferse hochdrücken. Mit Hanteln schwerer.',
  ]),
  E('ausfallschritt', 'Ausfallschritte', 'quads', ['gluteus', 'hamstrings'], ['kg'], 'comp', ['knie'], [
    'Großer Schritt nach vorne.',
    'Beide Knie beugen bis ca. 90°.',
    'Zurückdrücken, Bein wechseln.',
  ]),
  E('kh_ausfallschritt', 'Ausfallschritte mit Kurzhanteln', 'quads', ['gluteus'], ['kh'], 'comp', ['knie'], [
    'Hanteln seitlich halten.',
    'Schritt nach vorne und tief absenken.',
    'Zurückdrücken, Bein wechseln.',
  ]),
  E('beinpresse', 'Beinpresse', 'quads', ['gluteus'], ['maschine'], 'comp', ['knie'], [
    'Füße schulterbreit auf der Plattform.',
    'Knie kontrolliert Richtung Brust beugen.',
    'Wegdrücken, ohne die Knie zu blockieren.',
  ]),
  E('beinstrecker', 'Beinstrecker', 'quads', [], ['maschine'], 'iso', ['knie'], [
    'Rücken an die Lehne, Polster über den Knöcheln.',
    'Beine strecken und kurz halten.',
    'Langsam senken.',
  ]),
  E('step_up', 'Step-Ups', 'quads', ['gluteus'], ['kg'], 'comp', ['knie'], [
    'Vor eine stabile Erhöhung stellen.',
    'Mit einem Fuß aufsteigen und ganz aufrichten.',
    'Kontrolliert absteigen.',
  ]),
  E('wandsitzen', 'Wandsitzen', 'quads', [], ['kg'], 'iso', ['knie'], [
    'Rücken an die Wand, Knie 90°.',
    'Position für die angegebenen Sekunden halten.',
  ]),
  E('kreuzheben', 'Kreuzheben', 'hamstrings', ['gluteus', 'lowback', 'ruecken'], ['lh'], 'comp', ['lowback', 'huefte'], [
    'Füße hüftbreit, Stange über der Fußmitte.',
    'Hüfte nach hinten, Stange greifen, Rücken gerade.',
    'Stange nah am Körper durch Strecken von Hüfte und Knien heben.',
    'Kontrolliert absenken.',
  ]),
  E('rdl', 'Rumänisches Kreuzheben (Langhantel)', 'hamstrings', ['gluteus', 'lowback'], ['lh'], 'comp', ['lowback'], [
    'Aufrecht mit der Stange vor den Oberschenkeln.',
    'Knie leicht gebeugt, Hüfte weit nach hinten schieben.',
    'Bis zur Dehnung in den Beinbeugern absenken, Rücken gerade.',
    'Hüfte nach vorne strecken.',
  ]),
  E('kh_rdl', 'Rumänisches Kreuzheben (Kurzhantel)', 'hamstrings', ['gluteus'], ['kh'], 'comp', ['lowback'], [
    'Hanteln vor den Oberschenkeln.',
    'Hüfte nach hinten, Rücken gerade.',
    'Aufrichten über die Hüfte.',
  ]),
  E('kb_swing', 'Kettlebell Swing', 'gluteus', ['hamstrings', 'lowback'], ['kb'], 'comp', ['lowback'], [
    'Füße etwas breiter als hüftbreit, Kettlebell vor dir.',
    'Zwischen die Beine schwingen, Hüfte nach hinten.',
    'Hüfte explosiv strecken, Kettlebell bis Brusthöhe schwingen lassen.',
  ]),
  E('beinbeuger_maschine', 'Beinbeuger (Maschine)', 'hamstrings', [], ['maschine'], 'iso', ['knie'], [
    'Polster über den Fersen.',
    'Fersen Richtung Gesäß ziehen.',
    'Langsam zurück.',
  ]),
  E('nordic_curl', 'Nordic Curls (Negativ)', 'hamstrings', [], ['kg'], 'iso', ['knie'], [
    'Kniend, Fersen unter Sofa oder von Partner fixiert.',
    'Oberkörper langsam nach vorne sinken lassen.',
    'Mit den Händen abfangen und zurückdrücken.',
  ]),
  E('einbein_rdl', 'Einbeiniges Kreuzheben', 'hamstrings', ['gluteus'], ['kg'], 'comp', ['huefte'], [
    'Auf einem Bein stehen.',
    'Oberkörper nach vorne, freies Bein nach hinten strecken.',
    'Zurück zum Stand.',
  ]),
  E('hip_thrust', 'Hip Thrust', 'gluteus', ['hamstrings'], ['lh', 'bank'], 'comp', ['huefte'], [
    'Oberer Rücken an der Bank, Stange auf der Hüfte (mit Polster).',
    'Hüfte nach oben strecken, bis der Körper eine Linie bildet.',
    'Oben Gesäß anspannen, langsam senken.',
  ]),
  E('glute_bridge', 'Glute Bridge', 'gluteus', ['hamstrings'], ['kg'], 'iso', [], [
    'Rückenlage, Füße aufgestellt.',
    'Hüfte hochdrücken, Gesäß anspannen.',
    'Langsam ablegen. Einbeinig schwerer.',
  ]),
  E('kh_hip_thrust', 'Hip Thrust (Kurzhantel)', 'gluteus', ['hamstrings'], ['kh'], 'comp', [], [
    'Oberer Rücken an Sofa oder Bank, Hantel auf der Hüfte.',
    'Hüfte hochdrücken.',
    'Langsam senken.',
  ]),
  E('band_abduktion', 'Abduktion mit Band', 'gluteus', [], ['band'], 'iso', [], [
    'Miniband über den Knien.',
    'In leichter Hocke seitlich gehen oder Knie nach außen drücken.',
  ]),
  E('abduktor_maschine', 'Abduktoren (Maschine)', 'gluteus', [], ['maschine'], 'iso', [], [
    'Polster außen an den Knien.',
    'Beine nach außen drücken.',
    'Langsam zurück.',
  ]),
  E('wadenheben', 'Wadenheben', 'waden', [], ['kg'], 'iso', ['sprunggelenk'], [
    'Ballen auf einer Stufe, Fersen frei.',
    'Fersen so hoch wie möglich heben.',
    'Langsam unter Stufenhöhe absenken.',
  ]),
  E('kh_wadenheben', 'Wadenheben mit Kurzhantel', 'waden', [], ['kh'], 'iso', ['sprunggelenk'], [
    'Hantel in der Hand, Ballen auf einer Stufe.',
    'Fersen heben und senken.',
  ]),
  E('wadenmaschine', 'Wadenheben (Maschine)', 'waden', [], ['maschine'], 'iso', ['sprunggelenk'], [
    'Schultern unter die Polster.',
    'Fersen heben, kurz halten, absenken.',
  ]),

  // ---------- Bauch ----------
  E('plank', 'Unterarmstütz (Plank)', 'bauch', ['schultern'], ['kg'], 'iso', [], [
    'Auf Unterarmen und Zehen, Körper gerade.',
    'Bauch und Gesäß anspannen.',
    'Position für die angegebenen Sekunden halten.',
  ]),
  E('seitstuetz', 'Seitstütz', 'bauch', [], ['kg'], 'iso', ['schulter'], [
    'Seitlich auf einem Unterarm, Körper gerade.',
    'Hüfte oben halten, Seite wechseln.',
  ]),
  E('crunch', 'Crunches', 'bauch', [], ['kg'], 'iso', ['nacken'], [
    'Rückenlage, Füße aufgestellt.',
    'Schultern vom Boden heben, Bauch einrollen.',
    'Langsam ablegen.',
  ]),
  E('beinheben', 'Beinheben liegend', 'bauch', [], ['kg'], 'iso', ['lowback'], [
    'Rückenlage, Hände unter dem Gesäß.',
    'Gestreckte Beine bis 90° heben.',
    'Langsam senken, ohne den Boden zu berühren.',
  ]),
  E('haengendes_beinheben', 'Hängendes Beinheben', 'bauch', [], ['stange'], 'iso', ['schulter'], [
    'An der Stange hängen.',
    'Knie oder gestreckte Beine nach oben ziehen.',
    'Kontrolliert senken, kein Schwung.',
  ]),
  E('dead_bug', 'Dead Bug', 'bauch', [], ['kg'], 'iso', [], [
    'Rückenlage, Arme nach oben, Knie 90°.',
    'Gegenüberliegenden Arm und Bein strecken, unterer Rücken bleibt am Boden.',
    'Seite wechseln.',
  ]),
  E('mountain_climber', 'Mountain Climbers', 'bauch', ['schultern'], ['kg'], 'iso', ['handgelenk'], [
    'Liegestützposition.',
    'Knie abwechselnd schnell zur Brust ziehen.',
  ]),
  E('russian_twist', 'Russian Twist', 'bauch', [], ['kg'], 'iso', ['lowback'], [
    'Sitzend, Oberkörper leicht zurück, Füße angehoben.',
    'Oberkörper abwechselnd nach links und rechts drehen.',
  ]),
  E('kabel_crunch', 'Kabel-Crunch', 'bauch', [], ['kabel'], 'iso', [], [
    'Kniend vor dem Kabelzug, Seil am Kopf.',
    'Oberkörper einrollen, Ellbogen Richtung Knie.',
    'Langsam zurück.',
  ]),
  E('pallof', 'Pallof Press', 'bauch', [], ['band'], 'iso', [], [
    'Band seitlich auf Brusthöhe befestigen.',
    'Griff vor der Brust nach vorne drücken, ohne sich zu drehen.',
    'Zurückführen, Seite wechseln.',
  ]),
  E('ab_wheel', 'Ab-Roller', 'bauch', ['schultern'], ['kg'], 'iso', ['lowback', 'schulter'], [
    'Kniend, Roller vor dir.',
    'Langsam nach vorne rollen, Bauch fest.',
    'Mit der Bauchmuskulatur zurückziehen.',
  ]),
];

// Halteübungen: "Wiederholungen" bedeuten hier Sekunden.
export const TIMED = new Set(['plank', 'seitstuetz', 'wandsitzen']);

const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Sucht auch in eigenen Übungen des Nutzers.
export function findExercise(id, custom = []) {
  return BY_ID[id] || custom.find((e) => e.id === id) || null;
}

// Gewichtssteigerung je Equipment
export function increment(ex) {
  if (!ex) return 2.5;
  if (ex.equip.includes('lh')) return ex.kind === 'comp' ? 2.5 : 1.25;
  if (ex.equip.includes('kh')) return 1;
  if (ex.equip.includes('kb')) return 4;
  if (ex.equip.includes('kabel') || ex.equip.includes('maschine')) return 2.5;
  return 0; // Körpergewicht/Band: Wiederholungen steigern
}

export const isBodyweight = (ex) => ex && increment(ex) === 0;
