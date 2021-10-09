# The Wayland Protocol（自译中文版）

![banner](./src/banner.png)

## 说明
> 阅读地址：https://wayland.axionl.me/

本书采用 [mdBook](https://github.com/rust-lang/mdBook) 构建，译者翻译水平有限，疑问请自寻原书解答，许可同源。

许可：[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/)

## 导读

> Wayland 是一个为了替代 Xorg 服务而设计和构建的，用于类 Unix 系统的下一代显示服务。并自称是将应用程序窗口显示在用户屏幕上的最佳方法。过去曾经使用过 X11 的读者会对 Wayland 的改进感到惊喜，而 Unix 上的图形新手将发现它是一个灵活而强大的系统，可用于构建图形应用程序和桌面。

> 这本书将会帮助您深入理解 Wayland 的概念、设计和实现，并为您提供构建自行构建 Wayland 客户端和服务端所需的工具...