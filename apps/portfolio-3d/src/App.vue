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

type Resume = typeof resume
const data: Resume = resume
</script>

<template>
  <main class="nb-stack">
    <HeroSection :name="data.name" :title="data.title" :contact="data.contact" />

    <AboutSection :summary="data.summary" />

    <ExperienceSection :experience="data.experience" />

    <ProjectsSection :projects="data.projects" />

    <SkillsSection :skills="data.skills" />

    <EducationSection :education="data.education" />

    <CertificatesSection :certificates="data.certificates" />

    <LanguagesInterestsSection :languages="data.languages" :interests="data.interests" />

    <ContactSection :contact="data.contact" />

    <FooterBar :name="data.name" />
  </main>
</template>

<style scoped>
</style>
