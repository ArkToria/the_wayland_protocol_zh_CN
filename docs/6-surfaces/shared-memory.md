# 共享内存缓冲区

从客户端获取像素到混成器最简单，也是唯一被载入 `wayland.xml` 的方法，就是 `wl_shm` ——共享内存。简单地说，它允许你为混成器传输一个文件描述符到带有 `MAP_SHARED` 的内存映射（mmap），然后从这个池中共享像素缓冲区。添加一些简单的同步原语，以防止缓冲区竞争，然后你就有了一个可行且可移植的解决方案。

## 绑定到 wl_shm

在 5.1 章节中解释的全局注册表监听器将在 `wl_shm` 全局可用时进行公告。绑定到它是相当直接的。扩展第 5.1 章中的例子，我们可以得到如下结果：

```c
struct our_state {
    // ...
    struct wl_shm *shm;
    // ...
};

static void
registry_handle_global(void *data, struct wl_registry *registry,
		uint32_t name, const char *interface, uint32_t version)
{
    struct our_state *state = data;
    if (strcmp(interface, wl_shm_interface.name) == 0) {
        state->shm = wl_registry_bind(
            wl_registry, name, &wl_shm_interface, 1);
    }
}

int
main(int argc, char *argv[])
{
    struct our_state state = { 0 };
    // ...
    wl_registry_add_listener(registry, &registry_listener, &state);
    // ...
}
```

一旦绑定，我们可以选择通过 `wl_shm_add_listener` 添加一个监听器。混成器将通过这个监听器公布器其所支持的像素格式。可用的像素格式的完整列表在 `wayland.xml` 中给出。有两种格式是必须支持的：ARGB (各 8 位色深) 和 XRGB (各 8 位色深)，它们是 24 位颜色，分别有和没有透明度 (alpha) 通道。

## 分配共享内存工具

可以利用 [POSIX](https://en.wikipedia.org/wiki/POSIX) `shm_open` 和随机文件名的组合来创建一个适合这一目的的文件，并利用 `ftruncate` 分配合适的大小。下面的模板可以在公共领域或 CC0 下自由使用：

```c
#define _POSIX_C_SOURCE 200112L
#include <errno.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <time.h>
#include <unistd.h>

static void
randname(char *buf)
{
	struct timespec ts;
	clock_gettime(CLOCK_REALTIME, &ts);
	long r = ts.tv_nsec;
	for (int i = 0; i < 6; ++i) {
		buf[i] = 'A'+(r&15)+(r&16)*2;
		r >>= 5;
	}
}

static int
create_shm_file(void)
{
	int retries = 100;
	do {
		char name[] = "/wl_shm-XXXXXX";
		randname(name + sizeof(name) - 7);
		--retries;
		int fd = shm_open(name, O_RDWR | O_CREAT | O_EXCL, 0600);
		if (fd >= 0) {
			shm_unlink(name);
			return fd;
		}
	} while (retries > 0 && errno == EEXIST);
	return -1;
}

int
allocate_shm_file(size_t size)
{
	int fd = create_shm_file();
	if (fd < 0)
		return -1;
	int ret;
	do {
		ret = ftruncate(fd, size);
	} while (ret < 0 && errno == EINTR);
	if (ret < 0) {
		close(fd);
		return -1;
	}
	return fd;
}
```

希望这些代码能浅显易懂。有了这个，客户端可以相当简单地创建一个共享内存池。比如，我们想显示一个 1920x1080 的窗口，我们需要两个缓冲区来进行双缓冲，所以这将是 4,147,200 像素。假设像素格式是 `WL_SHM_FORMAT_XRGB8888`，那么每个像素将有 4 个字节，总池大小为 16,588,800 字节。如第 5.1 章所述，从注册表中绑定全局 `wl_shm`，然后像这样来使用它创建一个可以容纳这些缓冲区的共享内存池：

```c
const int width = 1920, height = 1080;
const int stride = width * 4;
const int shm_pool_size = height * stride * 2;

int fd = allocate_shm_file(shm_pool_size);
uint8_t *pool_data = mmap(NULL, shm_pool_size,
    PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

struct wl_shm *shm = ...; // Bound from registry
struct wl_shm_pool *pool = wl_shm_create_pool(shm, fd, shm_pool_size);
```

## 从池中创建缓存区域

一旦这个消息传到混成器，它也会对这个文件描述符进行内存映射。不过 Wayland 是异步的，所以我们可以马上开始从这个池子里分配缓冲区。由于我们为两个缓冲区分配了空间，所以需要为每个缓冲区各分配一个索引，并将这些索引转换成池中的字节偏移量。有了这些信息后，我们可以创建一个 `wl_buffer`：

```c
int index = 0;
int offset = height * stride * index;
struct wl_buffer *buffer = wl_shm_pool_create_buffer(pool, offset,
    width, height, stride, WL_SHM_FORMAT_XRGB8888);
```

我们现在也可以将图像写入此缓冲区。例如，将其设置为纯白色：

```c
uint32_t *pixels = (uint32_t *)&pool_data[offset];
memset(pixels, 0, width * height * 4);
```

或者，为了更有趣，这里有一个棋盘格图案：

```c
uint32_t *pixels = (uint32_t *)&pool_data[offset];
for (int y = 0; y < height; ++y) {
  for (int x = 0; x < width; ++x) {
    if ((x + y / 8 * 8) % 16 < 8) {
      pixels[y * width + x] = 0xFF666666;
    } else {
      pixels[y * width + x] = 0xFFEEEEEE;
    }
  }
}
```

舞台已经设置好后，我们需要把缓冲区连接到我们的界面，把整个表面标记为 “损坏”[^1]，并提交：

```c
wl_surface_attach(surface, buffer, 0, 0);
wl_surface_damage(surface, 0, 0, UINT32_MAX, UINT32_MAX);
wl_surface_commit(surface);
```

如果你运用这些新学到的知识来编写一个 Wayland 客户端，当你的缓冲区没有显示在屏幕上时，你可能会感到疑惑。我们错过了关键的最后一步——给你的表面分配一个角色（role）。

[^1]: “损坏” 意味着 “这个区域需要重新绘制”

## 服务端的 wl_shm

在到达那一步之前，服务端的部分也值得注意。`libwayland` 提供了一些辅助程序，让 `wl_shm` 使用起来更容易。若要配置显示器，它只需要以下内容：

```c
int
wl_display_init_shm(struct wl_display *display);

uint32_t *
wl_display_add_shm_format(struct wl_display *display, uint32_t format);
```

前者创建了全局对象，并设置了内部实现，后者添加了一个支持的像素格式（记得至少添加 ARGB8888 和 XRGB8888）。一旦客户端将缓冲区添加到它的一个表面，你就可以将缓冲区资源传入 `wl_shm_buffer_get` 以获得一个 `wl_shm_buffer` 引用，并像下面这样利用它：

```c
void
wl_shm_buffer_begin_access(struct wl_shm_buffer *buffer);

void
wl_shm_buffer_end_access(struct wl_shm_buffer *buffer);

void *
wl_shm_buffer_get_data(struct wl_shm_buffer *buffer);

int32_t
wl_shm_buffer_get_stride(struct wl_shm_buffer *buffer);

uint32_t
wl_shm_buffer_get_format(struct wl_shm_buffer *buffer);

int32_t
wl_shm_buffer_get_width(struct wl_shm_buffer *buffer);

int32_t
wl_shm_buffer_get_height(struct wl_shm_buffer *buffer);
```

如果你用 `begin_access` 和 `end_access` 来保护你对缓冲区数据的访问，`libwayland` 将会为你处理锁的问题。