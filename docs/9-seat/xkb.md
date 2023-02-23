# XBK 简介

> [X_keyboard_extension](https://wiki.archlinux.org/title/X_keyboard_extension)

我们清单上的下一个输入设备是键盘，但在讨论它们之前，我们需要先停下来补充一些额外的背景知识。键位映射 (Keymaps) 是键盘输入中涉及到的一个重要的细节，XKB 是 Wayland 上推荐的处理键盘的方式。

当你按下键盘上的一个键时，它会向计算机发送一个编码，这只是分配给该物理按键的一个数字，在我的键盘上，编码 1 是 Escape 键，Shift 是 42，以此类推。我使用的是 US ANSI 键盘布局，但还有许多其他的布局，它们的编码也不相同。在我朋友的德国键盘上，编码 12 产生 'ß'，而我的则产生 '-'。

为了解决这一问题，我们使用了一个叫 "xkbcommon" 的库，它的名字源自于它的作用是将 XKB (X KeyBoard) 的通用编码提取到一个独立的库中。XKB 定义了大量的按键符号，如 `XKB_KEY_A` 和 `XKB_KEY_ssharp` （ß，来自德语），以及 `XKB_KEY_kana_WO` （を，来自日语）。

然而，识别这些按键并将它们与这样的按键符号联系起来只是问题的其中一部分。如果按住 Shift 键，'a' 可以产生 'A'，'を' 在片假名模式下被写成 'ヲ'，虽然严格来说 'ß' 有一个大写版本，但它几乎不被使用，理所当然也不会被打出来。向 Shift 这样的键被称为修饰键，而像平假名和片假名这样的被称之为组。有些修饰键可以锁定，比如 Caps Lock。XKB 有处理这些情况的基元，并维护一个状态机，跟踪你的键盘在做什么，并准确找出用户试图输入的 Unicode 编码点。

## 使用 XKB

那么，`xkbcommon` 究竟是如何使用的呢？第一步是链接到它，然后抓取头文件 `xkbcommon/xkbcommon.h`[^1]。

大多数使用 `xkbcommon` 的程序都必须管理以下三个对象：

- `xkb_context:` 一个用于配置其他 XKB 资源的句柄
- `xkb_keymap:` 一个从编码到键盘符号的映射
- `xkb_state:` 一个将键盘符号转化为 `UTF-8` 字符串的状态机

设置的过程通常如下：

1. 使用 `xkb_context_new` 创建一个新的 `xkb_context`，通常将 `XKB_CONTEXT_NO_FLAGS` 传递给它，除非你在做一些特殊的事情。
2. 获取一个字符串形式的键映射（key map）
3. 使用 `xkb_keymap_new_from_string` 来为这个键映射创建一个 `xkb_keymap`。这里只有一种键映射格式：`XKB_KEYMAP_FORMAT_TEXT_V1`，你将其作为格式参数传给函数。同样，除非你有特殊安排，否则应使用 `XKB_KEYMAP_COMPILE_NO_FLAGS` 作为标志传入。
4. 使用 `xkb_state_new` 为你的键映射创建一个 `xkb_state`。这个状态会增加键映射的引用计数 （refcount），所以如果你自己已经用完了，请使用 `xkb_keymap_unref` 来解引用。
5. 从一个按键上获得编码。
6. 将扫描到的编码传入 `xkb_state_key_get_one_sym` 以获得 [`keysyms`](https://wiki.linuxquestions.org/wiki/List_of_keysyms)，并传入 `xkb_state_key_get_utf8` 获得 `UTF-8` 字符串就大功告成了！

*\*这些步骤将在下一节中具体讨论。*

就代码而言，这个过程看起来如下：

```c
#include <xkbcommon/xkbcommon.h> // -lxkbcommon
/* ... */

const char *keymap_str = /* ... */;

/* Create an XKB context */
struct xkb_context *context = xkb_context_new(XKB_CONTEXT_NO_FLAGS);

/* Use it to parse a keymap string */
struct xkb_keymap *keymap = xkb_keymap_new_from_string(
    xkb_context, keymap_str, XKB_KEYMAP_FORMAT_TEXT_V1,
    XKB_KEYMAP_COMPILE_NO_FLAGS);

/* Create an XKB state machine */
struct xkb_state *state = xkb_state_new(keymap);
```

然后处理扫描到的编码：

```c
int scancode = /* ... */;

xkb_keysym_t sym = xkb_state_key_get_one_sym(xkb_state, scancode);
if (sym == XKB_KEY_F1) {
    /* Do the thing you do when the user presses F1 */
}

char buf[128];
xkb_state_key_get_utf8(xkb_state, scancode, buf, sizeof(buf));
printf("UTF-8 input: %s\n", buf);
```

有了这些细节，我们已经准备好解决键盘输入的处理问题。

[^1]: `xkbcommon` 带有一个 `.pc` 文件：使用 `pkgconf --clflags xkbcommon` 和 `pkgconf --libs xkbcommon`，或是你的编译系统喜欢的方式来获取 `pc` 文件。