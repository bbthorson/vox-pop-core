// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.phonicfactory.com',
	integrations: [
		starlight({
			title: 'Vox Pop Core',
			description: 'Open-source core of Vox Pop — audio interaction infrastructure.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/bbthorson/vox-pop-core' },
			],
			sidebar: [
				{
					label: 'Introduction',
					items: [
						{ label: 'What is Vox Pop Core?', slug: 'introduction/overview' },
						{ label: 'Architecture', slug: 'introduction/architecture' },
					],
				},
				{
					label: 'Self-hosting',
					items: [
						{ label: 'Quick start', slug: 'self-hosting/quick-start' },
						{ label: 'Configuration', slug: 'self-hosting/configuration' },
					],
				},
				{
					label: 'Build your own',
					items: [
						// Conceptual hub. The embed walkthrough now lives under
						// How-to guides (it's a task-oriented recipe); this page
						// cross-links to it in prose, so it isn't orphaned.
						{ label: 'Build your own app', slug: 'build-your-own/overview' },
					],
				},
				{
					label: 'How-to guides',
					items: [
						// Task-oriented recipes that orchestrate multiple
						// endpoints. The embed walkthrough is a how-to in
						// spirit (it composes the public fetch + render), so
						// it anchors this section as the first recipe.
						{ label: 'Example: the embed app', slug: 'build-your-own/embed-example' },
					],
				},
				{
					label: 'API reference',
					items: [
						{ label: 'Overview', slug: 'api/overview' },
						// Live Scalar-rendered endpoint reference. Standalone
						// Astro page (src/pages/api/reference.astro) outside
						// Starlight content because Scalar needs the full
						// viewport to render its own sidebar/nav.
						{ label: 'Endpoint reference', link: '/api/reference/' },
					],
				},
			],
		}),
	],
});
