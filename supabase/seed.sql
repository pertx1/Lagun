-- =====================================================================
-- Lagun — datos iniciales (tienda + feed)
-- =====================================================================

insert into public.shop_items (id, name, category, cost, asset_key) values
  -- colores de piel
  ('color_verde',     'Verde clásico',     'color', 0,   'color_verde'),
  ('color_turquesa',  'Turquesa Lagun',    'color', 40,  'color_turquesa'),
  ('color_lima',      'Lima',              'color', 40,  'color_lima'),
  ('color_rosa',      'Rosa chicle',       'color', 60,  'color_rosa'),
  ('color_lila',      'Lila',              'color', 60,  'color_lila'),
  ('color_dorado',    'Dorado',            'color', 120, 'color_dorado'),
  -- gorros
  ('hat_beanie',      'Gorro de lana',     'hat', 30,  'hat_beanie'),
  ('hat_cap',         'Gorra',             'hat', 30,  'hat_cap'),
  ('hat_flowers',     'Corona de flores',  'hat', 50,  'hat_flowers'),
  ('hat_headphones',  'Cascos',            'hat', 70,  'hat_headphones'),
  ('hat_crown',       'Coronita',          'hat', 150, 'hat_crown'),
  -- gafas
  ('glasses_round',   'Gafas redondas',    'glasses', 25, 'glasses_round'),
  ('glasses_sun',     'Gafas de sol',      'glasses', 40, 'glasses_sun'),
  ('glasses_heart',   'Gafas de corazón',  'glasses', 60, 'glasses_heart'),
  -- ropa
  ('outfit_scarf',    'Bufanda',           'outfit', 35, 'outfit_scarf'),
  ('outfit_bowtie',   'Pajarita',          'outfit', 30, 'outfit_bowtie'),
  ('outfit_hoodie',   'Sudadera',          'outfit', 80, 'outfit_hoodie'),
  ('outfit_cape',     'Capa de superhéroe','outfit', 120,'outfit_cape'),
  -- accesorios
  ('acc_tea',         'Taza de té',        'accessory', 20, 'acc_tea'),
  ('acc_book',        'Libro',             'accessory', 25, 'acc_book'),
  ('acc_plant',       'Plantita',          'accessory', 35, 'acc_plant'),
  ('acc_balloon',     'Globo',             'accessory', 45, 'acc_balloon'),
  -- rinconcito
  ('corner_lily',     'Nenúfar',           'corner', 0,   'corner_lily'),
  ('corner_cushion',  'Cojín blandito',    'corner', 40,  'corner_cushion'),
  ('corner_lights',   'Lucecitas',         'corner', 60,  'corner_lights'),
  ('corner_rainbow',  'Arcoíris',          'corner', 90,  'corner_rainbow'),
  ('corner_night',    'Cielo estrellado',  'corner', 110, 'corner_night')
on conflict (id) do nothing;

