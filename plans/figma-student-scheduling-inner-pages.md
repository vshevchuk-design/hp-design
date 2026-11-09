# План: внутрішні сторінки Student Scheduling + Check-in (QR) → Figma

Файл: https://www.figma.com/design/SuQ64uHrhyM3ngVv7U1Yf3/Student-Scheduling (той самий, де вже Book / My schedule / Calendar).
Джерело правди — прототип v7 (`docs/designs/student-scheduling-v7-app.html`) і `student-scheduling-checkin-app.html`, стан на 2026-11-09.
Кожен екран — **Phone 375 / Tablet 768 / Desktop 1440**, якщо не сказано інакше. Тексти — дослівно з прототипу (англійською).

---

## 0. Аудит перед планом (що перевірено і що виправлено)

Прогнав на 375 / 768 / 1440 з логом консолі: бронювання (один і кілька департаментів), відповіді на запитання, перенесення, скасування, чекін, дропін (вступ, блок «вже в черзі», резерв, step away → back → next → ready → on my way → in meeting → done → оцінка, leave queue, cancel reservation), воркшоп (кілька розкладів, одна дата, повний, реєстрація), мій воркшоп (у процесі, завершений, ⋯ → Leave, skip / undo, чекін сесії), календар → деталі. **Помилок консолі — 0, горизонтального переповнення сторінки — 0.**

