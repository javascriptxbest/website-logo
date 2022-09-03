import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
	target: 'static',
	router: {
		base: '/website-logo/'
	},
	generate: {
		dir: 'docs'
	},
	css: [
		'~/assets/main.css'
	]
})
