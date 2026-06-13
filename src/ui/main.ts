import { createApp } from 'vue'
import App from '@/App.vue'
import { store, storeKey } from '@/composables/useStore'
import { t, tc } from '@/composables/i18n'

// styles: self-hosted fonts (bundled, inlined in the single-file build) + the stylesheet
import '@/assets/fonts/fonts.css'
import '@/assets/scss/main.scss'

// components — registered globally so templates keep using kebab tags (<top-bar/>, <icon/>, …)
import T from '@/components/T.vue'
import Tc from '@/components/Tc.vue'
import Icon from '@/components/Icon.vue'
import SmartImg from '@/components/SmartImg.vue'
import Toast from '@/components/Toast.vue'
import MorePill from '@/components/MorePill.vue'
import SkillChip from '@/components/SkillChip.vue'
import RoleChip from '@/components/RoleChip.vue'
import SectionBlock from '@/components/SectionBlock.vue'
import SectionHead from '@/components/SectionHead.vue'
import TopBar from '@/components/TopBar.vue'
import Hero from '@/components/Hero.vue'
import CTA from '@/components/CTA.vue'
import FilterBar from '@/components/FilterBar.vue'
import SkillBanner from '@/components/SkillBanner.vue'
import VideoNote from '@/components/VideoNote.vue'
import VideoModal from '@/components/VideoModal.vue'
import GuideModal from '@/components/GuideModal.vue'
import FeedbackForm from '@/components/FeedbackForm.vue'
import ViewToggles from '@/components/ViewToggles.vue'
import ContactMenu from '@/components/ContactMenu.vue'
import HeroName from '@/components/HeroName.vue'
import HeroPortrait from '@/components/HeroPortrait.vue'
import HeroRoles from '@/components/HeroRoles.vue'
import HeroLead from '@/components/HeroLead.vue'
import HeroStats from '@/components/HeroStats.vue'
import SkillGroup from '@/components/SkillGroup.vue'
import Skills from '@/components/Skills.vue'
import TimelineSpine from '@/components/TimelineSpine.vue'
import Project from '@/components/Project.vue'
import ConfItem from '@/components/ConfItem.vue'
import ConfList from '@/components/ConfList.vue'
import Epoch from '@/components/Epoch.vue'
import Timeline from '@/components/Timeline.vue'
import HowIWork from '@/components/HowIWork.vue'
import LearnCard from '@/components/LearnCard.vue'
import Testimonial from '@/components/Testimonial.vue'
import Certificates from '@/components/Certificates.vue'
import EduLangSection from '@/components/EduLangSection.vue'
import AppFooter from '@/components/AppFooter.vue'
import SectionNav from '@/components/SectionNav.vue'

const app = createApp(App)
app.provide(storeKey, store)

// translate functions as template globals — templates use $t(...) for attribute values
// and the <t> / <tc> components for visible text (see components/T.vue, Tc.vue)
app.config.globalProperties.$t = t
app.config.globalProperties.$tc = tc

const components: Record<string, unknown> = {
  t: T,
  tc: Tc,
  icon: Icon,
  'smart-img': SmartImg,
  toast: Toast,
  'more-pill': MorePill,
  'skill-chip': SkillChip,
  'role-chip': RoleChip,
  'section-block': SectionBlock,
  'section-head': SectionHead,
  'top-bar': TopBar,
  hero: Hero,
  cta: CTA,
  'filter-bar': FilterBar,
  'skill-banner': SkillBanner,
  'video-note': VideoNote,
  'video-modal': VideoModal,
  'guide-modal': GuideModal,
  'feedback-form': FeedbackForm,
  'view-toggles': ViewToggles,
  'contact-menu': ContactMenu,
  'hero-name': HeroName,
  'hero-portrait': HeroPortrait,
  'hero-roles': HeroRoles,
  'hero-lead': HeroLead,
  'hero-stats': HeroStats,
  'skill-group': SkillGroup,
  skills: Skills,
  'timeline-spine': TimelineSpine,
  project: Project,
  'conf-item': ConfItem,
  'conf-list': ConfList,
  epoch: Epoch,
  timeline: Timeline,
  'how-i-work': HowIWork,
  'learn-card': LearnCard,
  testimonial: Testimonial,
  certificates: Certificates,
  'edu-lang-section': EduLangSection,
  'app-footer': AppFooter,
  'section-nav': SectionNav,
}
for (const [tag, comp] of Object.entries(components)) {
  app.component(tag, comp as Parameters<typeof app.component>[1])
}

app.mount('#app')
window.__appReady = true
