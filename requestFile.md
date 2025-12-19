各种功能都封装为函数，降低代码耦合度！方便以后改进各功能！

帮我用auto.js实现一个手机脚本
1.在www.jd.com 获取精确北京时间 精确到0.1秒
2.设置指定时间，通过用户分别输入HH,MM,SS来
3.时间一到 自动点击 x,y =862,2246 坐标的半径为6像素的随机区域
4.开启屏幕连点，每隔30ms点击一次 点击持续时间40ms 而且 点击持续时间和点击间隔时间最好有随机 总共点击3s
5.运行脚本后弹出HH:MM:SS:s格式的当前获取的北京时间，通过50透明度的黑底+白字的悬浮窗实时显示，悬浮窗可以被用户拖动
6.显示待会坐标区域位置
7.连续点击结束后，过3s，自动结束脚本

设置的时间，设置的点击位置，点击频率，连点时间，都设为参数放在开头，方便以后开发修改

有一些经验：

1. 获取时间的函数有现成
function getServerTimeInfo() {
    // 通过访问京东首页，读取 HTTP 头里的 Date 字段
    // 不依赖任何开放 API，只要能上 jd.com 就能用
    var url = "https://www.jd.com";
    try {
        var res = http.get(url);
        if (res.statusCode != 200) {
            throw "HTTP " + res.statusCode;
        }

        var headers = res.headers;
        // Auto.js 一般会把 header 名变成小写
        var dateStr = headers["Date"] || headers["date"];
        if (!dateStr) {
            throw "no Date header";
        }

        // HTTP Date 为 GMT 时间，new Date() 会按 UTC 解析，getTime() 是绝对毫秒
        var serverMs = new Date(dateStr).getTime();
        var localMs = Date.now();
        var offset = serverMs - localMs; // 服务器时间 - 本机时间
        return {
            serverMs: serverMs,
            offset: offset
        };
    } catch (e) {
        // 网络异常（无网、被拦截、域名解析失败等）会走到这里
        log(e);
        toast("从京东获取时间失败，改用本机时间：" + e);
        var now = Date.now();
        return {
            serverMs: now,
            offset: 0
        };
    }
}