# The Wayland Protocol（自译中文版）

阅读地址：https://wayland.axionl.me/  
英文原版：https://wayland-book.com/  
版权许可：[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/)

## 开始之前

在开始之前需要明确几个点，以免翻译造成的错误影响阅读

### 1. Wayland 是下一代图形显示协议

首先兼容性肯定没有 X11 好，如果你的有些场景中，需要录屏、截图、远程、输入法等，可能会遇到一些问题，这是因为 Wayland 就像安卓高版本一样，规范了很多 API，接口本身可能还在 unstable 版本，应用程序也没适配好。

目前 X11 兼容层 XWayland 在 HiDPI 等方面不尽人意，如果应用支持 Wayland 原生显示，请尽量通过设置环境变量等调整为 Wayland。

### 2. Wayland 的新架构 & 名词定义

Wayland 是 C/S 模型工作的，文中所说 client、客户端……都指 Application 应用程序，如火狐浏览器。

在另一端的 Wayland server，不仅负责与 client 通信，更要把接收到来的图像，合成后呈现到显示器上，也就是说

**在 Wayland 中 server、window manager 是二位一体的**

因此文中的 server、服务端、合成器、混成器、窗口管理器……所指相同。

### 3. 有关 Wayland 的更多资料

https://wayland.freedesktop.org/ 项目官网，除了代码仓库和邮箱列表，其它每一个链接都值得看看

本文原作者 Drew DeVault 是 sway 及 wlroots 的创始人，他现在致力于开发 sr.ht 代码协作平台（GitHub 类似）、hare 编程语言（C 语言类似）等，Wayland 已经交给其他人来做，所以本书在停更状态。作者的博客 https://drewdevault.com/ 对于基于 wlroots 开发合成器有很多参考内容。

- [An introduction to Wayland - Drew DeVault](https://drewdevault.com/2017/06/10/Introduction-to-Wayland.html)
- [Wayland (protocol) - Wikipedia](<https://en.wikipedia.org/wiki/Wayland_(protocol)>)
- [(7) Wayland client basics How to natively speak Wayland in your application, from the bottom up - YouTube](https://www.youtube.com/watch?v=KbryyNrMYl4)
- [Coelacanthus - X11 与 Wayland - 20220518 - PLCT 实验室（内部报告，仅用于关系者交流技术进展）- 哔哩哔哩](https://www.bilibili.com/video/BV1sS4y187Vr/)
- [桌面系统的混成器简史 - Farseerfc 的小窝](https://farseerfc.me/zhs/brief-history-of-compositors-in-desktop-os.html)
