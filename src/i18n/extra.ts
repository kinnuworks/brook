// Strings added after the main translations, per language. Merged over each
// language at load time (see compose.ts); the completeness test checks them too.
// Currently: the labels of the redesigned check screen (composer and side panel).

import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const EXTRA: Record<string, DeepPartial<Strings>> = {
  pt: {
    ui: {
      typeOrTalk: "Escreva uma resposta ou toque no microfone",
      yourCheck: "A sua observação",
      answersSoFar: "As suas respostas até agora",
      nothingYet: "As suas respostas vão aparecer aqui.",
      stageSafety: "Segurança",
      stageStream: "A sua ribeira",
      stagePhotos: "Fotografias",
    },
  },
  fr: {
    ui: {
      typeOrTalk: "Écrivez une réponse ou touchez le micro",
      yourCheck: "Votre observation",
      answersSoFar: "Vos réponses jusqu’ici",
      nothingYet: "Vos réponses s’afficheront ici.",
      stageSafety: "Sécurité",
      stageStream: "Votre cours d’eau",
      stagePhotos: "Photos",
    },
  },
  it: {
    ui: {
      typeOrTalk: "Scrivi una risposta o tocca il microfono",
      yourCheck: "La tua osservazione",
      answersSoFar: "Le tue risposte finora",
      nothingYet: "Le tue risposte appariranno qui.",
      stageSafety: "Sicurezza",
      stageStream: "Il tuo corso d'acqua",
      stagePhotos: "Foto",
    },
  },
  nl: {
    ui: {
      typeOrTalk: "Typ een antwoord of tik op de microfoon",
      yourCheck: "Jouw beekcheck",
      answersSoFar: "Je antwoorden tot nu toe",
      nothingYet: "Je antwoorden verschijnen hier.",
      stageSafety: "Veiligheid",
      stageStream: "Jouw beek",
      stagePhotos: "Foto's",
    },
  },
  no: {
    ui: {
      typeOrTalk: "Skriv et svar, eller trykk på mikrofonen",
      yourCheck: "Din bekkesjekk",
      answersSoFar: "Svarene dine så langt",
      nothingYet: "Svarene dine dukker opp her.",
      stageSafety: "Sikkerhet",
      stageStream: "Bekken din",
      stagePhotos: "Bilder",
    },
  },
  el: {
    ui: {
      typeOrTalk: "Πληκτρολογήστε απάντηση ή πατήστε το μικρόφωνο",
      yourCheck: "Η καταγραφή σας",
      answersSoFar: "Οι απαντήσεις σας μέχρι τώρα",
      nothingYet: "Οι απαντήσεις σας θα εμφανίζονται εδώ.",
      stageSafety: "Ασφάλεια",
      stageStream: "Το ρέμα σας",
      stagePhotos: "Φωτογραφίες",
    },
  },
};
