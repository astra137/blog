---
title: Custom MSDF shaders in Godot 4
date: '2023-08-07'
draft: false
tags:
  - gamedev
  - msdf
  - shader
  - godot
comments: {}
---
Watch [Martin Donald's *Glyphs, shapes, fonts, signed distance fields*](https://www.youtube.com/watch?v=1b5hIMqz_wM) and you'll understand why I was so curious about a new toggle in StandardMaterial3D resources in Godot Engine's version 4 beta releases.

<!--more -->

![Godot Engine StandardMaterial3D Texture MSDF checkbox](https://cdn.some.pics/astra/64d1505e101ec.png)

The easiest way to use multichannel signed distance fields in Godot Engine is while importing fonts.

![Godot Engine font import checkbox for multichannel signed distance field](https://cdn.some.pics/astra/64d1521acfe1b.png)

However, I could not use an imported font (and Label3D) because I wanted to stylize font glyphs with a custom shader. I hoped that the MSDF created by importing a font is the same kind of MSDF as used by StandardMaterial3D. Searching found that [Juan mentioned](https://twitter.com/reduzio/status/1431326129244327945) the [merge request that adds MSDF support for fonts](https://github.com/godotengine/godot/pull/51908). Luckily, it turns out that Godot Engine uses code from [Chlumsky/msdfgen](https://github.com/Chlumsky/msdfgen) to create MSDFs, which also publishes an executable release. The website https://opentype.js.org/font-inspector.html helped me extract a list of ligature glyph codes from the font I am using. I wrote some JavaScript for  Deno to automate generating each MSDF image from the font inspector JSON. Experiment with msdfgen options like `msdf` versus `mtsdf`.

```js
import { ensureDir } from 'https://deno.land/std/fs/ensure_dir.ts'
import lig from './sitelen-pona-pona.json' assert { type: 'json' }

await ensureDir('./gen')

for (const { ligGlyph } of lig.subtables[0].ligatureSets[0]) {
	const command = new Deno.Command('msdfgen', {
		stdout: 'inherit',
		stderr: 'inherit',
		args: [
			'mtsdf',
			'-font',
			'sitelen-pona-pona.otf',
			`g${ligGlyph}`,
			'-o',
			`gen/${ligGlyph}.png`,
			'-size',
			'32',
			'32',
			'-pxrange',
			'4',
			'-autoframe',
		],
	})

	const { code } = await command.output()
	if (code !== 0) {
		throw new Error(`msdfgen returned ${code}`)
	}
}
```

At this point, the generated MSDF images can be used as albedo textures in StandardMaterial3D with MSDF enabled. Don't forget to also enable transparency in the material. The following screenshot shows an unshaded material with alpha scissor.

![MSDF rendered with StandardMaterial3D in Godot Engine](https://cdn.some.pics/astra/64d15ddc2df3a.png)

StandardMaterial3D resources can be converted into ShaderMaterials and then modified.

![StandardMaterial3D right-click menu with option for Convert to ShaderMaterial](https://cdn.some.pics/astra/64d15e02b700c.png)

For my project, I am using simplex noise and the red and green channels of the MSDF to animate and stylize the glyphs somewhat according to their shape.

![MSDF rendered with custom shader in Godot Engine](https://cdn.some.pics/astra/64d15e3e3a27d.png)
