import cms from 'blog/_cms.ts'

export default cms

// TODO: Temporary cms config until full blog rewrite
cms.document(
	'settings: Global settings for the site',
	'src:_data.yml',
	[
		{
			name: 'lang',
			type: 'text',
			label: 'Language',
		},
		{
			name: 'home',
			type: 'object',
			fields: [
				{
					name: 'welcome',
					type: 'text',
					label: 'Title',
					description: 'Welcome message in the homepage',
				},
			],
		},
		{
			name: 'menu_links',
			type: 'object-list',
			fields: [
				{
					name: 'text',
					type: 'text',
					label: 'text',
				},
				{
					name: 'href',
					type: 'text',
					label: 'href',
				},
			],
		},
		{
			name: 'extra_head',
			type: 'code',
			description: 'Extra content to include in the <head> tag',
		},
		{
			name: 'metas',
			type: 'object',
			description: 'Meta tags configuration.',
			fields: [
				'site: text',
				'description: text',
				'title: text',
				'image: text',
				'twitter: text',
				'lang: text',
				'generator: checkbox',
			],
		},
	],
)
