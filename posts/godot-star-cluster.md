---
title: Semi-realistic star cluster in Godot
date: '2023-06-21'
draft: false
tags: []
comments: {}
---
An experiment in using semi-realistic cosmic data in Godot Engine. https://github.com/astra137/godot-star-cluster

![stars rendered in Godot Engine](/uploads/godot-star-cluster.png)

<!--more -->

> I exported this project for web once, but it looks much less pretty. Use WASD to move, mousewheel to change speed, and 1-3 to fly to preset stars.
>
> https://ambedo-game.netlify.app

It features an extension written in Rust with
[gdext](https://github.com/godot-rust/gdext), random star placement in a cluster
using a normal distribution, a Kroupa-like IMF for mass values, and
blackbody-like colors.

It also features an attempt at
[emulated double precision](https://blog.cyclemap.link/2011-06-09-glsl-part2-emu/)
in the shader that renders the stars. The experiment was partially successful:
as the sky/starfield camera gets very, very close to a star (rendered as point
mesh in a multimesh), the star visibly wiggles just before vanishing due to near
clipping. The POV must get much closer before the sphere mesh of the star is
large enough to be seen.

To improve the effect, I think an additional layer should be responsible for
intermediate distances. It would functionally overlap with the far plane of the
primary camera and the near plane of the starfield camera. Practically, it could
be another render layer like the starfield. It could also be system of scaling,
billboarded sprites that render just inside of the primary camera's far plane
(which is similar to how stars currently work in this demo).
