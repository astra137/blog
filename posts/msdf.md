---
title: Custom MSDF shaders in Godot
date: '2023-08-07'
draft: false
tags:
  - gamedev
  - godot
  - shader
comments:
  src: 'https://social.lol/@astra/110850531245882005'
---
I created stylized magic glyphs from a conlang font by using multichannel signed
distance fields in Godot Engine 4.

<video src="/uploads/msdf_animated.webm" controls loop muted title="blue glowing symbol meaning ante in toki pona"></video>

<!--more -->

Watch
[Martin Donald's _Glyphs, shapes, fonts, signed distance fields_](https://www.youtube.com/watch?v=1b5hIMqz_wM)
and you'll understand why I was so curious about a new toggle in
StandardMaterial3D resources in Godot Engine's version 4 beta releases.

![Screenshot, Godot StandardMaterial3D Texture MSDF checkbox](/uploads/msdf_material_flag.png)

The easiest way to use multichannel signed distance fields in Godot is while
importing fonts.

![Screenshot, Godot font import checkbox for multichannel signed distance field](/uploads/msdf_font_import_flag.png)

The goal: I wanted to use
[jackhumbert's toki pona font](https://github.com/jackhumbert/sitelen-pona-pona)
to create magic glyphs that worked like Label3D, but stylized with my own
shader.

The problem: Imported fonts and Label3D do not have easily customizable shaders.

I decided to investigate rendering the font without Label3D.
[Juan mentioned](https://twitter.com/reduzio/status/1431326129244327945) the
[merge request that adds MSDF support for fonts](https://github.com/godotengine/godot/pull/51908),
which revealed that Godot created MSDFs from fonts using
[Chlumsky/msdfgen](https://github.com/Chlumsky/msdfgen). An
[online font inspector](https://opentype.js.org/font-inspector.html) helped me
extract a list of ligature glyph codes (`sitelen-pona-pona.json` in the script
below). I automated executing msdfgen for each glyph.

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

> Experiment with msdfgen options like `msdf` versus `mtsdf`, `-size` 32 versus
> 48, and `-autoframe` versus not.

At this point, the generated MSDF images can be used as albedo textures in
StandardMaterial3D with MSDF and transparency enabled. The following screenshot
shows an unshaded material with alpha scissor.

![Screenshot, MSDF rendered with StandardMaterial3D](/uploads/msdf_demo_default.png)

StandardMaterial3D resources can be right-clicked and converted into
ShaderMaterials and then customized.

![Screenshot, StandardMaterial3D right-click menu with option for Convert to ShaderMaterial](/uploads/msdf_convert_to_shader.png)

As an experiment, I used simplex noise and the red and green channels of the
MSDF to animate and stylize the glyphs somewhat according to their shape.

![Screenshot, MSDF rendered with custom shader](/uploads/msdf_demo_custom.png)

```glsl
// NOTE: Shader automatically converted from Godot Engine 4.1.1.stable's StandardMaterial3D.

shader_type spatial;
render_mode cull_disabled, unshaded;
uniform vec4 albedo : source_color;
uniform sampler2D texture_albedo : source_color,filter_linear_mipmap,repeat_enable;
uniform float msdf_pixel_range = 4;
uniform float msdf_outline_size = 0;


vec3 hash_nearzero(vec3 p) {
	const uint UI0 = 1597334673U;
	const uint UI1 = 3812015801U;
	const uvec3 UI3 = uvec3(UI0, UI1, 2798796415U);
	const float UIF = 1.0 / 4294967296.0;
	uvec3 q = uvec3(ivec3(p)) * UI3;
	q = (q.x ^ q.y ^ q.z) * UI3;
	return vec3(q) * UIF - 0.5;
}

// 3d simplex noise
// https://www.shadertoy.com/view/XsX3zB
// Copyright 2013 Nikita Miropolskiy (MIT License)
float simplex3d(vec3 p) {
	// skew constants for 3d simplex functions
	const float F3 = 0.3333333;
	const float G3 = 0.1666667;

	// 1. find current tetrahedron T and it's four vertices
	// s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices
	// x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices

	// calculate s and x
	vec3 s = floor(p + dot(p, vec3(F3)));
	vec3 x = p - s + dot(s, vec3(G3));

	// calculate i1 and i2
	vec3 e = step(vec3(0.0), x - x.yzx);
	vec3 i1 = e*(1.0 - e.zxy);
	vec3 i2 = 1.0 - e.zxy*(1.0 - e);

	// x1, x2, x3
	vec3 x1 = x - i1 + G3;
	vec3 x2 = x - i2 + 2.0*G3;
	vec3 x3 = x - 1.0 + 3.0*G3;

	// 2. find four surflets and store them in d
	vec4 w, d;

	// calculate surflet weights
	w.x = dot(x, x);
	w.y = dot(x1, x1);
	w.z = dot(x2, x2);
	w.w = dot(x3, x3);

	// w fades from 0.6 at the center of the surflet to 0.0 at the margin
	w = max(0.6 - w, 0.0);

	// calculate surflet components
	d.x = dot(hash_nearzero(s), x);
	d.y = dot(hash_nearzero(s + i1), x1);
	d.z = dot(hash_nearzero(s + i2), x2);
	d.w = dot(hash_nearzero(s + 1.0), x3);

	// multiply d by w^4
	w *= w;
	w *= w;
	d *= w;

	// 3. return the sum of the four surflets
	return dot(d, vec4(52.0));
}

// Psuedorandom in [-0.5, 0.5]
vec3 hash(vec3 v) {
	const uint K = 1103515245U;
	const float F = 1.0 / 4294967295.0;
	uvec3 x = uvec3(ivec3(v));
	x = ((x>>8U)^x.yzx)*K;
	x = ((x>>8U)^x.yzx)*K;
	x = ((x>>8U)^x.yzx)*K;
	return vec3(x) * F - 0.5;
}

float msdf_median(float r, float g, float b, float a) {
	return min(max(min(r, g), min(max(r, g), b)), a);
}

void vertex() {
	// Billboard
	//MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
	//MODELVIEW_MATRIX = MODELVIEW_MATRIX * mat4(vec4(length(MODEL_MATRIX[0].xyz), 0, 0, 0), vec4(0, length(MODEL_MATRIX[1].xyz), 0, 0), vec4(0, 0, length(MODEL_MATRIX[2].xyz), 0), vec4(0, 0, 0, 1));
	//MODELVIEW_NORMAL_MATRIX = mat3(MODELVIEW_MATRIX);
}

void fragment() {
	vec2 base_uv = UV;
	vec4 albedo_tex_pre = texture(texture_albedo,base_uv);
	base_uv += 0.1 * simplex3d(vec3(UV + albedo_tex_pre.gr * 2.0, 0.5f * TIME));
	vec4 albedo_tex = texture(texture_albedo,base_uv);
	{
		albedo_tex.rgb = mix(vec3(1.0 + 0.055) * pow(albedo_tex.rgb, vec3(1.0 / 2.4)) - vec3(0.055), vec3(12.92) * albedo_tex.rgb.rgb, lessThan(albedo_tex.rgb, vec3(0.0031308)));
		vec2 msdf_size = vec2(msdf_pixel_range) / vec2(textureSize(texture_albedo, 0));
		vec2 dest_size = vec2(1.0) / fwidth(base_uv);
		float px_size = max(0.5 * dot(msdf_size, dest_size), 1.0);
		float d = msdf_median(albedo_tex.r, albedo_tex.g, albedo_tex.b, albedo_tex.a) - 0.5;
		if (msdf_outline_size > 0.0) {
			float cr = clamp(msdf_outline_size, 0.0, msdf_pixel_range / 2.0) / msdf_pixel_range;
			albedo_tex.a = clamp((d + cr) * px_size, 0.0, 1.0);
		} else {
			albedo_tex.a = clamp(d * px_size + 0.5, 0.0, 1.0);
		}
		albedo_tex.rgb = vec3(1.0);
	}
	ALBEDO = albedo.rgb * albedo_tex.rgb;
	ALPHA *= albedo.a * albedo_tex.a;
}
```
