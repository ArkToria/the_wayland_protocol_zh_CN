![banner](banner.png)
# 介绍

Wayland 是一个为了替代 Xorg 服务而设计和构建的，用于类 Unix 系统的下一代显示服务。并自称是将应用程序窗口显示在用户屏幕上的最佳方法。过去曾经使用过 X11 的读者会对 Wayland 的改进感到惊喜，而 Unix 上的图形新手将发现它是一个灵活而强大的系统，可用于构建图形应用程序和桌面。

这本书将会帮助您深入理解 Wayland 的概念、设计和实现，并为您提供构建自行构建 Wayland 客户端和服务端所需的工具。在阅读过程中，我们将构建 Wayland 的理想模型，并建立对其原理的认知。在这本书中，你能发现许多令你恍然大悟的时刻，Wayland 直观的设计让选择变得更加明确，有利于保持顺畅的阅读体验。欢迎来到开源图形的未来！

**注意：** 这还只是草案。第一到第十章基本已完成，可能后续会有所更新。第十一章及后续内容大部分有待撰写。

### TODO

- Expand on resource lifetimes and avoiding race conditions in chapter 2.4
- Move linux-dmabuf details to the appendix, add note about wl_drm & Mesa
- Rewrite the introduction text
- Add example code for interactive move, to demonstrate the use of serials
- Use — instead of - where appropriate
- Prepare PDFs and EPUBs

## 关于这本书
本书采用 [mdbook](https://github.com/rust-lang/mdBook) 构建，译者翻译水平有限，疑问请自寻原书解答，许可同源。

自译项目地址：[https://github.com/axionl/the_wayland_protocol_zh_CN](https://github.com/axionl/the_wayland_protocol_zh_CN)

阅读地址：[https://wayland.axionl.me](https://wayland.axionl.me)

原书：[https://wayland-book.com](https://wayland-book.com/introduction.html)

许可：[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/)

源码：[https://git.sr.ht/~sircmpwn/wayland-book](https://git.sr.ht/~sircmpwn/wayland-book)

## 电子版

- EPUB 格式：由于 github page 页面目录结构配置问题，暂时无法提供，可以自行 `cargo install mdbook-epub` 安装最新版构建。
- PDF 格式：页面右上角打印

## 关于作者
用 Drew 紧密合作者 Preston Carpenter 的话来说：

Drew DeVault 从 [sway](https://swaywm.org/)（一个对广受欢迎的平铺式窗口管理器 i3wm 的克隆） 开启了自己的 Wayland 之路。 目前它俨然成为 Wayland 下最受欢迎的平铺式窗口管理器，无论是用户、提交数量还是影响力。随着它的成功，Drew 回到 Wayland 社区并开始 wlroots 的工作：一个用于构建 Wayland 混成器的灵活可组合的模块。如今它已经成为数十个混成器的基础，并且在 Wayland 领域 Drew 成为最重要的专家之一。

## 扩展阅读

- [桌面系统的混成器简史](https://farseerfc.me/zhs/brief-history-of-compositors-in-desktop-os.html)
- [X 中的混成器与 Composite 扩展](https://farseerfc.me/zhs/compositor-in-X-and-compositext.html)