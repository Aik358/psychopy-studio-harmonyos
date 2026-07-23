// 插件目录：直接读随包分发的本地 plugins.json（29 个插件），不再依赖外网
// psychopy.org。设备无网络时原先 fetch 外网会返回 HTML 错误页，导致前端
// `.json()` 解析 `<!DOCTYPE` 失败（"Failed to get plugins"）。
import plugins from "$lib/dialogs/pluginManager/plugins.json";

export async function GET() {
  return new Response(JSON.stringify(plugins), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
