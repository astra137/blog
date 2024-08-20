---
title: Deploying coturn on fly.io
date: '2024-08-20'
draft: false
tags:
  - gamedev
  - devops
  - webrtc
comments: {}
---

It is possible to deploy [coturn](https://github.com/coturn/coturn) TURN server
on fly.io, but I don't recommend it.

<!-- more -->

## Example fly.toml

```toml
app = 'coturn-astra137'
primary_region = 'sea'

[build]
image = 'ghcr.io/coturn/coturn'

[experimental]
cmd = [
	'--log-file=stdout',
	'--external-ip=$(detect-external-ip)',
	'--listening-ip=0.0.0.0',
	'--listening-ip=fly-global-services',
	'--relay-ip=fly-global-services',
	'--fingerprint',
	'--realm=$DEFAULT_REALM',
	'--use-auth-secret',
	'--static-auth-secret=$AUTH_SECRET',
	'--verbose',
]

#[env]
#REAL_EXTERNAL_IP = '169.155.49.225'

[[services]]
protocol = 'tcp'
internal_port = 3478

[[services.ports]]
port = 3478

[[services]]
protocol = 'udp'
internal_port = 3478

[[services.ports]]
port = 3478

[[vm]]
memory = '512mb'
cpu_kind = 'shared'
cpus = 1
```

## Technical Notes

Fly runs machines behind routing layers, so coturn must be supplied with the
external IP, as with AWS or other NAT situations.

The result of `detect-external-ip` can be forced using the `REAL_EXTERNAL_IP`
environment variable.

UDP listeners must be bound to `fly-global-services`, per
https://fly.io/docs/networking/udp-and-tcp/.

Addition services aren't necessary since declaring any UDP port in fly.toml
captures all UDP inbound traffic, per
https://community.fly.io/t/udp-mtu-and-the-webrtc-turn-protocol/3742/4.

I gave up testing automatic startup and shutdown, but I suspect it will require
a custom Dockerfile that adds a webserver running in parallel with coturn. It
might just work as expected with UDP traffic, though.

## Comparison to DigitalOcean

One 1cpu,1g SEA Fly machine with a dedicated IPv4 costs ~$9/month. A similar
setup on DigitalOcean costs $6/month.

Coturn estimates a max of ~5000 connections in the Fly container, and coturn on
the droplet estimates ~500000 connections.

Getting TURN over (D)TLS to work on Fly would require a custom Dockerfile that
downloads Fly's provisioned certificate through their GraphQL API, or uses Caddy
or Certbot and some kind of persistant storage to share certificates between
machines. On DigitalOcean, one can use a
[custom certbot script](https://serverfault.com/questions/849683/how-to-setup-coturn-with-letsencrypt).
