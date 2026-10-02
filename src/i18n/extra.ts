// Strings added after the main translations (pt, it, el; fr/nl/no carry their own): the "face downstream" labels,
// the trial badge, the split hygiene/dog tips and the System Usability Scale.
// Merged over each language at load time (see compose.ts).

import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const EXTRA: Record<string, DeepPartial<Strings>> = {
  pt: {
    ui: { left: "Esquerda", right: "Direita", facingDownstream: "Virado para jusante, no sentido da corrente" },
    hub: { trial: "Teste (fotos de exemplo)" },
    story: {
      tips: {
        faecal: "Lave as mãos depois de tocar na água e mantenha-a longe da boca e de feridas.",
        dogs: "Não deixe os cães beber nem nadar aqui, sobretudo depois de chover.",
      },
    },
    sus: {
      title: "Um minuto para nos ajudar a melhorar o Brook",
      intro: "Dez frases rápidas. Toque no quanto concorda.",
      items: [
        "Acho que gostaria de utilizar o Brook com frequência.",
        "Considerei o Brook desnecessariamente complexo.",
        "Achei o Brook fácil de utilizar.",
        "Acho que precisaria da ajuda de um técnico para conseguir utilizar o Brook.",
        "Considerei que as várias partes do Brook estavam bem integradas.",
        "Achei que o Brook tinha demasiadas inconsistências.",
        "Suponho que a maioria das pessoas aprenderia a utilizar o Brook muito rapidamente.",
        "Considerei o Brook muito complicado de utilizar.",
        "Senti-me muito confiante a utilizar o Brook.",
        "Tive de aprender muitas coisas antes de conseguir começar a utilizar o Brook.",
      ],
      disagree: "Discordo totalmente",
      agree: "Concordo totalmente",
      comment: "Há mais alguma coisa que nos queira dizer? (opcional)",
      send: "Enviar opinião",
      thanks: "Obrigado! A sua opinião vai diretamente para quem está a melhorar o Brook.",
      score: "Pontuação de usabilidade",
    },
  },
  it: {
    ui: { left: "Sinistra", right: "Destra", facingDownstream: "Rivolto a valle, nel verso della corrente" },
    hub: { trial: "Prova (foto di esempio)" },
    story: {
      tips: {
        faecal: "Lavati le mani dopo aver toccato l'acqua e tienila lontana dalla bocca e dalle ferite.",
        dogs: "Non lasciare che i cani bevano o facciano il bagno qui, soprattutto dopo la pioggia.",
      },
    },
    sus: {
      title: "Un minuto per aiutarci a migliorare Brook",
      intro: "Dieci brevi affermazioni. Indica quanto sei d'accordo.",
      items: [
        "Penso che mi piacerebbe usare Brook spesso.",
        "Ho trovato Brook inutilmente complesso.",
        "Ho trovato Brook facile da usare.",
        "Penso che avrei bisogno dell'aiuto di un tecnico per riuscire a usare Brook.",
        "Ho trovato le varie parti di Brook ben integrate.",
        "Ho trovato troppe incoerenze in Brook.",
        "Immagino che la maggior parte delle persone imparerebbe a usare Brook molto rapidamente.",
        "Ho trovato Brook molto macchinoso da usare.",
        "Mi sono sentito/a molto sicuro/a nell'usare Brook.",
        "Ho dovuto imparare molte cose prima di riuscire a usare Brook.",
      ],
      disagree: "Per niente d'accordo",
      agree: "Del tutto d'accordo",
      comment: "Vuoi dirci altro? (facoltativo)",
      send: "Invia il parere",
      thanks: "Grazie! Il tuo parere arriva direttamente a chi migliora Brook.",
      score: "Punteggio di usabilità",
    },
  },
  el: {
    ui: { left: "Αριστερά", right: "Δεξιά", facingDownstream: "Κοιτώντας κατάντη, προς τη ροή του νερού" },
    hub: { trial: "Δοκιμή (φωτογραφίες-παραδείγματα)" },
    story: {
      tips: {
        faecal: "Πλύνετε τα χέρια σας αφού αγγίξετε το νερό και κρατήστε το μακριά από το στόμα και τις πληγές.",
        dogs: "Μην αφήνετε τα σκυλιά να πίνουν ή να κολυμπούν εδώ, ειδικά μετά από βροχή.",
      },
    },
    sus: {
      title: "Ένα λεπτό για να μας βοηθήσετε να βελτιώσουμε το Brook",
      intro: "Δέκα σύντομες προτάσεις. Πατήστε πόσο συμφωνείτε.",
      items: [
        "Νομίζω ότι θα ήθελα να χρησιμοποιώ το Brook συχνά.",
        "Βρήκα το Brook άσκοπα περίπλοκο.",
        "Βρήκα το Brook εύκολο στη χρήση.",
        "Νομίζω ότι θα χρειαζόμουν βοήθεια από κάποιον τεχνικό για να χρησιμοποιήσω το Brook.",
        "Βρήκα ότι τα διάφορα μέρη του Brook ήταν καλά δεμένα μεταξύ τους.",
        "Βρήκα ότι υπήρχαν πάρα πολλές ασυνέπειες στο Brook.",
        "Φαντάζομαι ότι οι περισσότεροι θα μάθαιναν να χρησιμοποιούν το Brook πολύ γρήγορα.",
        "Βρήκα το Brook πολύ δύσχρηστο.",
        "Ένιωσα πολύ σίγουρος/η χρησιμοποιώντας το Brook.",
        "Χρειάστηκε να μάθω πολλά πριν μπορέσω να ξεκινήσω με το Brook.",
      ],
      disagree: "Διαφωνώ απόλυτα",
      agree: "Συμφωνώ απόλυτα",
      comment: "Θέλετε να μας πείτε κάτι άλλο; (προαιρετικό)",
      send: "Αποστολή γνώμης",
      thanks: "Ευχαριστούμε! Η γνώμη σας πηγαίνει κατευθείαν σε όσους βελτιώνουν το Brook.",
      score: "Βαθμολογία χρηστικότητας",
    },
  },
};