insert into public.feed_posts (type, area, title, body) values
  -- generales
  ('frase', 'general', 'Un día a la vez', 'No tienes que tenerlo todo resuelto hoy. Basta con el siguiente paso pequeño.'),
  ('frase', 'general', 'Tu ritmo vale', 'Descansar no es rendirse. Es parte del camino.'),
  ('frase', 'general', 'Sentir no es fallar', 'Estar mal a veces no significa que estés haciendo algo mal. Significa que eres humano/a.'),
  ('consejo', 'general', 'Respiración 4-7-8', 'Inspira por la nariz contando 4, aguanta 7, suelta por la boca en 8. Repite 3 o 4 veces. Le dice a tu cuerpo que puede bajar revoluciones.'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Nombra 5 cosas que ves, 4 que puedes tocar, 3 que oyes, 2 que hueles y 1 que saboreas. Te ayuda a volver al presente cuando la cabeza va a mil.'),
  ('consejo', 'general', 'Dormir también es autocuidado', 'Deja el móvil un rato antes de dormir y prueba a apuntar en un papel lo que te ronda. Sacarlo de la cabeza ayuda a soltarlo.'),
  ('historia', 'general', 'El día que pedí ayuda', 'Laia llevaba semanas sin ganas de nada. Pensaba que contarlo era molestar. Un día se lo dijo a su prima, casi sin querer. "No arregló todo, pero dejé de cargarlo sola", cuenta. A veces el primer paso es solo decirlo en voz alta.'),
  ('historia', 'general', 'Volver sin culpa', 'Marc dejó de hacer las cosas que le sentaban bien durante un mes. Cuando volvió, se sintió fatal por "haberlo dejado". Hasta que entendió que volver ya era cuidarse. No hay que empezar de cero: se sigue desde donde estás.'),
  -- académico
  ('consejo', 'acad', 'La técnica Pomodoro', '25 minutos de foco, 5 de descanso. Tras 4 rondas, descanso largo. Lo importante no es estudiar mucho rato, es estudiar con la cabeza fresca.'),
  ('consejo', 'acad', 'Repaso espaciado', 'Repasar un poco hoy, otro poco en 2 días y otro en una semana funciona mejor que una maratón la noche antes. Tu memoria te lo agradece.'),
  ('consejo', 'acad', 'Trocea la montaña', 'Si una tarea te agobia, divídela en pasos tan pequeños que den casi risa. "Abrir el libro" ya es un paso.'),
  ('frase', 'acad', 'Una nota no te define', 'Eres mucho más que un examen. Tu valor no cabe en un número del 0 al 10.'),
  ('historia', 'acad', 'Compararme me agotaba', 'Iker siempre miraba las notas de los demás. "Cuanto más me comparaba, peor estudiaba", dice. Empezó a apuntar solo sus pequeños avances de cada semana. Le cambió la manera de verse.'),
  ('consejo', 'acad', 'Antes del examen', 'Si notas nervios, prueba a respirar lento y a recordarte: "me he preparado lo que he podido". Los nervios también son energía para concentrarte.'),
  -- social
  ('consejo', 'soc', 'Empezar una conversación', 'Una pregunta abierta sobre algo que compartís ("¿qué te ha parecido el examen?") es una puerta fácil. No hace falta ser gracioso/a, basta con tener curiosidad.'),
  ('frase', 'soc', 'No hace falta gustar a todo el mundo', 'Las personas que de verdad son para ti te van a querer tal y como eres.'),
  ('historia', 'soc', 'Sola en el recreo', 'Nerea cambió de insti y pasó semanas sola. Se apuntó a un taller de teatro sin conocer a nadie. "Me temblaban las piernas", recuerda. Hoy dos de sus mejores amigas salieron de ahí.'),
  ('consejo', 'soc', 'Cuando la ansiedad social aprieta', 'Recuerda que la mayoría de la gente está pendiente de sí misma, no de ti. Céntrate en lo que dice la otra persona: baja el foco de tu propia cabeza.'),
  ('frase', 'soc', 'Sentirse solo/a pasa', 'Sentir soledad no dice nada malo de ti. Dice que necesitas conexión, y eso es muy humano.'),
  -- familiar
  ('consejo', 'fam', 'Mensajes "yo"', 'En vez de "nunca me escuchas", prueba "yo me siento ignorado/a cuando…". Hablar desde lo que sientes suele bajar la tensión.'),
  ('consejo', 'fam', 'Elegir el momento', 'Las conversaciones importantes van mejor cuando nadie está con prisa ni enfadado. Puedes decir: "¿podemos hablar luego de algo que me importa?".'),
  ('frase', 'fam', 'Poner límites también es querer', 'Decir "esto no me sienta bien" es cuidar la relación, no romperla.'),
  ('historia', 'fam', 'Una carta en la nevera', 'A Pablo le costaba hablar con su padre sin discutir. Un día le escribió una nota explicando cómo se sentía. "No hablamos de ello hasta dos días después, pero fue la primera conversación de verdad en meses".'),
  ('consejo', 'fam', 'Cuando en casa hay tensión', 'Busca un pequeño refugio: tu música, un paseo, un rincón tranquilo. Y recuerda que no eres responsable de arreglar los problemas de los adultos.'),
  -- identidad
  ('frase', 'iden', 'Eres válido/a', 'Quién eres y a quién quieres no necesita la aprobación de nadie para ser real.'),
  ('frase', 'iden', 'Sin prisa', 'No tienes que ponerte una etiqueta hoy, ni nunca si no quieres. Conocerte es un proceso, no un examen.'),
  ('historia', 'iden', 'Lo que me hubiera gustado oír', 'Álex tardó años en hablar de su identidad. "Me habría ayudado saber que no era la única persona sintiéndose así", dice. Hoy forma parte de un grupo de jóvenes donde se apoyan mutuamente.'),
  ('consejo', 'iden', 'Busca tu gente', 'Hay colectivos y grupos de jóvenes LGTBIQ+ donde puedes hablar con personas que entienden lo que vives. Encontrar tu sitio ayuda muchísimo.'),
  ('consejo', 'iden', 'Si temes el rechazo', 'No tienes que contárselo a nadie antes de estar preparado/a. Empieza, si quieres, por alguien de confianza que sepas que te va a cuidar.'),
  ('frase', 'iden', 'Mereces sentirte bien siendo tú', 'Tu forma de ser no es un problema que haya que resolver.');
