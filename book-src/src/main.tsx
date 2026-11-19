import * as React from "react"
import { createRoot } from "react-dom/client"
import Book, { type BlLegend } from "./book"

/* Главы берутся из Google Doc через Пульт (/book): обновил документ — через 5 минут книга обновилась. */
const SRC = "https://koleso-balansa-production.up.railway.app/book"
type Ch = { title: string; paragraphs: string[] }
const FALLBACK: Ch[] = [{ title: "Глава 1", paragraphs: ["Сегодня я принял решение написать свою книгу, в которой я буду делиться своими мыслями и историями, которые повлияли на моё сегодняшнее Я."] }]
const LAYOUTS: BlLegend["layout"][] = ["summit", "terrace", "shore"]
const PLATES: BlLegend["engraving"][] = ["fort", "garden", "harbour"]

function toLegends(chs: Ch[]): BlLegend[] {
  return chs.filter((c) => c.paragraphs.length).map((c, i) => {
    const draft = /^Новое/.test(c.title)
    const m = c.title.match(/^Глава\s+(\d+)\.?\s*(.*)$/)
    const name = draft ? "Новые страницы" : m && m[2] ? m[2] : m ? "Глава " + m[1] : c.title
    const ps = c.paragraphs
    // делим главу по длине текста: левая страница и правая
    let total = ps.reduce((a, p) => a + p.length, 0), acc = 0, cut = ps.length
    if (ps.length > 1) { for (let k = 0; k < ps.length; k++) { acc += ps[k].length; if (acc >= total / 2) { cut = k + 1; break } } if (cut >= ps.length) cut = ps.length - 1 }
    return {
      name,
      title: draft ? "из черновиков, ещё не в рукописи" : m && m[2] ? "Глава " + m[1] : "",
      city: draft ? "Черновики" : m ? "Глава " + m[1] : c.title,
      dishName: draft ? "Из черновиков" : m && m[2] ? "Глава " + m[1] : undefined,
      layout: LAYOUTS[i % 3], engraving: PLATES[i % 3], tone: i % 2 ? "sepia" : "graphite",
      story: ps.slice(0, cut), continued: ps.slice(cut),
      seed: i + 3,
    }
  })
}

function App() {
  const [chs, setChs] = React.useState<Ch[] | null>(null)
  React.useEffect(() => {
    let done = false
    const t = setTimeout(() => { if (!done) { done = true; setChs(FALLBACK) } }, 6000)
    fetch(SRC).then((r) => r.json()).then((j) => { if (done) return; done = true; clearTimeout(t); setChs(j && j.ok && j.chapters && j.chapters.length ? j.chapters : FALLBACK) })
      .catch(() => { if (!done) { done = true; clearTimeout(t); setChs(FALLBACK) } })
    return () => clearTimeout(t)
  }, [])
  const legends = React.useMemo(() => (chs ? toLegends(chs) : []), [chs])
  if (!chs) return <div style={{ minHeight: "100vh" }} />
  const n = legends.filter((l) => l.city !== "Черновики").length
  return (
    <Book
      legends={legends}
      title="Сильный духом человек"
      subtitle="Биография"
      edition="Пишется сейчас"
      publisher="Асылбек Кожахметов"
      epigraph="Сегодня я принял решение написать свою книгу."
      closing={{
        kicker: "Об авторе",
        tocNote: "Кто пишет и как связаться",
        heading: "Книга пишется прямо сейчас.",
        script: "Новые главы появляются здесь сами",
        body: "Асылбек Кожахметов, ИИ-интегратор из Алматы. Пишу каждый вечер по 15 минут и раз в неделю переношу текст в рукопись. Эта книга обновляется вместе с ней.",
        primary: { label: "Сайт автора", href: "https://assylbekussa-ui.github.io/" },
        secondary: { label: "Написать в WhatsApp", href: "https://wa.me/77006299307" },
        titleNote: n === 1 ? "Первая глава. Остальные пишутся." : `Глав написано: ${n}. Остальные пишутся.`,
      }}
      columns={[
        { title: "Автор", links: [{ label: "Сайт-портфолио", href: "https://assylbekussa-ui.github.io/" }, { label: "Статьи", href: "https://assylbekussa-ui.github.io/writing/" }] },
        { title: "Связь", links: [{ label: "WhatsApp", href: "https://wa.me/77006299307" }, { label: "Созвон 30 минут", href: "https://cal.com/assylbek/call" }] },
      ]}
      socials={[{ label: "YouTube", href: "https://www.youtube.com/@kapitan_omerika", icon: "youtube" }]}
      colophon="Текст подгружается из рукописи в Google Docs."
      copyright={`© ${new Date().getFullYear()} Асылбек Кожахметов`}
      cta={{ label: "На сайт", href: "https://assylbekussa-ui.github.io/" }}
    />
  )
}
createRoot(document.getElementById("root")!).render(<App />)
