![banner](banner.png)

# 介绍

Wayland 是 Unix 操作系统的下一代图像显示服务架构。该项目由经典 Xorg 的原班人马打造，是将应用程序的图形界面显示在用户屏幕的最佳选择。之前使用过 X11 的读者会对 Wayland 的改进感到惊喜，而之前未接触过 Unix 图像学的新手，也会发现 Wayland 系统在构建图形显示方面的强大、灵活之处。

这本书将会帮助您深入理解 Wayland 的概念、设计和实现，并为您提供构建构建 Wayland 客户端和合成器所需的工具。随着阅读的进行，我们会建立起 Wayland 的架构模型、理解其设计理念。在书中，你会恍然大悟，Wayland 的设计是那么的清晰、直观，然后被吸引着一直看下去。欢迎探索开源图形学的未来！

**注意：** 这还是个草稿，1-10 章基本完善，不过后续会有所更新，11 章后很多内容有待撰写。

### TODO

- Expand on resource lifetimes and avoiding race conditions in chapter 2.4
- Move linux-dmabuf details to the appendix, add note about wl_drm & Mesa
- Rewrite the introduction text
- Add example code for interactive move, to demonstrate the use of serials
- Use — instead of - where appropriate
- Prepare PDFs and EPUBs

## 关于这本书

本书采用 [mdbook](https://github.com/rust-lang/mdBook) 构建，译者翻译水平有限，疑问请自寻原书解答，许可[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/)同源。

自译项目仓库地址：[https://github.com/axionl/the_wayland_protocol_zh_CN](https://github.com/axionl/the_wayland_protocol_zh_CN)  
本译在线阅读地址 [https://wayland.axionl.me](https://wayland.axionl.me)

### 英文原版

阅读地址 [https://wayland-book.com](https://wayland-book.com)  
项目仓库 [https://git.sr.ht/~sircmpwn/wayland-book](https://git.sr.ht/~sircmpwn/wayland-book)

## 关于作者

用 Drew 的密切合作者 Preston Carpenter 的话来说：

Drew DeVault 从 [sway](https://swaywm.org/) 的建造开始，逐渐进入到 Wayland 的世界。sway 是 X11 最受欢迎的平铺式窗口管理器 i3wm 在 Wayland 的克隆，从用户、开发提交数、影响力等角度来看，sway 都是目前 Wayland 下最受欢迎的平铺式窗口管理器。随着 sway 的成功，Drew 回到 Wayland 社区开始 wlroots 的工作：可用于构建 Wayland 合成器的定制化、组件化基础库。现今，已有数十个不同的合成器在 wlroots 基础之上而构造，而 Drew 也成为 Wayland 领域的重要专家之一。
