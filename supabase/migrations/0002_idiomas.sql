-- =====================================================================
-- Lagun — idiomas (castellano, català, euskara, galego, English)
-- Ejecutar DESPUÉS de 0001_schema.sql y seed.sql.
-- =====================================================================

-- Idioma de la persona
alter table public.profiles
  add column if not exists locale text not null default 'es'
  check (locale in ('es', 'ca', 'eu', 'gl', 'en'));
grant update (locale) on public.profiles to authenticated;

-- Idioma de cada post del feed (los existentes son en castellano)
alter table public.feed_posts
  add column if not exists lang text not null default 'es'
  check (lang in ('es', 'ca', 'eu', 'gl', 'en'));
create index if not exists feed_posts_lang_area_idx on public.feed_posts (lang, area);

-- El registro guarda el idioma elegido en la portada
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_consent  boolean;
  v_tz       text;
  v_locale   text;
begin
  v_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_consent  := coalesce((new.raw_user_meta_data ->> 'age_consent')::boolean, false);
  v_tz       := coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Europe/Madrid');
  v_locale   := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'es');
  if v_locale not in ('es', 'ca', 'eu', 'gl', 'en') then
    v_locale := 'es';
  end if;

  if v_username is null or v_username !~ '^[a-z0-9_.]{3,20}$' then
    raise exception 'Nombre de usuario no válido';
  end if;
  if not v_consent then
    raise exception 'Hace falta confirmar la edad o el permiso de madre, padre o tutor/a';
  end if;

  insert into public.profiles (id, username, display_name, age_consent, timezone, locale)
  values (new.id, v_username, v_username, v_consent, v_tz, v_locale);

  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Feed traducido (català, euskara, galego, English)
