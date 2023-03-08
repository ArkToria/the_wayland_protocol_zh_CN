# The Wayland Protocol 中文版

阅读地址：<https://wayland.arktoria.org/>  
英文原版：<https://wayland-book.com/>  
版权许可：Creative Commons Attribution-ShareAlike 4.0 International License

**译者水平有限，出现问题首先怀疑翻译，其次怀疑版本太老，欢迎提出质疑。**
以下几点需要明确一下，避免造成阅读阻碍：

1. Wayland 是新一代图形显示协议

    部分场景中支持没有 X11 好，如录屏、截图、远程、输入法等，Wayland 就像安卓高版本的新 API，应用程序未适配，接口本身也可能在 unstable 状态。

    目前 X11 兼容层 XWayland 在 HiDPI 等方面不尽人意，如果应用支持 Wayland 原生显示，请尽量通过设置环境变量等调整为 Wayland。

2. Wayland 的新架构 & 名词定义

    Wayland 是 C/S 模型工作的，文中所说 Client、客户端……都指 Application 应用程序，如火狐浏览器。

    在另一端的 Wayland Server，不仅负责与 Clients 通信，更要把接收到来的图像，合成后呈现到显示器上，也就是说 **在 Wayland 中 Server、Window Manager 是二位一体的。**
因此文中的 Server、服务端、合成器、混成器、窗口管理器等所指相同。

3. 有关 Wayland 的更多资料

    项目官网 <https://wayland.freedesktop.org/> 上除了代码仓库和邮箱列表过于复杂外，其余链接都值得花时间看。

    本文原作者 Drew DeVault 是 sway 及 wlroots 的创始人，现致力于 sr.ht 代码协作平台（GitHub 类似）、hare 编程语言（C 语言类似）等新项目，Wayland 项目已交由其他人来做，**因此本书在停更状态**。
    他的博客 <https://drewdevault.com/> 上也有一些参考信息。

- [An introduction to Wayland - Drew DeVault][1]
- [Wayland (protocol) - Wikipedia][2]
- [Wayland client basics How to natively speak Wayland in your application, from the bottom up - YouTube][3]
- [Coelacanthus - X11 与 Wayland - 20220518 - PLCT 实验室- 哔哩哔哩][4]
- [桌面系统的混成器简史 - Farseerfc 的小窝][5]

[1]: https://drewdevault.com/2017/06/10/Introduction-to-Wayland.html
[2]: https://en.wikipedia.org/wiki/Wayland_(protocol)
[3]: https://www.youtube.com/watch?v=KbryyNrMYl4
[4]: https://www.bilibili.com/video/BV1sS4y187Vr/
[5]: https://farseerfc.me/zhs/brief-history-of-compositors-in-desktop-os.html
