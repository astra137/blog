import lume from 'lume/mod.ts'
import blog from 'blog/mod.ts'
import highlight from 'lume/plugins/code_highlight.ts'
import picture from 'lume/plugins/picture.ts'
import transformImages from 'lume/plugins/transform_images.ts'

const site = lume({}, {
	markdown: {
		options: {
			linkify: true,
		},
	},
})

site.use(
	blog({
		prism: {
			extensions: [], // disable Prism
		},
	}),
)

site.use(highlight())
site.use(picture())
site.use(transformImages())
site.copy('uploads')

export default site
