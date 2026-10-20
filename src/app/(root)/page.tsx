import { DEFAULT_LOCALE, LOCALES } from "@/content/types";

const redirectScript = `
  (function () {
    var supported = ${JSON.stringify(LOCALES)};
    var preferred = (navigator.languages || [navigator.language || ""]).map(function (l) { return l.slice(0, 2).toLowerCase(); });
    var russianSpeaking = ["ru", "uk", "be", "kk", "uz", "ky", "tg"];
    var match = preferred.map(function (l) { return russianSpeaking.indexOf(l) !== -1 ? "ru" : l; })
      .find(function (l) { return supported.indexOf(l) !== -1; }) || ${JSON.stringify(DEFAULT_LOCALE)};
    location.replace("/" + match + "/" + location.search);
  })();
`;

export default function RootPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <noscript>
        {LOCALES.map((locale) => (
          <a key={locale} href={`/${locale}/`} style={{ color: "#e8dcc0", marginRight: 16 }}>
            {locale.toUpperCase()}
          </a>
        ))}
      </noscript>
    </>
  );
}