Виправлено в ході аудиту (вже в Vercel):
- Workshop «Your registration» і «Your workshop» — блок «LOCATION» капслоком замінено на секцію **Where** + Box (як «How you'll meet» в appointment). Тепер усі картки однакові.

Що знайшов і **НЕ** чіпав — треба твоє рішення:
1. ~~Денна смужка на телефоні скролилась~~ → **вирішено 2026-11-09:** увесь тиждень в один ряд рівними вузькими колонками (gap 4), підпис «8 times / Full» на телефоні лише для скрінрідера. Зроблено в коді.
2. ~~Повний воркшоп~~ → **вирішено 2026-11-09:** якщо розклад один — картка показує його дані і список сесій; якщо розкладів кілька і всі повні — порожні рядки «No seats left». Замість неактивної Register — Secondary «View other workshops» (веде в Book). Зроблено в коді.
3. **Тултіпи іконок формату** біля правого краю (шторка, 768) виходять за екран при наведенні. На тачі їх не видно; на десктопі — так. → у Figma малюю тултіп Placement=Left для крайніх.

### DS-компоненти: що з бібліотеки, що локальне
Використовуються з бібліотеки **як є**: Sidebar (Neutral), Button (Primary / Secondary / Ghost / Danger / Tint; sm / base), Icon Button, Badge (Tint / Outline, Regular, base), Card, Alert (Info / Success / Warning / Danger, Action Below / End), Dialog, Alert Dialog (Default / Destructive), Select (base, sm), Listbox/Single, Listbox Option, Tabs Segmented (Tab sm з іконкою), Tabs Underline, Choice Tile, Radio, Progress, Spinner, Chip/Toggle, Attachment, Accordion Item, Dropdown Menu (+ Item Destructive), Box (Sunken), Toast, Tooltip, Separator, Empty State, Slide Over Panel (Bottom), Status Icon, Skeleton, Counter.

Власна верстка в коді, яка в Figma стане **продуктовими компонентами** (див. розділ 2): рядки фактів з іконками, «Summary» адвайзера, плитка дня, плитка часу, рядок адвайзера, рядок сесії, картка наступної сесії, картка статусу дропіна, підсумкова таблиця «Your appointment», плитка розкладу воркшопу, нижня панель Register, тиха примітка «Check-in opens at…».

---

## 1. Крок 1 — доповнення бібліотеки (HighPoint Design System by Claude)

**Статус 2026-11-09: зроблено в бібліотеці, чекає Publish.** 1.1 іконки ✓ · 1.2 Field Marker ✓ (6 варіантів) · 1.3 Text Area ✓ (сторінка Input, 6 станів) · 1.4 Alert `Show second action` ✓ (Action=Below) · 1.5 Accordion body paddingTop 8 ✓ · 1.6 Alert Dialog Tone=Default уже з Primary — змін не треба. Dialog має слот Body + футер — діалог скасування збирається з нього.

Без цього продуктовий файл не зможе зібрати екрани з бібліотеки. Після кроку — **Publish**.

| # | Що | Деталі | Чому |
|---|---|---|---|
| 1.1 | **Icon/logout**, **Icon/notifications** | Material filled, 24, glyph → `icon/default` (як інші) | Leave workshop у ⋯ меню; Notify me |
| 1.2 | **Field — маркер** | нова властивість `Marker = None / Optional / Required`: Optional = « (optional)» `text/muted`, Required = « *» `text/danger` (новий токен `field.requiredColor`) | «What would you like to accomplish? *», «Why are you cancelling? *», «(optional)» у дропіні |
| 1.3 | **Text Area** | новий компонент (як Input, але багаторядковий, ≥3 рядки, ручка resize): Label/Placeholder/Value, State Default / Hover / Focus / Populated / Error / Disabled | ціль appointment, нотатка дропіна, відповіді на запитання, причина скасування |
| 1.4 | **Alert — дві дії** | замінити одну `action` на слот `Actions` (або друга дія + `Show second action`) | «Book an appointment» + «See drop-ins open now»; Notify me у full-воркшопі |
| 1.5 | **Accordion Item — тіло** | відступ над тілом 8 (`accordion.body.paddingTop`, новий токен 2026-11-09) | вміст прилипав до смуги заголовка |
| 1.6 | **Alert Dialog — тон Primary** | `Tone = Default / Destructive` → перевірити, що Default має Primary-кнопку (Check in, I can't make it) | чекін / skip — не руйнівні |

---

## 2. Крок 2 — продуктові компоненти (секція Components)

**Статус 2026-11-09:** секція **Components — Inner pages** (x 4800, y 1947) у файлі. Готово 18 з 18 (Visit Status Card добудовано після Publish; у бібліотеці відновлено прив'язки Label/Description/Error у клонованих варіантах Field): Detail Line, Detail Section, Quiet Note, Advisor Summary, Summary Fact Row, Day Tile, Time Slot Tile, Advisor Option, Meeting Box, Workshop Schedule Tile, Session Row, Next Session Card (5 станів, додано Later), Past Session Item, Rating Chips, Done Card, Register Bar, Check-in Place Header. 
Уточнення з коду: Next session «Not going» має кнопку **«I can make it»** (не Undo; Undo — лише в рядках Coming up); Checked in = Badge + «Caitlin knows you’re here — take a seat in Room 120.». Тексти в слотах Card не прив’язуються до властивостей — правляться прямо в інстансі.

Кожен — з усіма варіантами на аркуші, опис англійською (Figma-only, без репо).

### 2.1 Detail Line (рядок факту з іконкою)
- Іконка 20 (`icon/secondary`) + текст `body/base` `text/default` + опційний другий рядок `body/sm` `text/secondary`.
- Варіанти: `Sub = None / Text / Contacts` (Contacts = два лінки `text/primary`: email · phone).
- Іконки: today, schedule, date_range, person, group (in person), call, videocam.
- Використання: деталі appointment, дропін, екран успіху, Check-in (QR).

### 2.2 Detail Section
- Заголовок `heading/sm` + текст `body/base` (`text/default` для власних даних студента, `text/secondary` для «About this service»).
- Приклади: What you'd like to accomplish · Why it was cancelled · About this service · Help with · Your note · While you wait.

### 2.3 Quiet Note
- `Icon = None / schedule` + `body/sm` `text/muted`.
- «Check-in opens at 1:45 PM» · «Reference #5098» + Icon Button ghost sm content_copy · «Questions answered — Ava has them.» · «Summary from George».

### 2.4 Advisor Summary (From …)
- Eyebrow «FROM GEORGE AMALOR» (`label/sm`, uppercase, `text/secondary`) + текст + 0..2 Attachment (Done).
- Варіанти: `Files = 0 / 1 / 2`.

### 2.5 Summary Fact Row (таблиця в «Your appointment» / «Your registration» / «Your workshop»)
- Label ліворуч `body/sm` `text/secondary`, значення праворуч `heading/sm` `text/default`.
- `State = Filled / Empty` (Empty = «Pick a time» / «Choose a department» / «Choose a schedule» сірим).

### 2.6 Day Tile (вибір дня)
- DOW (label/sm uppercase) · число (title) · «8 times» / «Full».
- `State = Default / Hover / Selected / Focused / Full(disabled)`; токени DS Choice Tile.

### 2.7 Time Slot Tile
- Час `heading/base` · «Caitlin Moore +3 more» · іконки способів (1–2, з Tooltip).
- `State = Default / Hover / Selected / Focused`; `Formats = In person / In person+Video / In person+Phone / Phone+Video / Video`.

### 2.8 Advisor Option
- Radio + ім'я + Badge «Recommended» (Primary, tint) + іконки способів праворуч.
- `Checked = Off / On`, `Recommended = Yes / No`, `Formats` (як 2.7).

### 2.9 Meeting Box (How you'll meet / Where)
- Box Sunken + Detail Line без підрядка.
- `Way = In person (адреса+кабінет) / Phone («Your advisor calls you at (555) 555-1234») / Video («Video — the link is in your email») / Unknown («Counseling Center, Student Services Building» + «In person, phone or video — depends on the time and the advisor») / Online workshop / Mixed`.

### 2.10 Workshop Schedule Tile
- Choice Tile: заголовок розкладу («Tue 10:00 AM · Thu 2:00 PM · Sat 10:00 AM»), опис («Online · Eric Lynch · 6 sessions from Tue, Oct 6»), праворуч «3 seats left» або Badge «Full».
- `State = Default / Selected / Full(disabled)`. Окремий варіант `Type = Date` для single-date воркшопу («Wed, Oct 14 · 1:00 – 2:30 PM · 3 seats left»).

### 2.11 Session Row (списки сесій)
- № · дата `heading/sm` · час `body/sm` · дія праворуч.
- `State = Upcoming (Can't make it) / Not going (Badge Not going + Undo) / Plain (без дії — список сесій до реєстрації)`.

### 2.12 Next Session Card
- «Today · Fri, Oct 2» · «11:00 AM – 12:00 PM · Session 6 of 10» · Detail Line місця · дії.
- `State = Check-in open (Check in + Can't make it) / Not open yet (note + Can't make it) / Checked in (Badge) / Not going (Badge + Undo)`.

### 2.13 Past Session Item
- Accordion Item: «Tue, Sep 22 · Session 3» · meta «Note · 1 file» · Badge Attended / Missed; тіло = Advisor Summary.
- `Outcome = Attended / Missed`, `Note = None / Note / Note+files`, `Expanded = No / Yes`.

### 2.14 Visit Status Card (дропін)
- Eyebrow · заголовок `heading/lg` · текст · (Progress) · дії.
- `State = Open now (pre-join) / Not open yet (pre-reserve) / Your place (#3) / You're next / Stepped away / In meeting / Visit done / Your seat (reserved)`.
- Ready for you / On your way — це **Alert Success** з іконкою campaign, не картка.

### 2.15 Rating Chips
- Заголовок «How was this visit?» + 3 Chip/Toggle (Very helpful / Somewhat helpful / Not helpful) + подяка.
- `State = None / Picked (one On) + «Thanks — your answer goes to Tutoring Center, not to Priya directly.»`.

### 2.16 Done Card
- Іконка check_circle 48 `icon/success` · заголовок `title/xl` · текст · Detail Lines · Detail Section · Quiet Note · дії.
- `Kind = Appointment / Workshop`.

### 2.17 Register Bar (телефон / таблет, низ екрана)
- Кнопка Register (Primary, base, на всю ширину) на `surface/default` з верхньою лінією.

### 2.18 Check-in Place Header (QR)
- Eyebrow «CHECK IN AT» · «Counseling Center» `title/xl` · «Student Services Building, 1st floor».

---

## 3. Крок 3 — екрани

Позначки: **P** = 375, **T** = 768, **D** = 1440. Шел скрізь — як у вже зроблених Book / My schedule (Sidebar Neutral, Scheduling Topbar), але:
- На **телефоні** на внутрішніх сторінках **немає** Section Tabs (вирішено 2026-11-09).
- Верх контенту: Queue Banner (In line), коли студент у черзі (як у прототипі) — показую на основних станах, на решті без банера, щоб не дублювати.
- Назад: Button Ghost sm + arrow_back: «All services» / «Book» / «My schedule» / «Calendar» / «Back to appointment».

### A. Pick a time (appointment) — 12 станів

**Готово 2026-11-09 — секція «Screens — Appointment · Pick a time» (під Components — Inner pages), 13 станів / 33 фрейми** (03 тепер і на планшеті; 14 Rescheduling винесено в C). Фактична нумерація у файлі: 01 Default (D/T/P) · 02 Several departments, none chosen (D/T/P) · 03 Department list open (D/P) · 04 Department chosen (D/T/P) · 05 Time picked (D; T/P — шторка) · 06 Advisor meets two ways (D/P) · 07 Video chosen (D/P) · 08 Phone advisor (D/P) · 09 Goal missing (D/P) · 10 Evening (D/T/P) · 11 Next week (D/P) · 12 No open times (D/T/P) · 13 No open times, notified + toast (D/P) · 14 Rescheduling (D/P). Банер черги «You’re #3 in line» не малюється (як у Book — лише в окремому стані). Уточнення з коду: при кількох департаментах картка «Your appointment» — лише Service / Department / Duration, без How you’ll meet і Confirm; при «немає вільних» — Service / Department / Duration + коротке «In person, phone or video», без Confirm; Confirm активна одразу після вибору часу (ціль перевіряється по натисканню).
Розкладка: **D** — дві колонки (контент + sticky картка «Your appointment» 340, Confirm прилиплий до низу картки). **P/T** — одна колонка; картки немає; після вибору часу — **Slide Over Panel Bottom «Your appointment»** з Confirm у футері.

Анатомія: заголовок `title/xl` · мета `body/base` `text/secondary` («30 minutes · Counseling») · Week («Oct 2 – 8» + Icon Button sm chevron_left / chevron_right) · Tabs Segmented sm (Any time / Morning / Afternoon / Evening) · Day Tiles ×7 · «Friday, October 2» + «8 open times» · Time Slot Tiles (2 колонки D/T, 1 P) · Quiet Note «Times shown in your time zone (EEST).»

| # | Стан | P | T | D | Що саме |
|---|---|---|---|---|---|
| A1 | Один департамент, час не вибрано | ✓ | ✓ | ✓ | Academic Probation; D: картка «minimal» — Service/Department/When «Pick a time»(Empty)/Duration + Quiet Note «Pick a time to see which advisors are free.» + How you'll meet (Meeting Box Unknown) |
| A2 | Кілька департаментів, не вибрано | ✓ | ✓ | ✓ | Career Counseling; блок «Department» + Select base placeholder «Choose a department»; Card + Empty State «Choose a department to see open times»; D: Department = «Choose a department» (Empty) |
| A3 | Department Select відкритий | ✓ | — | ✓ | Listbox: Career and Talent Development / Counseling |
| A4 | Час вибрано — повна картка | — | — | ✓ | Fri Oct 2 10:30; Advisor Options ×4 (Caitlin Recommended In person · Alexander In person · Eric In person+Video · Jonathan Phone+Video); How you'll meet: без перемикача (Caitlin — один спосіб), Box In person «…Room 147»; Field «What would you like to accomplish? *» + Text Area; Confirm appointment |
| A5 | Шторка «Your appointment» | ✓ | ✓ | — | те саме, що A4, у Slide Over Panel Bottom; Confirm на всю ширину |
| A6 | Адвайзер з двома способами | ✓(шторка) | — | ✓ | Eric Lynch: Tabs Segmented sm з іконками «In person / Video», Box In person |
| A7 | Перемкнуто на Video / Phone | ✓ | — | ✓ | Box Video «Video — the link is in your email»; і Phone-варіант (Jonathan) «Your advisor calls you at (555) 555-1234» |
| A8 | Ціль не заповнена → помилка | ✓ | — | ✓ | Text Area Error + «Tell your advisor what you'd like to accomplish.» |
| A9 | Фільтр Evening | ✓ | ✓ | ✓ | Day Tiles з «2 times», «1 time», Sat Full; 2 слоти |
| A10 | Наступний тиждень | ✓ | — | ✓ | «Oct 9 – 15», chevron_left активний |
| A11 | Немає вільних (Academic Difficulty; «Go to Drop-Ins» лише коли в департаменту є дропін) | ✓ | ✓ | ✓ | Alert Info «No open times right now. Every slot for this service is taken for the next 3 weeks.» + detail «We can email you as soon as an advisor opens a new time.» + дві дії: Button Primary sm notifications «Notify me when a spot opens» (→ «We'll let you know», disabled) і Button Secondary sm «Go to Drop-Ins» |
| A12 | Перенесення — **перенесено до C (Appointment details), за рішенням 2026-11-09** | ✓ | — | ✓ | Alert Info «Rescheduling. Change of Major is booked for Wed, Oct 7 at 2:00 PM. That time stays yours until you confirm a new one.»; назад «Back to appointment»; ціль заповнена; кнопка «Confirm new time» |

### B. Done screen — 3 стани (P/T/D)

**Готово 2026-11-09 — секція «Screens — Done», 9 фреймів.** На телефоні дії стовпчиком на всю ширину (футер Card вимкнено, той самий ряд — лінія + 12 — у кінці тіла). Workshop: «…The first is Tue, Oct 6 at 10:00 AM; we’ll remind you the day before each one.»; one date: «Interview Prep on Wed, Oct 14 at 1:00 PM. We’ll remind you the day before.»
| # | Стан | Зміст |
|---|---|---|
| B1 | Appointment booked | «You're booked» · «Academic Probation with Caitlin Moore, Fri, Oct 2 at 10:30 AM. Check-in opens 15 minutes before.» · Detail Lines: today «Friday, October 2 · 10:30 – 11:00 AM» / «30 minutes · times in EEST»; person «Caitlin Moore» / Contacts · Counseling; group «In person — …Room 147» · Section «What you'd like to accomplish» · Note «Reference #5212» · Go to My schedule (Primary) + Book something else |
| B2 | Workshop registered (schedule) | «You're registered» · «Resume Writing Workshop — all 6 sessions. The first is …» · date_range «Tue 10:00 AM · Thu 2:00 PM · Sat 10:00 AM» / «6 sessions, starting Tue, Oct 6»; person organizer / dept; videocam «Online — the link arrives by email once you're registered» · Done + View workshop |
| B3 | Workshop registered (one date) | Interview Prep: today «Wed, Oct 14 · 1:00 – 2:30 PM»; person Eric Lynch / Career and Talent Development; group «Career Center, Library 2nd floor» |

### C. Appointment details — 9 станів (P/T/D; колонка 720)
Анатомія: назад · заголовок + Badges статусу · департамент `body/base` `text/secondary` · (Alerts) · (Summary) · Card: Detail Lines (when / person+Contacts / meeting) → Sections → About this service → Quiet Note Reference + copy → footer дії.
Дії на **P**: Check in на всю ширину, під ним Reschedule + Cancel навпіл; **T/D**: ряд праворуч.

| # | Стан | Особливе |
|---|---|---|
| C1 | Upcoming, чекін ще не відкритий | Change of Major — Badge Appointment(violet) не показується в заголовку, лише стан; Quiet Note «Check-in opens at 1:45 PM»; Reschedule / Cancel |
| C2 | Є запитання адвайзера | Badge Warning «2 questions to answer»; Alert Info «Ava Robinson asked 2 questions. Answer them before the meeting so you can spend the time on what matters.» + Button Primary sm «Answer questions» |
| C3 | Запитання відповіли | Quiet Note «Questions answered — Ava has them.» |
| C4 | Чекін відкритий | Ed Plan Review, Badge Success «Check-in open»; Button Primary «Check in» |
| C5 | Зачекінений — in person | Alert Success «You're checked in. Wait in the Counseling Center — Caitlin will come and get you at 10:30 AM.»; Badge «Checked in» |
| C6 | Зачекінений — phone / video | ті самі, тексти: «Keep your phone close — Ava will call (555) 555-1234 at 2:00 PM.» / «Open the link in your email — Eric will let you in at 11:30 AM.» |
| C7 | Past · Done з підсумком | Comprehensive Ed Plan, Badge Neutral «Done»; Advisor Summary (Files=1 «Ed plan — fall 2026 to spring 2028.pdf · PDF · 240 KB»); Book again |
| C8 | Past · Missed | Degree Planning, Badge «Missed»; без підсумку; Book again |
| C9 | Past · Cancelled з причиною | Transcript Evaluation, Badge «Cancelled»; Section «Why it was cancelled» — «I booked the wrong service — I needed the Admissions office, not the Registrar.»; Book again |

Оверлеї сторінки (P + D, T = як D):
| # | Що | Компонент | Тексти |
|---|---|---|---|
| C10 | Check in? (appointment) ×3 формати | Alert Dialog Default | «Check in for 10:30 AM?» · in person / phone / video тексти · Not yet / Check in |
| C11 | Before your appointment | Dialog md | «Ava Robinson asked these before your Change of Major appointment on Wed, Oct 7 at 2:00 PM.» · 2 × Field + Text Area · Not now / Send answers |
| C12 | Cancel — порожній | Dialog | «Cancel this appointment?» · опис · Field «Why are you cancelling? *» Select placeholder «Choose a reason» · Field «Anything to add? (optional)» Text Area · Keep it / Cancel appointment (Danger) |
| C13 | Cancel — Select відкритий | + Listbox: I can't make it at this time / I don't need it anymore / I booked the wrong service / I'd rather see a different advisor / Something else |
| C14 | Cancel — помилки | Select Error «Choose a reason.» |
| C15 | Cancel — Something else | нотатка стає `*`, помилка «Tell us a little more.» |
| C16 | Тости | Toast Success: «Reference #5098 copied» · «Career Counseling on Fri, Oct 9 at 4:00 PM cancelled» · «Rescheduled to …» |

### D. Drop-in visit page — 14 станів (P/T/D; колонка 720)
Анатомія: назад · заголовок + Badges (Drop-in primary + стан) · департамент · Visit Status Card / Alert · (Summary, Rating) · Card з Detail Lines (+ Sections Help with / Your note).

| # | Стан | Зміст |
|---|---|---|
| D1 | Pre-join, відкрито | Badge Success «Drop-in · open until 10:00 PM»; Card «OPEN NOW · 1 student waiting · If you join now you'd be #2 — about 8 minutes…»; Field «What would you like help with? (optional)» Select «Choose a topic»; Field «Anything the advisor should know? (optional)» Text Area; Join queue; Detail Lines: schedule «Open today until 10:00 PM», group «In person — …» |
| D2 | Pre-join — тема відкрита | Listbox тем (7): Choosing or changing classes … Something else |
| D3 | Pre-join, заблоковано | Alert Info «You're already in line for Math Tutoring. Leave that queue first — you can only wait in one at a time.» + View my queue; Join queue disabled |
| D4 | Pre-reserve (ще не відкрито) | Badge Primary «Drop-in · opens 1:00 PM»; Card «NOT OPEN YET · Opens today at 1:00 PM · Reserve a seat now and you'll be first in line when it opens. Check in at the desk by 1:15 PM to keep it.»; Reserve a seat |
| D5 | Seat reserved | Card «YOUR SEAT · Held for when drop-in opens at 1:00 PM · You'll be first in line. Check in at the desk by 1:15 PM…» · Cancel reservation |
| D6 | У черзі #3 | Card «YOUR PLACE IN LINE · You're #3 — about 16 minutes» + Progress + «Stay nearby. This page updates by itself…» · Step away / Leave queue; Badge «#3 in line» |
| D7 | You're next | «You're next» |
| D8 | Stepped away | «YOU STEPPED AWAY · You're still #3 · Your place is held. If your turn comes while you're away…» · I'm back / Leave queue |
| D9 | Ready for you | Alert Success (campaign) «Priya Natarajan is ready for you. Go to Learning Commons, Library 1st floor.» + detail «Let Priya know you're on the way — if you don't show up in 5 minutes, the next student is called.» + Primary «I'm on my way» |
| D10 | On your way | той самий Alert без кнопки, detail «Priya knows you're coming.» |
| D11 | In meeting | «IN MEETING · With Priya Natarajan · Started at 10:37 AM. When it's over, Priya's summary shows up here.» |
| D12 | Done — ще не оцінено | «VISIT DONE · With Priya Natarajan · Today, 10:37 – 10:53 AM.» · Summary · Rating Chips (none) · Detail Lines |
| D13 | Done — з файлом, оцінено | Writing Center (Thesis feedback.pdf), Rating «Very helpful» On + подяка |
| D14 | Діалоги | Alert Dialog Destructive «Leave the queue?» (Stay in line / Leave queue); «Cancel your reserved seat?» (Keep my seat / Cancel reservation) |

### E. Workshop page (Book) — 8 станів
Розкладка: **D** дві колонки (контент + sticky «Your registration» з Register у футері); **P/T** — одна колонка, «Your registration» під контентом, Register — **Register Bar** знизу екрана.

| # | Стан | Зміст |
|---|---|---|
| E1 | Кілька розкладів, не вибрано | Resume Writing Workshop; Badge Teal «Workshop»; мета «Career and Talent Development · 60-minute sessions»; «Choose a schedule · Same workshop on different days»; 3 Schedule Tiles (3 seats left / 10 seats left / Full); Your registration: усі Empty «Choose a schedule»; About; Where Mixed; Register disabled |
| E2 | Розклад вибрано | Sessions «6 sessions» — Session Rows (Plain) ×4 + «Show all 6 sessions»; Your registration заповнено; Where Online |
| E3 | Show all sessions розгорнуто | 6 рядків + «Show fewer» |
| E4 | Одна дата (Interview Prep) | «Choose a date · Every date is the same session»; Date Tiles (Wed, Oct 7 Full …); Your registration: Date / Time Empty |
| E5 | Дату вибрано | Date / Time заповнено |
| E6 | З курсом | College Writing Lab — Badge Outline «ENGL 101» у заголовку |
| E7 | Повний (Time Management Essentials) | Badge Neutral «Full»; Alert Info «This workshop is full. Every seat is taken. We can email you if one opens up.» + Secondary sm «Notify me when a seat opens»; «Schedule» — фіксований розклад з «Full»; Sessions; картка з даними розкладу; Secondary «View other workshops» (D — у картці, P/T — Register Bar) |
| E8 | Notify — вже підписано | кнопка disabled «We'll let you know» |

### F. My workshop page — 9 станів
Розкладка: як E (**D** дві колонки: контент + картка «Your workshop» з ⋯; **P/T** одна колонка).
Анатомія: назад · заголовок + Badges (Workshop + Registered/Completed) · мета «Academic Advising · Tue 1:00 PM · Fri 11:00 AM» · Progress card («5 of 10 sessions done · you attended 4») · Next session · Coming up (Session Rows + «Show all 4») · Past sessions (Accordion, «Attended 4 of 5») · Materials (Attachments: Seminar syllabus.pdf, Semester planner.xlsx) · Your workshop: Summary Fact Rows (Schedule / Sessions / Format / Organizer) + About + Where.

| # | Стан | Особливе |
|---|---|---|
| F1 | У процесі, чекін відкритий | Next Session Card «Check-in open» |
| F2 | Next — ще не відкрито | Quiet Note «Check-in opens at 12:45 PM» |
| F3 | Next — зачекінено | Badge «Checked in» |
| F4 | Сесія пропущена | Coming up: рядок Not going + Undo |
| F5 | Past session розгорнуто | Missed + Summary з файлом «Campus resources.pdf · PDF · 1.1 MB» (з новим відступом 8) |
| F6 | ⋯ меню відкрите | Dropdown Menu: Item Destructive logout «Leave workshop» |
| F7 | Діалоги | Leave: Alert Dialog Destructive «Leave this workshop? You'll give up your seat for the 5 remaining sessions… Stay registered / Leave workshop»; Skip: Alert Dialog Default «Skip Tue, Oct 6? We'll let Caitlin know… Keep it / I can't make it»; Check in: «Check in for 11:00 AM? Only check in once you're at Student Services Building, Room 120… Not yet / Check in» |
| F8 | Завершений (Library Research Basics) | Badge Neutral «Completed»; «Finished · you attended 3 of 3»; лише Past sessions; Where «Library, Room 204» |
| F9 | Тости | «Got it — Caitlin knows you can't make it on Tue, Oct 6» · «You're back on for …» · «Downloading Campus resources.pdf» |

### G. Check-in (QR) — 11 станів (P обов'язково, T/D — для повноти)
Шел: Sidebar + Topbar «Check in» (без Section Tabs) · Check-in Place Header · колонка 560. Технічна смужка «Technical · Select view» — **не переносимо** (це інструмент прототипу).

| # | Стан | Компоненти / тексти |
|---|---|---|
| G1 | Looking up | Card: Spinner lg + «Looking up your status…» `heading/lg` + «Checking what you have at the Counseling Center today.» |
| G2 | Sign in | Card «Sign in to check in» + «Use your college account. You'll come straight back here and we'll check you in.» + Primary «Sign in» |
| G3 | Checked in · appointment | Alert Success check_circle «You're checked in. Caitlin Moore will come and get you at 10:30 AM.» + Card: Detail Lines (today «Today · 10:30 – 11:00 AM» / «Ed Plan Review · 30 minutes»; person; group «…Room 147») + Section «While you wait» + View appointment / Done |
| G4 | Checked in · workshop | «You're checked in to session 6 of 10. First-Year Success Seminar starts at 11:00 AM.» + Detail Lines + View workshop / Done |
| G5 | Choose | Card «What are you here for?» + 3 Choice Tiles (Ed Plan Review — Appointment · 10:30 AM with Caitlin Moore (Selected) / First-Year Success Seminar — Workshop · session 6 of 10 at 11:00 AM / Comprehensive Ed Plan drop-in — 4 waiting · about 32 min) + Check in |
| G6 | Drop-in · join | Visit Status Card «DROP-IN · OPEN UNTIL 10:00 PM · 4 students waiting · …» + Field тема + Field нотатка + Join queue |
| G7 | Drop-in · already in line | «YOUR PLACE IN LINE · You're #3 — about 16 minutes» + Progress + Step away / Leave queue |
| G8 | Too early | Alert Info «Too early to check in. Your appointment is at 2:00 PM — check-in opens at 1:45 PM. Scan the code again then.» + Card Detail Lines + View appointment / Done |
| G9 | Too late | Alert Warning «Your appointment started at 9:00 AM. Check-in closed 15 minutes after the start. Talk to the front desk…» + Card + Reschedule / Done |
| G10 | Nothing here | Alert Warning «Nothing to check in to here. …» + Book an appointment (Primary) + See drop-ins open now (Alert з двома діями — п.1.4) |
| G11 | Error | Alert Danger error «We couldn't check you in. The code may have expired, or the connection dropped.» + Try again |

Окрема секція **Screens — Check-in (QR)** у тому ж файлі (погоджено 2026-11-09).

---

## 4. Порядок експорту (крок за кроком, після кожного — твій перегляд)

1. **Бібліотека** (розділ 1) → ти публікуєш → я перевіряю імпорт.
2. **Компоненти** 2.1–2.18 у секції Components, всі варіанти → скріншот аркуша.
3. **A. Pick a time** (12 станів, ~30 фреймів).
4. **B. Done** (3 × 3 = 9).
5. **C. Appointment details** (9 станів × 3 + оверлеї) .
6. **D. Drop-in visit** (14 станів).
7. **E. Workshop page** (8 станів).
8. **F. My workshop** (9 станів).
9. **G. Check-in (QR)** (11 станів).
10. **Handoff внутрішніх сторінок** — ОКРЕМИЙ новий екран (не дописувати в існуючий Handoff, user 2026-11-09): правила чекіну (15 хв до / 15 хв після), черга, скасування з причиною, підсумок адвайзера, контакти, QR-логіка, брейкпоінти внутрішніх сторінок.

Перевірка після кожного кроку (обов'язково):
- кожен фрейм — повний скріншот, порівняння з прототипом на тому ж брейкпоінті;
- жодного hex / px поза змінними; текстові стилі з бібліотеки;
- жодного «Title» / «Label» плейсхолдера в інстансах;
- переліки тут ↔ фрейми у файлі: таблиця «стан → фрейми» з галочками, яку я веду в `logs/status.md`.

Орієнтовно: **~85 станів, ~230 фреймів**.
