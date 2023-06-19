![banner](banner.png)

# 绪论

Wayland 是类 UNIX 系统的新一代图像显示服务。
该项目由经典的 Xorg 的原班人马打造，是将应用程序的图形化界面（GUI）显示到用户屏幕的最佳选择。
之前使用过 X11 的读者会对 Wayland 的改进感到惊喜，而之前未接触过 Unix 图形学的新人，也会发现 Wayland 在构建 GUI 显示方面的强大、灵活之处。

这本书将会帮助您深入理解 Wayland 的概念、设计和实现，并为您提供构建构建 Wayland 客户端 和 Wayland 合成器所需的工具。
随着阅读的进行，我们会建立起 Wayland 的理论架构并了解其设计理念。
在阅读中，你会感到惊喜，因为 Wayland 的设计非常的直观而且清晰的，这应该有助于你继续看下去。欢迎探索开源图形学的未来！

> 这还是个草稿，1-10 章基本完善，不过会有后续更新，11 章后很多内容有待撰写。

**TODO:**

- Expand on resource lifetimes and avoiding race conditions in chapter 2.4
- Move linux-dmabuf details to the appendix, add note about wl_drm & Mesa
- Rewrite the introduction text
- Add example code for interactive move, to demonstrate the use of serials
- Use — instead of - where appropriate
- Prepare PDFs and EPUBs

## 英文原版

在线阅读 [wayland-book.com](https://wayland-book.com)  
项目地址 [git.sr.ht/~sircmpwn/wayland-book](https://git.sr.ht/~sircmpwn/wayland-book)

## 关于作者

用 Drew 的密切合作者 Preston Carpenter 的话来说：

从 sway 的建造开始，Drew DeVault 进入到 Wayland 的世界。
sway 是最受欢迎的平铺式窗口管理器 i3wm 在 Wayland 的克隆，从任何角度来说，包括用户、开发提交数量和影响力，sway 都是目前 Wayland 下最受欢迎的平铺式窗口管理器。
随着 sway 的成功，Drew 回馈 Wayland 社区 - 开启项目 wlroots：用于构建 Wayland 合成器的高定制化、组件化模块包。
现今，已有数十个不同的混成器在 wlroots 基础之上而构造，而 Drew 也成为 Wayland 领域的重要专家之一。
