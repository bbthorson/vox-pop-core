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
					label: 'API reference',
					items: [
						{ label: 'Overview', slug: 'api/overview' },
					],
				},
			],
		}),
	],
});