-- ---------------------------------------------------------------------
insert into public.feed_posts (type, area, title, body, lang) values
  ('frase', 'general', 'Un dia cada vegada', 'No ho has de tenir tot resolt avui. N''hi ha prou amb la següent passa petita.', 'ca'),
  ('frase', 'general', 'El teu ritme compta', 'Descansar no és rendir-se. És part del camí.', 'ca'),
  ('frase', 'general', 'Sentir no és fallar', 'Estar malament de vegades no vol dir que facis res malament. Vol dir que ets humà/ana.', 'ca'),
  ('consejo', 'general', 'Respiració 4-7-8', 'Inspira pel nas comptant 4, aguanta 7, deixa anar per la boca en 8. Repeteix-ho 3 o 4 vegades. Li diu al teu cos que pot abaixar revolucions.', 'ca'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Anomena 5 coses que veus, 4 que pots tocar, 3 que sents, 2 que olores i 1 que tastes. T''ajuda a tornar al present quan el cap va a mil.', 'ca'),
  ('consejo', 'general', 'Dormir també és autocura', 'Deixa el mòbil una estona abans de dormir i prova d''apuntar en un paper el que et volta pel cap. Treure-ho del cap ajuda a deixar-ho anar.', 'ca'),
  ('historia', 'general', 'El dia que vaig demanar ajuda', 'La Laia feia setmanes que no tenia ganes de res. Pensava que explicar-ho era molestar. Un dia ho va dir a la seva cosina, gairebé sense voler. «No ho va arreglar tot, però vaig deixar de carregar-ho sola», explica. A vegades la primera passa és només dir-ho en veu alta.', 'ca'),
  ('historia', 'general', 'Tornar sense culpa', 'En Marc va deixar de fer les coses que li anaven bé durant un mes. Quan hi va tornar, se sentia fatal per «haver-ho deixat». Fins que va entendre que tornar ja era cuidar-se. No cal començar de zero: se segueix des d''on ets.', 'ca'),
  ('consejo', 'acad', 'La tècnica Pomodoro', '25 minuts de focus, 5 de descans. Després de 4 rondes, descans llarg. L''important no és estudiar molta estona, és estudiar amb el cap fresc.', 'ca'),
  ('consejo', 'acad', 'Repàs espaiat', 'Repassar una mica avui, una altra mica d''aquí a 2 dies i una altra d''aquí a una setmana funciona millor que una marató la nit abans. La teva memòria t''ho agrairà.', 'ca'),
  ('consejo', 'acad', 'Divideix la muntanya', 'Si una tasca t''angoixa, divideix-la en passos tan petits que gairebé facin riure. «Obrir el llibre» ja és un pas.', 'ca'),
  ('frase', 'acad', 'Una nota no et defineix', 'Ets molt més que un examen. El teu valor no cap en un número del 0 al 10.', 'ca'),
  ('historia', 'acad', 'Comparar-me m''esgotava', 'L''Iker sempre mirava les notes dels altres. «Com més em comparava, pitjor estudiava», diu. Va començar a apuntar només els seus petits avenços de cada setmana. Li va canviar la manera de veure''s.', 'ca'),
  ('consejo', 'acad', 'Abans de l''examen', 'Si notes nervis, prova de respirar a poc a poc i recordar-te: «m''he preparat el que he pogut». Els nervis també són energia per concentrar-te.', 'ca'),
  ('consejo', 'soc', 'Començar una conversa', 'Una pregunta oberta sobre alguna cosa que compartiu («què t''ha semblat l''examen?») és una porta fàcil. No cal ser graciós/osa, n''hi ha prou amb tenir curiositat.', 'ca'),
  ('frase', 'soc', 'No cal agradar a tothom', 'Les persones que de veritat són per a tu t''estimaran tal com ets.', 'ca'),
  ('historia', 'soc', 'Sola al pati', 'La Nerea va canviar d''institut i va passar setmanes sola. Es va apuntar a un taller de teatre sense conèixer ningú. «Em tremolaven les cames», recorda. Avui dues de les seves millors amigues van sortir d''allà.', 'ca'),
  ('consejo', 'soc', 'Quan l''ansietat social estreny', 'Recorda que la majoria de la gent està pendent de si mateixa, no de tu. Centra''t en el que diu l''altra persona: abaixa el focus del teu propi cap.', 'ca'),
  ('frase', 'soc', 'Sentir-se sol/a passa', 'Sentir soledat no diu res dolent de tu. Diu que necessites connexió, i això és molt humà.', 'ca'),
  ('consejo', 'fam', 'Missatges «jo»', 'En lloc de «mai m''escoltes», prova «jo em sento ignorat/da quan…». Parlar des del que sents sol rebaixar la tensió.', 'ca'),
  ('consejo', 'fam', 'Triar el moment', 'Les converses importants van millor quan ningú té pressa ni està enfadat. Pots dir: «en podem parlar després? És una cosa que m''importa».', 'ca'),
  ('frase', 'fam', 'Posar límits també és estimar', 'Dir «això no em fa sentir bé» és cuidar la relació, no trencar-la.', 'ca'),
  ('historia', 'fam', 'Una carta a la nevera', 'Al Pablo li costava parlar amb el seu pare sense discutir. Un dia li va escriure una nota explicant com se sentia. «No en vam parlar fins dos dies després, però va ser la primera conversa de veritat en mesos».', 'ca'),
  ('consejo', 'fam', 'Quan a casa hi ha tensió', 'Busca un petit refugi: la teva música, un passeig, un racó tranquil. I recorda que no ets responsable d''arreglar els problemes dels adults.', 'ca'),
  ('frase', 'iden', 'Ets vàlid/a', 'Qui ets i a qui estimes no necessita l''aprovació de ningú per ser real.', 'ca'),
  ('frase', 'iden', 'Sense pressa', 'No t''has de posar cap etiqueta avui, ni mai si no vols. Conèixer-te és un procés, no un examen.', 'ca'),
  ('historia', 'iden', 'El que m''hauria agradat sentir', 'L''Àlex va trigar anys a parlar de la seva identitat. «M''hauria ajudat saber que no era l''única persona que se sentia així», diu. Avui forma part d''un grup de joves on es donen suport mútuament.', 'ca'),
  ('consejo', 'iden', 'Busca la teva gent', 'Hi ha col·lectius i grups de joves LGTBIQ+ on pots parlar amb persones que entenen el que vius. Trobar el teu lloc ajuda moltíssim.', 'ca'),
  ('consejo', 'iden', 'Si tens por del rebuig', 'No ho has d''explicar a ningú abans d''estar preparat/da. Comença, si vols, per algú de confiança que sàpigues que et cuidarà.', 'ca'),
  ('frase', 'iden', 'Mereixes sentir-te bé sent tu', 'La teva manera de ser no és un problema que s''hagi de resoldre.', 'ca'),
  ('frase', 'general', 'Egun bat aldi bakoitzean', 'Ez duzu gaur dena konponduta izan behar. Hurrengo pauso txikia nahikoa da.', 'eu'),
  ('frase', 'general', 'Zure erritmoak balio du', 'Atseden hartzea ez da amore ematea. Bidearen parte da.', 'eu'),
  ('frase', 'general', 'Sentitzea ez da huts egitea', 'Batzuetan gaizki egoteak ez du esan nahi zerbait gaizki egiten ari zarenik. Gizakia zarela esan nahi du.', 'eu'),
  ('consejo', 'general', '4-7-8 arnasketa', 'Hartu arnasa sudurretik 4ra arte zenbatuz, eutsi 7, bota ahotik 8an. Errepikatu 3 edo 4 aldiz. Zure gorputzari esaten dio abiadura jaits dezakeela.', 'eu'),
  ('consejo', 'general', '5-4-3-2-1 grounding', 'Esan ikusten dituzun 5 gauza, uki ditzakezun 4, entzuten dituzun 3, usaintzen dituzun 2 eta dastatzen duzun 1. Orainaldira itzultzen laguntzen dizu burua milaka doanean.', 'eu'),
  ('consejo', 'general', 'Lo egitea ere norbera zaintzea da', 'Utzi mugikorra pixka batean lo egin aurretik eta saiatu paper batean idazten buruan duzuna. Burutik ateratzeak askatzen laguntzen du.', 'eu'),
  ('historia', 'general', 'Laguntza eskatu nuen eguna', 'Laiak asteak zeramatzan ezer egiteko gogorik gabe. Kontatzea molestatzea zela uste zuen. Egun batean bere lehengusinari esan zion, ia nahi gabe. «Ez zuen dena konpondu, baina bakarrik eramateari utzi nion», kontatzen du. Batzuetan lehen pausoa ozen esatea besterik ez da.', 'eu'),
  ('historia', 'general', 'Errurik gabe itzultzea', 'Marcek hilabete batez utzi zion ondo sentiarazten zioten gauzak egiteari. Itzuli zenean, oso gaizki sentitu zen «utzi izanagatik». Itzultzea bera bere burua zaintzea zela ulertu zuen arte. Ez da zerotik hasi behar: zauden lekutik jarraitzen da.', 'eu'),
  ('consejo', 'acad', 'Pomodoro teknika', '25 minutu arreta, 5 atseden. 4 txandaren ondoren, atseden luzea. Garrantzitsuena ez da denbora luzez ikastea, burua fresko duzula ikastea baizik.', 'eu'),
  ('consejo', 'acad', 'Errepaso tartekatua', 'Gaur pixka bat errepasatzeak, 2 egun barru beste pixka batek eta astebete barru beste batek hobeto funtzionatzen dute aurreko gaueko maratoi batek baino. Zure memoriak eskertuko dizu.', 'eu'),
  ('consejo', 'acad', 'Zatitu mendia', 'Zeregin batek larritzen bazaitu, zatitu barre eragiteko moduko pauso txikitan. «Liburua ireki» dagoeneko pauso bat da.', 'eu'),
  ('frase', 'acad', 'Nota batek ez zaitu definitzen', 'Azterketa bat baino askoz gehiago zara. Zure balioa ez da sartzen 0tik 10erako zenbaki batean.', 'eu'),
  ('historia', 'acad', 'Konparatzeak nekatu egiten ninduen', 'Ikerrek beti begiratzen zituen besteen notak. «Zenbat eta gehiago konparatu, orduan eta okerrago ikasten nuen», dio. Astero bere aurrerapen txikiak bakarrik idazten hasi zen. Bere burua ikusteko modua aldatu zion.', 'eu'),
  ('consejo', 'acad', 'Azterketaren aurretik', 'Urduri bazaude, saiatu poliki arnasa hartzen eta zeure buruari gogorarazten: «ahal izan dudana prestatu dut». Urduritasuna ere kontzentratzeko energia da.', 'eu'),
  ('consejo', 'soc', 'Elkarrizketa bat hasi', 'Partekatzen duzuen zerbaiti buruzko galdera ireki bat («zer iruditu zaizu azterketa?») ate erraza da. Ez da barregarria izan behar, jakin-mina izatea nahikoa da.', 'eu'),
  ('frase', 'soc', 'Ez diozu denei gustatu behar', 'Benetan zuretzat diren pertsonek zaren bezala maitatuko zaituzte.', 'eu'),
  ('historia', 'soc', 'Bakarrik jolastorduan', 'Nerea ikastetxez aldatu zen eta asteak eman zituen bakarrik. Antzerki-tailer batean izena eman zuen inor ezagutu gabe. «Hankak dardarka nituen», gogoratzen du. Gaur bere lagun onenetako bi handik atera ziren.', 'eu'),
  ('consejo', 'soc', 'Antsietate soziala estutzen duenean', 'Gogoratu jende gehiena bere buruari adi dagoela, ez zuri. Zentratu besteak esaten duenean: zure buruaren fokua jaisten du.', 'eu'),
  ('frase', 'soc', 'Bakarrik sentitzea igarotzen da', 'Bakardadea sentitzeak ez du ezer txarrik esaten zutaz. Konexioa behar duzula esaten du, eta hori oso gizatiarra da.', 'eu'),
  ('consejo', 'fam', '«Ni» mezuak', '«Ez didazu inoiz entzuten» esan beharrean, saiatu «baztertuta sentitzen naiz… denean». Sentitzen duzunetik hitz egiteak tentsioa jaitsi ohi du.', 'eu'),
  ('consejo', 'fam', 'Unea aukeratu', 'Elkarrizketa garrantzitsuak hobeto doaz inork presarik ez duenean eta haserre ez dagoenean. Esan dezakezu: «geroago hitz egin dezakegu garrantzitsua den zerbaiti buruz?».', 'eu'),
  ('frase', 'fam', 'Mugak jartzea ere maitatzea da', '«Honek ez nau ondo sentiarazten» esatea harremana zaintzea da, ez apurtzea.', 'eu'),
  ('historia', 'fam', 'Gutun bat hozkailuan', 'Pablori kosta egiten zitzaion bere aitarekin eztabaidatu gabe hitz egitea. Egun batean ohar bat idatzi zion nola sentitzen zen azalduz. «Ez genuen horretaz hitz egin bi egun geroago arte, baina hilabeteetako lehen benetako elkarrizketa izan zen».', 'eu'),
  ('consejo', 'fam', 'Etxean tentsioa dagoenean', 'Bilatu babesleku txiki bat: zure musika, paseo bat, txoko lasai bat. Eta gogoratu ez zarela helduen arazoak konpontzeko arduraduna.', 'eu'),
  ('frase', 'iden', 'Baliozkoa zara', 'Nor zaren eta nor maite duzun ez dago inoren onespenaren beharrik benetakoa izateko.', 'eu'),
  ('frase', 'iden', 'Presarik gabe', 'Ez duzu gaur etiketarik jarri behar, ezta inoiz ere nahi ez baduzu. Zeure burua ezagutzea prozesu bat da, ez azterketa bat.', 'eu'),
  ('historia', 'iden', 'Entzutea gustatuko litzaidakeena', 'Alexek urteak behar izan zituen bere identitateaz hitz egiteko. «Lagungarria izango zitzaidan jakitea ez nintzela horrela sentitzen zen bakarra», dio. Gaur elkarri laguntzen dioten gazte-talde bateko kide da.', 'eu'),
  ('consejo', 'iden', 'Bilatu zure jendea', 'Badira LGTBIQ+ gazteen kolektibo eta taldeak, bizi duzuna ulertzen duten pertsonekin hitz egiteko. Zure lekua aurkitzeak asko laguntzen du.', 'eu'),
  ('consejo', 'iden', 'Baztertua izateko beldurra baduzu', 'Ez diozu inori kontatu behar prest egon aurretik. Nahi baduzu, hasi zaindu egingo zaituela dakizun konfiantzazko norbaitekin.', 'eu'),
  ('frase', 'iden', 'Zu izanda ondo sentitzea merezi duzu', 'Zure izateko modua ez da konpondu beharreko arazo bat.', 'eu'),
  ('frase', 'general', 'Un día de cada vez', 'Non tes que telo todo resolto hoxe. Abonda co seguinte paso pequeno.', 'gl'),
  ('frase', 'general', 'O teu ritmo vale', 'Descansar non é renderse. É parte do camiño.', 'gl'),
  ('frase', 'general', 'Sentir non é fallar', 'Estar mal ás veces non significa que esteas facendo algo mal. Significa que es humano/a.', 'gl'),
  ('consejo', 'general', 'Respiración 4-7-8', 'Inspira polo nariz contando 4, aguanta 7, solta pola boca en 8. Repite 3 ou 4 veces. Dille ao teu corpo que pode baixar revolucións.', 'gl'),
  ('consejo', 'general', 'Grounding 5-4-3-2-1', 'Nomea 5 cousas que ves, 4 que podes tocar, 3 que oes, 2 que cheiras e 1 que saboreas. Axúdache a volver ao presente cando a cabeza vai a mil.', 'gl'),
  ('consejo', 'general', 'Durmir tamén é autocoidado', 'Deixa o móbil un anaco antes de durmir e proba a apuntar nun papel o que che rolda. Sacalo da cabeza axuda a soltalo.', 'gl'),
  ('historia', 'general', 'O día que pedín axuda', 'Laia levaba semanas sen gana de nada. Pensaba que contalo era molestar. Un día díxollo á súa curmá, case sen querer. «Non arranxou todo, pero deixei de cargalo soa», conta. Ás veces o primeiro paso é só dicilo en voz alta.', 'gl'),
  ('historia', 'general', 'Volver sen culpa', 'Marc deixou de facer as cousas que lle sentaban ben durante un mes. Cando volveu, sentiuse fatal por «telo deixado». Ata que entendeu que volver xa era coidarse. Non hai que comezar de cero: séguese desde onde estás.', 'gl'),
  ('consejo', 'acad', 'A técnica Pomodoro', '25 minutos de foco, 5 de descanso. Tras 4 roldas, descanso longo. O importante non é estudar moito tempo, é estudar coa cabeza fresca.', 'gl'),
  ('consejo', 'acad', 'Repaso espazado', 'Repasar un pouco hoxe, outro pouco en 2 días e outro nunha semana funciona mellor que unha maratón a noite anterior. A túa memoria agradeceracho.', 'gl'),
  ('consejo', 'acad', 'Divide a montaña', 'Se unha tarefa te agobia, divídea en pasos tan pequenos que case dean risa. «Abrir o libro» xa é un paso.', 'gl'),
  ('frase', 'acad', 'Unha nota non te define', 'Es moito máis ca un exame. O teu valor non cabe nun número do 0 ao 10.', 'gl'),
  ('historia', 'acad', 'Compararme esgotábame', 'Iker sempre miraba as notas dos demais. «Canto máis me comparaba, peor estudaba», di. Comezou a apuntar só os seus pequenos avances de cada semana. Cambioulle a maneira de verse.', 'gl'),
  ('consejo', 'acad', 'Antes do exame', 'Se notas nervios, proba a respirar amodo e a lembrarte: «prepareime o que puiden». Os nervios tamén son enerxía para concentrarte.', 'gl'),
  ('consejo', 'soc', 'Comezar unha conversa', 'Unha pregunta aberta sobre algo que compartides («que che pareceu o exame?») é unha porta doada. Non fai falta ser gracioso/a, abonda con ter curiosidade.', 'gl'),
  ('frase', 'soc', 'Non fai falta gustarlle a todo o mundo', 'As persoas que de verdade son para ti vante querer tal e como es.', 'gl'),
  ('historia', 'soc', 'Soa no recreo', 'Nerea cambiou de instituto e pasou semanas soa. Apuntouse a un obradoiro de teatro sen coñecer a ninguén. «Tremíanme as pernas», lembra. Hoxe dúas das súas mellores amigas saíron de alí.', 'gl'),
  ('consejo', 'soc', 'Cando a ansiedade social aperta', 'Lembra que a maioría da xente está pendente de si mesma, non de ti. Céntrate no que di a outra persoa: baixa o foco da túa propia cabeza.', 'gl'),
  ('frase', 'soc', 'Sentirse só/soa pasa', 'Sentir soidade non di nada malo de ti. Di que precisas conexión, e iso é moi humano.', 'gl'),
  ('consejo', 'fam', 'Mensaxes «eu»', 'En vez de «nunca me escoitas», proba «eu síntome ignorado/a cando…». Falar desde o que sentes adoita baixar a tensión.', 'gl'),
  ('consejo', 'fam', 'Escoller o momento', 'As conversas importantes van mellor cando ninguén ten présa nin está anoxado. Podes dicir: «podemos falar logo de algo que me importa?».', 'gl'),
  ('frase', 'fam', 'Poñer límites tamén é querer', 'Dicir «isto non me senta ben» é coidar a relación, non rompela.', 'gl'),
  ('historia', 'fam', 'Unha carta na neveira', 'A Pablo custáballe falar co seu pai sen discutir. Un día escribiulle unha nota explicando como se sentía. «Non falamos diso ata dous días despois, pero foi a primeira conversa de verdade en meses».', 'gl'),
  ('consejo', 'fam', 'Cando na casa hai tensión', 'Busca un pequeno refuxio: a túa música, un paseo, un recuncho tranquilo. E lembra que non es responsable de arranxar os problemas dos adultos.', 'gl'),
  ('frase', 'iden', 'Es válido/a', 'Quen es e a quen queres non precisa a aprobación de ninguén para ser real.', 'gl'),
  ('frase', 'iden', 'Sen présa', 'Non tes que poñerte unha etiqueta hoxe, nin nunca se non queres. Coñecerte é un proceso, non un exame.', 'gl'),
  ('historia', 'iden', 'O que me gustaría ter oído', 'Álex tardou anos en falar da súa identidade. «Axudaríame saber que non era a única persoa sentíndose así», di. Hoxe forma parte dun grupo de mozos e mozas onde se apoian mutuamente.', 'gl'),
  ('consejo', 'iden', 'Busca a túa xente', 'Hai colectivos e grupos de mocidade LGTBIQ+ onde podes falar con persoas que entenden o que vives. Atopar o teu sitio axuda moitísimo.', 'gl'),
  ('consejo', 'iden', 'Se temes o rexeitamento', 'Non llo tes que contar a ninguén antes de estar preparado/a. Comeza, se queres, por alguén de confianza que saibas que te vai coidar.', 'gl'),
  ('frase', 'iden', 'Mereces sentirte ben sendo ti', 'A túa forma de ser non é un problema que haxa que resolver.', 'gl'),
  ('frase', 'general', 'One day at a time', 'You don''t have to have everything figured out today. The next small step is enough.', 'en'),
  ('frase', 'general', 'Your pace matters', 'Resting isn''t giving up. It''s part of the journey.', 'en'),
  ('frase', 'general', 'Feeling isn''t failing', 'Feeling bad sometimes doesn''t mean you''re doing something wrong. It means you''re human.', 'en'),
  ('consejo', 'general', '4-7-8 breathing', 'Breathe in through your nose for 4, hold for 7, breathe out through your mouth for 8. Repeat 3 or 4 times. It tells your body it can slow down.', 'en'),
  ('consejo', 'general', '5-4-3-2-1 grounding', 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste. It helps you come back to the present when your mind is racing.', 'en'),
  ('consejo', 'general', 'Sleep is self-care too', 'Put your phone away for a while before bed and try writing down on paper whatever is on your mind. Getting it out of your head helps you let it go.', 'en'),
  ('historia', 'general', 'The day I asked for help', 'Laia had felt like doing nothing for weeks. She thought telling someone would be a bother. One day she told her cousin, almost by accident. "It didn''t fix everything, but I stopped carrying it alone," she says. Sometimes the first step is just saying it out loud.', 'en'),
  ('historia', 'general', 'Coming back without guilt', 'Marc stopped doing the things that were good for him for a month. When he came back, he felt awful for "having dropped it". Until he realised that coming back was already looking after himself. You don''t have to start from zero: you carry on from where you are.', 'en'),
  ('consejo', 'acad', 'The Pomodoro technique', '25 minutes of focus, 5 of rest. After 4 rounds, a long break. What matters isn''t studying for ages, it''s studying with a fresh mind.', 'en'),
  ('consejo', 'acad', 'Spaced repetition', 'Reviewing a bit today, another bit in 2 days and again in a week works better than a marathon the night before. Your memory will thank you.', 'en'),
  ('consejo', 'acad', 'Break the mountain down', 'If a task overwhelms you, split it into steps so small they''re almost funny. "Open the book" is already a step.', 'en'),
  ('frase', 'acad', 'A grade doesn''t define you', 'You''re much more than an exam. Your worth doesn''t fit into a number from 0 to 10.', 'en'),
  ('historia', 'acad', 'Comparing myself wore me out', 'Iker always looked at other people''s grades. "The more I compared myself, the worse I studied," he says. He started writing down just his own small progress each week. It changed how he saw himself.', 'en'),
  ('consejo', 'acad', 'Before the exam', 'If you feel nervous, try breathing slowly and reminding yourself: "I''ve prepared as much as I could". Nerves are also energy to help you focus.', 'en'),
  ('consejo', 'soc', 'Starting a conversation', 'An open question about something you share ("what did you think of the exam?") is an easy way in. You don''t need to be funny, just curious.', 'en'),
  ('frase', 'soc', 'You don''t need everyone to like you', 'The people who are really right for you will love you just as you are.', 'en'),
  ('historia', 'soc', 'Alone at break time', 'Nerea changed schools and spent weeks on her own. She joined a drama workshop without knowing anyone. "My legs were shaking," she remembers. Today two of her best friends came from there.', 'en'),
  ('consejo', 'soc', 'When social anxiety hits', 'Remember that most people are focused on themselves, not on you. Focus on what the other person is saying: it takes the spotlight off your own head.', 'en'),
  ('frase', 'soc', 'Feeling lonely passes', 'Feeling lonely doesn''t say anything bad about you. It says you need connection, and that''s very human.', 'en'),
  ('consejo', 'fam', '"I" messages', 'Instead of "you never listen to me", try "I feel ignored when…". Speaking from what you feel usually lowers the tension.', 'en'),
  ('consejo', 'fam', 'Choosing the moment', 'Important conversations go better when nobody is in a hurry or angry. You can say: "can we talk later about something that matters to me?".', 'en'),
  ('frase', 'fam', 'Setting limits is also love', 'Saying "this doesn''t feel good to me" is looking after the relationship, not breaking it.', 'en'),
  ('historia', 'fam', 'A note on the fridge', 'Pablo found it hard to talk to his dad without arguing. One day he wrote him a note explaining how he felt. "We didn''t talk about it until two days later, but it was our first real conversation in months."', 'en'),
  ('consejo', 'fam', 'When there''s tension at home', 'Find a small refuge: your music, a walk, a quiet corner. And remember you''re not responsible for fixing adults'' problems.', 'en'),
  ('frase', 'iden', 'You are valid', 'Who you are and who you love doesn''t need anyone''s approval to be real.', 'en'),
  ('frase', 'iden', 'No rush', 'You don''t have to put a label on yourself today, or ever if you don''t want to. Getting to know yourself is a process, not an exam.', 'en'),
  ('historia', 'iden', 'What I would have liked to hear', 'Álex took years to talk about their identity. "It would have helped me to know I wasn''t the only one feeling this way," they say. Today they''re part of a youth group where they support each other.', 'en'),
  ('consejo', 'iden', 'Find your people', 'There are LGBTIQ+ youth groups and organisations where you can talk to people who understand what you''re going through. Finding your place helps a lot.', 'en'),
  ('consejo', 'iden', 'If you fear rejection', 'You don''t have to tell anyone before you''re ready. If you want, start with someone you trust who you know will look after you.', 'en'),
  ('frase', 'iden', 'You deserve to feel good being you', 'The way you are isn''t a problem that needs solving.', 'en');
