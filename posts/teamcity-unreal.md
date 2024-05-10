---
title: Automating Unreal Engine builds with TeamCity
date: '2024-05-08'
draft: false
tags:
  - unreal
  - teamcity
  - gamedev
  - devops
comments: {}
---
The goal: build Unreal Engine game artifacts for Windows using an existing Fedora Linux dedicated server and TeamCity. TL;DR: TeamCity is great. Run the agent in a VM.

<!--more -->

## Why use a VM?

TeamCity has an [official Unreal Engine plugin](https://plugins.jetbrains.com/plugin/22679-unreal-engine-support). Watch [JetBrains' own Youtube video](https://www.youtube.com/watch?v=U8aYW3Clg7I) for a demonstration of the plugin. TL;DR: it does everything for you.

I explored containers first. Unfortunately, Unreal Engine cannot cross-compile win64 builds from Linux. If you do want Linux builds, you might try creating custom TeamCity agent containers by extending the containers Epic provides, after you [connect your GitHub and Epic accounts](https://www.unrealengine.com/en-US/ue-on-github).

While experimenting and looking at TeamCity agent logs, I got the vibe that the TeamCity Unreal plugin would likely work in an environment where Unreal was installed "normally", like it would be on a workstation. So, that's exactly what I tried.

- Enable VMs on headless Fedora server
- Create Windows VM
- Install Epic Launcher and Unreal Engine
- Install Visual Studio for game development
- Install TeamCity agent
- Configure the build in TeamCity
- ???
- Glorious Victory for Managed Democracy

Warning: I have no idea what the performance implications are. I don't know what the legal complexities are. These are my research notes to determine if the solution is viable for some friends.

## Setting up the VM

We enabled VMs on our Fedora server with a BIOS setting, `libvirt`, and `cockpit-machines`. The Cockpit plugin shows helpful messages if the server isn't configured correctly. It also provides a decent web GUI for managing and connecting to VMs.

I created a user-session Windows VM with 16 vCPUs, 8 GB of memory, and 120 GB of storage. So far, about 80 GB have been used up by the OS, Unreal Engine, and Visual Studio components. I tried to use GPU pass-through so that we could open Unreal editor in the VM, but that crashed our server in an ugly way.

Using `cockpit-machines` to remote control the VM, I installed Windows, Epic Launcher, Unreal Engine, and Visual Studio for game development with C++.

I installed TeamCity agent. TeamCity server is running on the VM's host, so I downloaded the agent installer at http://10.0.2.2:8111/installFullAgent.html. I was even able to use the host's LAN IP from within the VM. For Fedora, don't forget to open the port in the firewall in the libvirt zone, configurable in Cockpit. I used the same IP in the agent configuration file `C:\BuildAgent\conf\buildAgent.properties`.

I had to change some versions of Visual Studio components to make Unreal Engine happy. TeamCity Unreal plugin provides feedback in agent logs on failed builds. Two things that were important for me were adding .NET SDK and changing MSVC version.

- .NET Framework 4.8.1 SDK
- MSVC v143 - VS 2022 C++ x64/x86 build tools (v14.38-17.8)

Builds don't seem to take that log in the VM, and overall, it seems to be working great. TeamCity's P4V integration is good. The build logs are good. I love it.
