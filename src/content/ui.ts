import { l } from "./localize";
import { CASE_NUMBER } from "./profile";

export const ui = {
  meta: {
    title: l("Дело № 404 — Леонид Воронин, backend-разработчик", "Case № 404 — Leonid Voronin, backend developer"),
    description: l(
      "Расследование вместо резюме: backend-разработчик PHP/Laravel из Ташкента. Финтех Alif, медсистема DMed, личные проекты.",
      "An investigation instead of a résumé: a PHP/Laravel backend developer from Tashkent. Alif fintech, the DMed medical system, side projects.",
    ),
  },
  caseLabel: l(`Дело № ${CASE_NUMBER}`, `Case № ${CASE_NUMBER}`),
  caseOpen: l("личность не установлена", "identity unknown"),
  caseClosed: l("дело раскрыто", "case closed"),
  loading: l("Собираем улики", "Gathering evidence"),
  scrollHint: l("Листайте, чтобы начать расследование", "Scroll to start the investigation"),
  skip: l("Пропустить расследование", "Skip the investigation"),
  soundOn: l("Звук включён", "Sound on"),
  soundOff: l("Звук выключен", "Sound off"),
  explore: l("Осмотреть доску", "Explore the board"),
  backToRoute: l("Вернуться к расследованию", "Back to the investigation"),
  exploreHint: l(
    "Тяните, чтобы двигать доску. Колесо или щипок — приблизить. Нажмите на улику, чтобы рассмотреть её.",
    "Drag to move the board. Scroll or pinch to zoom. Tap a piece of evidence to look closer.",
  ),
  stationsLabel: l("Ход расследования", "Investigation progress"),
  contactTitle: l("Связаться", "Get in touch"),
  dossier: {
    title: l("Досье", "Dossier"),
    close: l("Вернуться к доске", "Back to the board"),
    download: l("Скачать резюме, PDF", "Download résumé, PDF"),
    summary: l("Коротко", "Summary"),
    skills: l("Навыки", "Skills"),
    languages: l("Языки", "Languages"),
    contacts: l("Контакты", "Contacts"),
  },
  pilot: {
    title: l("Пилот", "Pilot"),
    route: l("Маршрут", "Route"),
    linear: l("Линейный", "Linear"),
    linearFree: l("Линейный + свободный", "Linear + free"),
    finale: l("Финал", "Finale"),
    reveal: l("A: капюшон", "A: hood"),
    folder: l("B: папка", "B: folder"),
  },
  language: l("Язык", "Language"),
  print: {
    page: l("стр. 4", "page 4"),
    photoCredit: l("Фото: архив редакции", "Photo: newsroom archive"),
    certificate: l("Сертификат", "Certificate"),
    awardedTo: l("выдан", "awarded to"),
    registry: l("Рег. № 404/26", "Reg. № 404/26"),
    evidence: l("Вещдок", "Evidence"),
  },
};
