/** Arabic UI strings */
export const ar = {
  appTitle: 'مسابقة الاختبارات',
  appDescription: 'اختبارات تفاعلية فورية للطلاب',

  nav: {
    home: 'الرئيسية',
    competition: 'المنافسة',
    upload: 'رفع ملزمة',
  },

  footer: 'مسابقات اختبار تفاعلية فورية',

  home: {
    title: 'مسابقة الاختبارات',
    lead: 'انضم إلى ردهة انتظار لمدة 20 ثانية، ثم تنافس بأسئلة عشوائية من موادك الدراسية.',
    startQuiz: 'ابدأ الاختبار',
    startQuizHint: '20 أو 50 سؤالاً · ردهة ديناميكية',
    uploadPdf: 'رفع ملزمة',
    uploadPdfHint: 'تحليل ذكي بالذكاء الاصطناعي (Gemini)',
  },

  upload: {
    title: 'رفع ملزمة PDF',
    subtitle:
      'يتم استخراج النص من الملف وإرساله إلى Gemini لإنشاء أسئلة اختيار من متعدد بالعربية.',
    chooseFile: 'اختر ملف PDF (حد أقصى 10 ميجابايت)',
    submit: 'رفع وتحليل',
    uploading: 'جاري الرفع والتحليل…',
    maxSize: 'يجب أن يكون حجم الملف أقل من {mb} ميجابايت.',
    success: 'تم الرفع: {name} — تم إنشاء {count} سؤالاً (المادة #{id})',
    failed: 'فشل الرفع.',
  },

  competition: {
    title: 'ردهة الاختبار',
    subtitle:
      'اختر مادة دراسية وطول الاختبار. تُفتح ردهة لمدة 20 ثانية ويبدأ الاختبار تلقائياً لجميع المنضمين.',
    displayName: 'الاسم المعروض',
    displayNamePlaceholder: 'اسمك',
    loadingMaterials: 'جاري تحميل المواد الدراسية…',
    noMaterials: 'لا توجد مواد دراسية. ارفع ملزمة PDF أو شغّل الخادم لتحميل البيانات التجريبية.',
    questionPool: 'بنك الأسئلة: {count}',
    questions20: '20 سؤال',
    questions50: '50 سؤال',
    lobbyPlayers: 'اللاعبون في هذه الردهة حالياً:',
    waitSeconds: 'انتظر {seconds} ثانية',
    leaveLobby: 'مغادرة الردهة',
    questionProgress: 'السؤال {current} من {total}',
    submitAnswer: 'إرسال الإجابة',
    correct: 'إجابة صحيحة!',
    incorrect: 'إجابة خاطئة — راجع تقرير الأخطاء في النهاية.',
    liveLeaderboard: 'لوحة المتصدرين المباشرة',
    finalLeaderboard: 'لوحة المتصدرين النهائية',
    yourScore: 'نتيجتك:',
    rank: 'الترتيب',
    errorReport: 'تقرير الأخطاء',
    perfectScore: 'نتيجة كاملة — لا أخطاء للمراجعة.',
    yourAnswer: 'إجابتك:',
    correctAnswer: 'الإجابة الصحيحة:',
    backToMaterials: 'العودة إلى المواد',
    materialQuiz: '{title} · {count} سؤالاً',
  },

  status: {
    idle: 'غير متصل',
    connecting: 'جاري الاتصال',
    lobby: 'ردهة الانتظار',
    countdown: 'العد التنازلي',
    live: 'الاختبار جارٍ',
    finished: 'انتهى',
    error: 'خطأ',
    disconnected: 'انقطع الاتصال',
    waiting: 'في الانتظار',
  },

  errors: {
    connection: 'خطأ في الاتصال',
    invalidMessage: 'رسالة غير صالحة من الخادم',
    loadMaterials: 'تعذر تحميل المواد الدراسية',
  },

  logoAria: 'شعار التطبيق',
};

export function format(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}
