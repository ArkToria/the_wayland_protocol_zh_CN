import footnote from 'markdown-it-footnote'

export default {
  lang: 'zh-Hans',
  title: 'The Wayland Protocol Zh',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(footnote)
    }
  },
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/ArkToria/the_wayland_protocol_zh_CN/edit/main/docs/:path'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ArkToria/the_wayland_protocol_zh_CN' },
    ],
    nav: [
      { text: '英文原版', link: 'https://wayland-book.com/' },
      { text: '协议在线版', link: 'https://wayland.app/' },
    ],
    sidebar: [
      {
        text: '1. 绪论',
        items: [
          { text: '引言', link: '/1-introduction/' },
          { text: 'Wayland 上层设计', link: '/1-introduction/high-level-design' },
          { text: '目标和受众', link: '/1-introduction/goals' },
          { text: 'Wayland 软件包', link: '/1-introduction/package' }
        ]
      }, {
        text: '2. 协议设计',
        items: [
          { text: '引言', link: '/2-protocol-design/' },
          { text: '基础 Wire 协议', link: '/2-protocol-design/wire-protocol' },
          { text: '接口与事件请求', link: '/2-protocol-design/interfaces-reqs-events' },
          { text: '上层协议', link: '2-protocol-design/high-level' },
          { text: '协议设计规范', link: '/2-protocol-design/design-patterns' }
        ]
      }, {
        text: '3. libwayland',
        items: [
          { text: '引言', link: '/3-libwayland/' },
          { text: 'wayland-util 原语', link: '/3-libwayland/util' },
          { text: 'wayland-scanner', link: '/3-libwayland/wayland-scanner' },
          { text: '资源与代理', link: '/3-libwayland/proxies' },
          { text: '接口与监听', link: '/3-libwayland/interfaces' }
        ]
      }, {
        text: '4. wayland display',
        items: [
          { text: '引言', link: '/4-wayland-display/' },
          { text: 'display 创建', link: '/4-wayland-display/creation' },
          { text: '加入事件循环', link: '/4-wayland-display/event-loop' }
        ]
      }, {
        text: '5. 全局变量与注册',
        items: [
          { text: '引言', link: '/5-registry/' },
          { text: '绑定全局变量', link: '/5-registry/binding' },
          { text: '注册全局变量', link: '/5-registry/server-side' },
        ]
      }, {
        text: '6. 缓冲区与表面',
        items: [
          { text: '引言', link: '/6-surfaces/' },
          { text: 'wl_compositor 使用', link: '/6-surfaces/compositor' },
          { text: '共享内存 buffer', link: '/6-surfaces/shared-memory' },
          { text: 'Linux dmabuf', link: '/6-surfaces/dmabuf' },
          { text: 'Surface roles', link: '/6-surfaces/roles' },
        ]
      }, {
        text: '7. XDG Shell 基础',
        items: [
          { text: '引言', link: '/7-xdg-shell-basics/' },
          { text: 'XDG 表面', link: '/7-xdg-shell-basics/xdg-surface' },
          { text: '应用程序窗口', link: '/7-xdg-shell-basics/xdg-toplevel' },
          { text: '扩展示例代码', link: '/7-xdg-shell-basics/example-code' },
        ]
      }, {
        text: '8. 深入理解表面',
        items: [
          { text: '引言', link: '/8-surfaces-in-depth/' },
          { text: '表面的生命周期', link: '/8-surfaces-in-depth/lifecycle' },
          { text: '帧回调', link: '/8-surfaces-in-depth/frame-callbacks' },
          { text: '损坏表面', link: '/8-surfaces-in-depth/damaging-surfaces' },
          { text: '表面区域', link: '/8-surfaces-in-depth/surface-regions' },
          { text: '子表面', link: '/8-surfaces-in-depth/subsurfaces' },
          { text: '高分辨率表面（HiDPI）', link: '/8-surfaces-in-depth/hidpi' },
        ]
      }, {
        text: '9. Seats 处理输入',
        items: [
          { text: '引言', link: '/9-seat/' },
          { text: '光标指针输入', link: '/9-seat/pointer' },
          { text: 'XBK 简介', link: '/9-seat/xkb' },
          { text: '键盘输入', link: '/9-seat/keyboard' },
          { text: '触控输入', link: '/9-seat/touch' },
          { text: '扩展示例代码', link: '/9-seat/example' },
        ]
      }, {
        text: '10. 深入理解 XDG Shell',
        items: [
          { text: '引言', link: '/10-xdg-shell-in-depth/' },
          { text: '配置和生命周期', link: '/10-xdg-shell-in-depth/configuration' },
          { text: '弹出窗口', link: '/10-xdg-shell-in-depth/popups' },
          { text: '交互式移动和尺寸调整', link: '/10-xdg-shell-in-depth/interactive' },
          { text: '指针', link: '/10-xdg-shell-in-depth/positioners' },
        ]
      },
    ]
  }
}
