/* Markdown export — builds an AI-friendly .md of the whole résumé from the two
   runtime sources (store.data = resume.json, siteConfig() = config.json) and triggers
   a download. Modernized from md-export.js (var→const/let, arrow fns, template
   literals, typed). Exposes buildResumeMarkdown + downloadResumeMarkdown. */
import type { ResumeData, SkillEntry, SkillGroup } from '@/types/resume'
import type { SiteConfig } from '@/types/config'
import { t } from '@/composables/i18n'

export const TITLES: Record<string, string> = {
  agent_development: 'Agent Development (AI / LLM)',
  software_architect: 'Software Architect',
  team_lead: 'Team Lead',
  backend: 'Backend',
  frontend: 'Frontend',
  qa: 'QA',
  devops: 'DevOps (SRE)',
  ide: 'IDE & Tools',
  want_to_learn: 'Want to learn next',
}

const skillStr = (it: SkillEntry): string => {
  if (typeof it === 'string') return it
  let s = it.name + (it.experience ? ` (${it.experience})` : '')
  const kids = it.details || it.components
  if (Array.isArray(kids) && kids.length) {
    s +=
      ' — ' +
      t('incl.') +
      ' ' +
      kids
        .map((k) =>
          typeof k === 'string' ? k : `${k.name}${k.experience ? ` (${k.experience})` : ''}`,
        )
        .join(', ')
  }
  return s
}

