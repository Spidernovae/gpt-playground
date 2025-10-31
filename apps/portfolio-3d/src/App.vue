<script setup lang="ts">
import resume from './assets/resumeData'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import EducationSection from './components/EducationSection.vue'
import CertificatesSection from './components/CertificatesSection.vue'
import LanguagesInterestsSection from './components/LanguagesInterestsSection.vue'
import ContactSection from './components/ContactSection.vue'
import FooterBar from './components/FooterBar.vue'
import vReveal from './directives/reveal'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { SmoothScroller, shouldEnableSmooth } from './utils/smoothScroll'

type Resume = typeof resume
const data: Resume = resume
const vRevealDirective = vReveal

const rootRef = ref<HTMLElement | null>(null)
let scroller: SmoothScroller | null = null

onMounted(() => {
  const el = rootRef.value
  if (el && shouldEnableSmooth()) {
    scroller = new SmoothScroller(el, 0.12)
    scroller.mount()
  }
})

onBeforeUnmount(() => {
  scroller?.unmount()
  scroller = null
})
</script>

<template>
  <main ref="rootRef" class="nb-stack smooth-root">
    <HeroSection v-reveal="vRevealDirective" :name="data.name" :title="data.title" :contact="data.contact" />

    <AboutSection v-reveal="vRevealDirective" :summary="data.summary" />

    <ExperienceSection v-reveal="vRevealDirective" :experience="data.experience" />

    <ProjectsSection v-reveal="vRevealDirective" :projects="data.projects" />

    <SkillsSection v-reveal="vRevealDirective" :skills="data.skills" />

    <EducationSection v-reveal="vRevealDirective" :education="data.education" />

    <CertificatesSection v-reveal="vRevealDirective" :certificates="data.certificates" />

    <LanguagesInterestsSection v-reveal="vRevealDirective" :languages="data.languages" :interests="data.interests" />

    <ContactSection v-reveal="vRevealDirective" :contact="data.contact" />

    <FooterBar :name="data.name" />
  </main>
</template>

<style scoped>
</style>
