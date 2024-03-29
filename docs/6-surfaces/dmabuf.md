# Linux dmabuf

大多数 Wayland 混成器在 GPU 上进行渲染，而许多 Wayland 客户端也同样在 GPU 上进行渲染。在这种情况下，使用共享内存的方法，从客户端向混成器发送缓冲区是非常低效的。 因为客户端必须将它们的数据从 GPU 读到 CPU，然后混成器必须将其从 CPU 中读回 GPU 以进行渲染。

Linux 上的 DRM (直接渲染管理器 Direct Rendering Manager) 接口（在一些 BSD 中也有实现）为我们提供了一种向 GPU 资源暴露句柄的方法。Mesa 是用户态 Linux 图形驱动的主要实现方式，它实现了一个协议，允许 EGL 用户将 GPU 缓冲区的句柄从客户端传输到混成器上进行渲染，而无需将数据复制到 GPU 上 *（原文此处写成 GPU，也可以理解为从 GPU 到 CPU 再到 GPU，这一二次传递过程，总的来说是省略了多余的 GPU 通信过程）*[^1]。

这个协议的内部工作原理不在本书讨论范围内，那些专注于 Mesa 或 Linux DRM 的资源更适合进一步学习。然而，我们也可以提供一个关于使用的简短总结：

1. 将 `eglGetPlatformDisplayEXT` 和 `EGL_PLATFORM_WAYLAND_KHR` 一起使用来创建一个 EGL 显示。
2. 照常配置显示，选择一个适合自己情况的配置，将 EGL_SURFACE_TYPE 设置成 `EGL_WINDOW_BIT`。
3. 使用 `wl_egl_window_create` 来为一个给定的 `wl_surface` 创建一个 `wl_egl_window`。
4. 使用 `eglCreatePlatformWindowSurfaceEXT` 为 `wl_egl_window` 创建一个 `EGLSurface`。
5. 照常使用 EGL，例如，使用 `eglMakeCurrent` 让表面的 EGL 上下文处于当前状态，使用 `eglSwapBuffers` 向混成器发送最新的缓冲区并提交表面内容。

如果你之后需要改变 `wl_egl_window` 的大小，可以使用 `wl_egl_window_resize` 来实现。

## 但我真的想要知道内部实现

一些不使用 `libwayland` 的 Wayland 程序员抱怨说，这种方法将 Mesa 和 libwayland 捆绑在一起，诚然如此。然而，解偶也并非不能——它只是需要你自己以 linux-dmabuf 的形式做大量的实现。关于协议的细节请参考 Wayland 扩展的 XML，以及 Mesa 在 `src/egl/drivers/dri2/platform_wayland.c` 的实现（在撰写本文时的文件路径）。祝你好运！

## 对于服务端

不幸的是，混成器的细节既复杂又超出了本书的范围。不过我可以给你指出正确的方向：`wlroots` 的实现很简单[^2]，应该可以让你走上正确的道路。

[^1]: 感谢 quininer 老师对此处翻译细节的指正

[^2]: 截至写作时，应该可以在 `types/wlr_linux_dmabuf_v1.c` 中找到