export function buildResumeMarkdown(data: ResumeData, cfg: SiteConfig): string {
  const L: string[] = []
  const push = (s?: string): void => {
    L.push(s === undefined ? '' : s)
  }

  /* ---- header ---- */
  push(t('# {name} — Résumé', { name: data.name }))
  push()
  push(`> ${data.summary || ''}`)
  if (data.tagline) push(`> ${data.tagline}`)
  push()
  push(t('- **Experience:** {years} years', { years: data.experience_years ?? '' }))
  const roles = (cfg.filters || [])
    .filter((f) => f.id !== 'all')
    .map((f) => f.short || f.label || '')
    .filter(Boolean)
  push(`${t('- **Roles:**')} ${roles.join(' · ')}`)
  const ct: Record<string, string> = { ...data.contacts, ...cfg.contacts }
  const cl: string[] = []
  Object.keys(ct).forEach((k) => {
    if (typeof ct[k] === 'string' && ct[k] && k !== 'introMessage') cl.push(`${k}: ${ct[k]}`)
  })
  push(`${t('- **Contacts:**')} ${cl.join(' | ')}`)
  if (cfg.resumeUrl) push(`${t('- **Résumé (live):**')} ${cfg.resumeUrl}`)
  const facts = ((cfg.hero?.facts as Array<{ t: string }>) || []) as Array<{ t: string }>
  if (facts.length) push(`${t('- **Quick facts:**')} ${facts.map((f) => f.t).join(' | ')}`)
  if (data.updated) push(`${t('- **Updated:**')} ${data.updated}`)
  push()

  /* ---- about ---- */
  const si = data.about_me && data.about_me.short_interview
  if (si) {
    push(t('## About'))
    push()
    push(`**${si.question}**`)
    push()
    push(si.answer)
    push()
  }

  /* ---- skills ---- */
  push(t('## Skills'))
  push()
  if (data.skills.note) {
    push(`_${data.skills.note}_`)
    push()
  }
  Object.keys(data.skills).forEach((key) => {
    if (key === 'note') return
    const g = data.skills[key]
    if (!g) return
    const grp = g as SkillGroup
    push(`### ${t(grp.title || TITLES[key] || key)}${grp.experience ? ` — ${grp.experience}` : ''}`)
    push()
    const lists: SkillEntry[][] = Array.isArray(g)
      ? [g as SkillEntry[]]
      : ([grp.items, grp.tools, grp.highlights].filter(Boolean) as SkillEntry[][])
    lists.forEach((arr) => arr.forEach((it) => push(`- ${skillStr(it)}`)))
    push()
  })

  /* ---- work experience ---- */
  push(t('## Work experience'))
  push()
  ;(data.work_experience || []).forEach((exp) => {
    push(`### ${exp.company} — ${exp.period || ''}${exp.duration ? ` (${exp.duration})` : ''}`)
    const meta: string[] = []
    if (exp.type) meta.push(exp.type)
    if (exp.location) meta.push(exp.location)
    if (meta.length) push(`_${meta.join(' · ')}_`)
    if (exp.summary) {
      push()
      push(exp.summary)
    }
    push()
    ;(exp.projects || []).forEach((p) => {
      push(`#### ${p.project}${p.period ? ` (${p.period})` : ''}`)
      push()
      push(`${t('- **Role:**')} ${p.role}`)
      if (p.client) push(`${t('- **Client:**')} ${p.client}`)
      if (p.team) push(`${t('- **Team:**')} ${p.team}`)
      if (p.responsibility) push(`${t('- **Responsibility:**')} ${p.responsibility}`)
      if (p.description) push(`${t('- **Description:**')} ${p.description}`)
      if (Array.isArray(p.key_achievements) && p.key_achievements.length) {
        push(t('- **Key achievements:**'))
        p.key_achievements.forEach((a) => push(`  - ${a}`))
      }
      if (Array.isArray(p.technologies))
        push(`${t('- **Technologies & skills:**')} ${p.technologies.join(' · ')}`)
      const oc = (cfg.projects || {})[`${exp.company}::${p.project}`]?.outcomes
      if (Array.isArray(oc) && oc.length) {
        push(t('- **Measured outcomes:**'))
        oc.forEach((o) => push(`  - ${o.delta} — ${o.metric}`))
      }
      push()
    })
  })

  /* ---- how I work (principle) ---- */
  const hiw = data.how_i_work
  if (hiw && hiw.title) {
    push(t('## How I work — {title}', { title: hiw.title }))
    push()
    if (hiw.lead) {
      push(hiw.lead) /* already valid Markdown emphasis */
      push()
    }
    ;(hiw.points || []).forEach((p) => push(`- **${p.title}**${p.desc ? ` — ${p.desc}` : ''}`))
    if (hiw.points && hiw.points.length) push()
  }

  /* ---- reference / testimonial ---- */
  const tst = cfg.testimonial
  if (tst && tst.quote) {
    push(t('## Reference'))
    push()
    push(`> ${tst.quote}`)
    push()
    push(`— ${tst.name || ''}${tst.role ? `, ${tst.role}` : ''}${tst.link ? ` (${tst.link})` : ''}`)
    push()
  }

  /* ---- education ---- */
  if (data.education) {
    push(t('## Education'))
    push()
    const eds = Array.isArray(data.education) ? data.education : [data.education]
    ;(eds as Array<string | Record<string, unknown>>).forEach((e) => {
      if (typeof e === 'string') {
        push(`- ${e}`)
        return
      }
      const ed = e as Record<string, string | string[]>
      push(
        `- **${ed.degree || ''}** — ${ed.institution || ''}${ed.period ? ` (${ed.period})` : ''}`,
      )
      if (ed.specialty) push(`  - ${t('Specialty:')} ${ed.specialty}`)
      if (ed.honors) push(`  - ${ed.honors}`)
      ;((ed.additional as string[]) || []).forEach((a) => push(`  - ${a}`))
    })
    push()
  }

  /* ---- courses & certificates ---- */
  const pc = data.professional_courses
  if (pc) {
    push(
      pc.provider
        ? t('## Professional courses & certificates (mostly {provider})', { provider: pc.provider })
        : t('## Professional courses & certificates'),
    )
    push()
    ;(pc.items || []).forEach((c) => {
      const item = c as Record<string, string>
      const conf = (cfg.certificates || {})[item.title] || {}
      push(
        `- **${item.title}**${item.date || item.year ? ` — ${item.date || item.year}` : ''}${
          item.status && item.status !== 'completed' ? ` [${item.status}]` : ''
        }`,
      )
      if (conf.provider) push(`  - ${t('Provider:')} ${conf.provider}`)
      if (conf.skills) push(`  - ${t('Skills:')} ${conf.skills.join(' · ')}`)
    })
    push()
  }

  /* ---- conferences ---- */
  const cn = data.conferences
  if (cn) {
    push(t('## Conferences'))
    push()
    ;(cn.items || []).forEach((c) => {
      const item = c as Record<string, string>
      const conf = (cfg.conferences || {})[item.name || item.title] || {}
      push(`- **${item.name || item.title}**${item.date ? ` — ${item.date}` : ''}`)
      if (conf.skills) push(`  - ${t('Topics:')} ${conf.skills.join(' · ')}`)
    })
    push()
  }

  /* ---- languages / other ---- */
  if (data.languages) {
    push(t('## Languages'))
    push()
    data.languages.forEach((l) => {
      if (typeof l === 'string') push(`- ${l}`)
      else {
        const lang = l as Record<string, string>
        push(`- ${lang.language || lang.name}${lang.level ? ` — ${lang.level}` : ''}`)
      }
    })
    push()
  }
  if (data.other_skills) {
    push(t('## Other skills'))
    push()
    const os = Array.isArray(data.other_skills) ? data.other_skills : [data.other_skills]
    ;(os as Array<string | { name: string }>).forEach((o) => {
      push(`- ${typeof o === 'string' ? o : o.name}`)
    })
    push()
  }
  return L.join('\n')
}

export function downloadResumeMarkdown(
  data: ResumeData,
  cfg: SiteConfig,
  lastModified?: string | null,
): void {
  const md = buildResumeMarkdown(data, cfg)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const src = data.updated || lastModified
  const d = src ? new Date(src) : null
  const stamp = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : ''
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${(data.name || 'resume').replace(/\s+/g, '-')}-Resume${stamp ? `-${stamp}` : ''}.md`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 1000)
}
