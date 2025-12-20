/**
 * 京东定时抢购脚本 (Auto.js)
 * 
 * 功能：
 * 1. 从京东服务器获取精确时间
 * 2. 悬浮窗实时显示北京时间
 * 3. 指定时间自动连点
 * 4. 可视化点击区域
 * 5. 获取用户点击坐标
 */

/**
 * 通过用户点击设置连点器坐标（取最后一次点击）
 */
function setClickCoordinatesByTouching() {
    var choice = dialogs.confirm("设置连点坐标", "是否通过点击屏幕来设置连点坐标？\n\n可反复点击调整位置，双击窗口停止");
    if (!choice) {
        return false;
    }
    
    dialogs.alert("提示", "准备开始！\n\n请在屏幕上点击要连点的位置\n可点击多次调整，最后一次点击的位置将被使用\n\n双击悬浮窗停止");
    
    // 获取用户的多次点击
    var coordinates = getTouchCoordinates(-1, true);
    
    if (coordinates.length === 0) {
        toast("未获取到任何点击");
        return false;
    }
    
    // 取最后一次点击的坐标
    var lastCoord = coordinates[coordinates.length - 1];
    CONFIG.clickX = lastCoord.x;
    CONFIG.clickY = lastCoord.y;
    
    log("连点坐标已设置: (" + CONFIG.clickX + ", " + CONFIG.clickY + ")");
    dialogs.alert("设置完成", "连点坐标: (" + CONFIG.clickX + ", " + CONFIG.clickY + ")");
    
    return true;
}

// ==============================
// 0. 工具函数 - 获取点击坐标
// ==============================

/**
 * 监听屏幕点击，获取点击坐标（阻塞式）
 * @param {number} maxClicks 最多获取的点击次数，-1表示不限制
 * @param {boolean} showUI 是否显示控制窗口，默认true
 * @return {array} 点击坐标数组，每项为 {x, y}
 */
function getTouchCoordinates(maxClicks, showUI) {
    maxClicks = maxClicks || -1;
    showUI = showUI !== false;
    
    var coordinates = [];
    var clickCount = 0;
    var isListening = true;
    var screenWidth = device.width;
    var screenHeight = device.height;
    
    // 全屏悬浮窗捕获点击
    var fullScreenWindow = floaty.window(
        <frame id="root" gravity="center" bg="#00000000">
            <text id="text" textSize="16sp" textColor="#ffffff" text="" />
        </frame>
    );
    
    fullScreenWindow.setPosition(0, 0);
    fullScreenWindow.setSize(screenWidth, screenHeight);
    
    var controlWindow = null;
    var lastControlClickTime = 0;
    
    if (showUI) {
        controlWindow = floaty.window(
            <frame gravity="center" bg="#aa000000" padding="10">
                <text id="control" textSize="14sp" textColor="#ffffff" text="准备中...\n\n双击我停止" />
            </frame>
        );
        controlWindow.setPosition(100, 100);
        
        // 拖动和双击逻辑
        var controlX = 0, controlY = 0;
        var windowX, windowY;
        
        controlWindow.control.setOnTouchListener(function(view, event) {
            var action = event.getAction();
            
            if (action == event.ACTION_DOWN) {
                controlX = event.getRawX();
                controlY = event.getRawY();
                windowX = controlWindow.getX();
                windowY = controlWindow.getY();
                
                var currentTime = new Date().getTime();
                if (currentTime - lastControlClickTime < 300) {
                    // 双击了停止
                    isListening = false;
                }
                lastControlClickTime = currentTime;
                return true;
            }
            
            if (action == event.ACTION_MOVE) {
                // 拖动窗口
                var offsetX = event.getRawX() - controlX;
                var offsetY = event.getRawY() - controlY;
                controlWindow.setPosition(windowX + offsetX, windowY + offsetY);
                return true;
            }
            
            return true;
        });
    }
    
    // 监听点击
    fullScreenWindow.root.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_DOWN) {
            var x = Math.round(event.getRawX());
            var y = Math.round(event.getRawY());
            
            clickCount++;
            coordinates.push({x: x, y: y});
            
            log("获取点击 #" + clickCount + ": (" + x + ", " + y + ")");
            
            if (showUI && controlWindow) {
                ui.run(function() {
                    controlWindow.control.setText("共 " + clickCount + " 次\n(" + x + ", " + y + ")\n\n双击我停止");
                });
            }
            
            if (maxClicks > 0 && clickCount >= maxClicks) {
                isListening = false;
            }
        }
        return true;
    });
    
    if (showUI) {
        log("点击坐标采集已启动，双击停止窗口或点击 " + maxClicks + " 次后结束");
    }
    
    // 等待点击结束
    while (isListening) {
        sleep(100);
    }
    
    // 清理资源
    if (fullScreenWindow) fullScreenWindow.close();
    if (controlWindow) controlWindow.close();
    
    log("采集完成，共获得 " + clickCount + " 个坐标");
    return coordinates;
}

// ==============================
// 1. 全局配置参数 (可在此修改)
// ==============================
var CONFIG = {
    // 点击坐标
    clickX: 862,
    clickY: 2246,
    // 点击半径 (像素)
    clickRadius: 6,
    // 显示点击区域文本
    showText: true,
    overlayStroke: 5,
    overlayPadding: 20,
    overlayTextSize: 32,
    overlayTextOffsetX: 30,
    
    // 连点配置
    interval: 30,       // 点击间隔 (ms)
    pressDuration: 40,  // 点击持续时间 (ms)
    randomRange: 10,    // 时间随机波动范围 (ms)，例如设置为10，则间隔在 20-40ms 之间波动
    totalDuration: 3000,// 总连点时长 (ms)
    
    // 双击配置
    doubleClickX: 908,  // 双击坐标 X
    doubleClickY: 1770,  // 双击坐标 Y
    doubleClickDuration: 40,  // 单次点击持续时间 (ms)
    doubleClickInterval: 30,  // 两次点击间隔 (ms)
    doubleClickOffsetMs: 0,    // 相对于目标时间的偏移 (ms)，负数表示目标时间前执行
    
    // 界面配置
    textSize: 16,       // 悬浮窗字体大小
    
    // 默认目标时间 (格式 HH:mm:ss，仅作为输入框默认值)
    defaultTargetTime: "10:00:00",
    defaultTargetDeci: "0" // 默认 0.1 秒位（0-9）
};

// 引入 Paint 以避免运行时找不到类
importClass(android.graphics.Paint);

// ==============================
// 初始化：设置默认目标时间为当前本机时间
// ==============================
function initDefaultTargetTime() {
    var now = new Date();
    var h = pad2(now.getHours());
    var m = pad2(now.getMinutes());
    var s = pad2(now.getSeconds());
    var deci = Math.floor(now.getMilliseconds() / 100);
    CONFIG.defaultTargetTime = h + ":" + m + ":" + s + ":" + deci;
}
initDefaultTargetTime();

// 全局变量
var timeOffset = 0; // 服务器时间与本地时间的差值
var targetTimestamp = 0; // 目标时间戳
var targetTimeStr = CONFIG.defaultTargetTime; // 记录目标时间字符串（含秒）
var targetDeci = parseInt(CONFIG.defaultTargetDeci || "0", 10); // 0.1 秒位
var window = null; // 时间悬浮窗
var overlayWindow = null; // 点击区域显示窗口
var isRunning = true;

// ==============================
// 2. 程序入口
// ==============================

function main() {
    // 检查无障碍服务
    auto.waitFor();
    
    // 1. 初始化：获取时间偏移
    toast("正在同步京东服务器时间...");
    var timeInfo = getServerTimeInfo();
    timeOffset = timeInfo.offset;
    log("时间偏差(ms): " + timeOffset);
    toast("时间同步完成，偏差: " + timeOffset + "ms");

    // 弹窗提示当前北京时间（0.1s 精度）
    var nowStr = formatTime(Date.now() + timeOffset);
    dialogs.alert("当前北京时间", nowStr);

    // 2. 用户交互：设置目标时间
    if (!setUserTargetTime()) {
        toast("取消运行");
        return;
    }

    // 3. 用户交互：设置连点坐标
    setClickCoordinatesByTouching();

    // 4. 初始化悬浮窗
    initFloatyWindow();
    
    // 5. 显示点击区域
    showClickArea();

    // 6. 开启时间刷新与检测线程
    threads.start(function() {
        while (isRunning) {
            var now = Date.now() + timeOffset;
            
            // 更新悬浮窗时间
            updateFloatyTime(now);

            // 检查是否到达时间
            if (now >= targetTimestamp) {
                // 停止刷新UI，准备点击
                ui.run(function() {
                    if(window) window.text.setText("执行中...");
                    if(window) window.text.setTextColor(colors.RED);
                });
                
                // 执行点击任务
                executeClickTask();
                
                // 任务完成
                handleFinish();
                break;
            }
            
            // 提高检测频率以匹配 0.1s 精度
            sleep(5);
        }
    });
}

// ==============================
// 3. 功能函数封装
// ==============================

/**
 * 获取京东服务器时间
 */
function getServerTimeInfo() {
    var url = "https://www.jd.com";
    try {
        var res = http.get(url);
        if (res.statusCode != 200) {
            throw "HTTP " + res.statusCode;
        }

        var headers = res.headers;
        var dateStr = headers["Date"] || headers["date"];
        if (!dateStr) {
            throw "no Date header";
        }

        var serverMs = new Date(dateStr).getTime();
        var localMs = Date.now();
        var offset = serverMs - localMs; 
        return {
            serverMs: serverMs,
            offset: offset
        };
    } catch (e) {
        log(e);
        toast("从京东获取时间失败，改用本机时间");
        return {
            serverMs: Date.now(),
            offset: 0
        };
    }
}

/**
 * 弹出对话框设置目标时间
 */
function setUserTargetTime() {
    var timeInput = pickTimeWithScroll(CONFIG.defaultTargetTime);
    if (!timeInput) {
        return false;
    }
    
    var result = parseTimeString(timeInput);
    if (!result.valid) {
        toast("时间解析失败");
        return false;
    }
    
    var targetDate = new Date();
    targetDate.setHours(result.h);
    targetDate.setMinutes(result.m);
    targetDate.setSeconds(result.s);
    targetDate.setMilliseconds(result.d * 100); // 0.1s 精度

    if (targetDate.getTime() < Date.now()) {
        toast("注意：设置的时间早于当前时间，将立即执行或无效");
    }

    targetTimestamp = targetDate.getTime();
    targetDeci = result.d;
    targetTimeStr = result.formatted;
    return true;
}

/**
 * 解析 HH:MM:SS:d 格式的时间字符串
 * @param {string} timeStr 时间字符串
 * @return {object} {valid, h, m, s, d, formatted}
 */
function parseTimeString(timeStr) {
    var parts = timeStr.split(":");
    if (parts.length !== 4) {
        return { valid: false };
    }

    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var s = parseInt(parts[2], 10);
    var d = parseInt(parts[3], 10);

    if (isNaN(h) || isNaN(m) || isNaN(s) || isNaN(d) || 
        h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59 || d < 0 || d > 9) {
        return { valid: false };
    }

    return {
        valid: true,
        h: h,
        m: m,
        s: s,
        d: d,
        formatted: pad2(h) + ":" + pad2(m) + ":" + pad2(s) + ":" + d
    };
}

/**
 * 通过闹钟式弹窗选择时间（HH:MM:SS:d）
 * @param {string} defaultTimeStr 默认时间字符串 HH:MM:SS:d
 * @return {string|null} 选择后的时间字符串，或 null 取消
 */
function pickTimeWithScroll(defaultTimeStr) {
    var parts = defaultTimeStr.split(":");
    var h = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    var s = parseInt(parts[2], 10) || 0;
    var d = parseInt(parts[3], 10) || 0;

    // 使用闹钟式时间选择器（基于悬浮窗）
    var result = showAlarmClockPickerFloaty(h, m, s, d);
    
    if (result === null) {
        return null;
    }
    
    return pad2(result.h) + ":" + pad2(result.m) + ":" + pad2(result.s) + ":" + result.d;
}

/**
 * 显示闹钟式时间选择器（悬浮窗版本）
 * 在一个悬浮窗中通过按钮微调来设置 HH:MM:SS:d
 * 上箭头：数字减少 | 下箭头：数字增加
 * 长按箭头可快速切换数字
 * @param {number} initialH 初始小时
 * @param {number} initialM 初始分钟
 * @param {number} initialS 初始秒
 * @param {number} initialD 初始 0.1秒位
 * @return {object|null} {h, m, s, d} 或 null 取消
 */
function showAlarmClockPickerFloaty(initialH, initialM, initialS, initialD) {
    var result = null;
    var finished = false;
    
    // 初始化变量
    var h = initialH;
    var m = initialM;
    var s = initialS;
    var d = initialD;
    
    // 创建悬浮窗
    var window = floaty.window(
        <frame gravity="center" bg="#ffffff" padding="15">
            <linear orientation="vertical" gravity="center_horizontal" spacing="10">
                <text text="设置目标时间" textColor="#000000" textSize="18sp" gravity="center" />
                
                <linear orientation="horizontal" gravity="center_horizontal" spacing="5">
                    <!-- HH -->
                    <linear orientation="vertical" gravity="center_horizontal">
                        <button id="h_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="h_display" text="00" textColor="#000000" textSize="36sp" gravity="center" w="50" />
                        <button id="h_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                    
                    <text text=":" textColor="#000000" textSize="36sp" gravity="center" w="15" />
                    
                    <!-- MM -->
                    <linear orientation="vertical" gravity="center_horizontal">
                        <button id="m_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="m_display" text="00" textColor="#000000" textSize="36sp" gravity="center" w="50" />
                        <button id="m_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                    
                    <text text=":" textColor="#000000" textSize="36sp" gravity="center" w="15" />
                    
                    <!-- SS -->
                    <linear orientation="vertical" gravity="center_horizontal">
                        <button id="s_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="s_display" text="00" textColor="#000000" textSize="36sp" gravity="center" w="50" />
                        <button id="s_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                    
                    <text text="." textColor="#000000" textSize="36sp" gravity="center" w="12" />
                    
                    <!-- 0.1s -->
                    <linear orientation="vertical" gravity="center_horizontal">
                        <button id="d_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="d_display" text="0" textColor="#000000" textSize="36sp" gravity="center" w="40" />
                        <button id="d_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                </linear>
                
                <linear orientation="horizontal" gravity="center_horizontal" spacing="10" h="45">
                    <button id="confirm_btn" text="✓ 确定" w="100" h="45" textSize="14sp" />
                    <button id="cancel_btn" text="✗ 取消" w="100" h="45" textSize="14sp" />
                </linear>
            </linear>
        </frame>
    );
    
    // 等待窗口完全加载后再设置位置（确保能获取正确的窗口大小）
    sleep(100);
    
    // 获取屏幕和窗口信息
    var screenWidth = device.width;
    var screenHeight = device.height;
    var windowWidth = window.getWidth();
    var windowHeight = window.getHeight();
    
    // 计算居中位置
    var centerX = (screenWidth - windowWidth) / 2;
    var centerY = (screenHeight - windowHeight) / 2;
    
    log("屏幕尺寸: " + screenWidth + "x" + screenHeight);
    log("窗口尺寸: " + windowWidth + "x" + windowHeight);
    log("窗口位置: " + centerX + ", " + centerY);
    
    window.setPosition(centerX, centerY);
    
    // 更新显示函数
    function updateDisplay() {
        ui.run(function() {
            window.h_display.setText(pad2(h));
            window.m_display.setText(pad2(m));
            window.s_display.setText(pad2(s));
            window.d_display.setText(pad1(d));
        });
    }
    
    // 初始显示
    updateDisplay();
    
    // 长按状态记录
    var longPressStates = {
        h_up: { pressing: false, interval: null },
        h_down: { pressing: false, interval: null },
        m_up: { pressing: false, interval: null },
        m_down: { pressing: false, interval: null },
        s_up: { pressing: false, interval: null },
        s_down: { pressing: false, interval: null },
        d_up: { pressing: false, interval: null },
        d_down: { pressing: false, interval: null }
    };
    
    // 创建简单的按钮长按处理函数
    function makeButtonHandler(buttonId, decreaseCallback, increaseCallback) {
        return function(view, event) {
            var action = event.getAction();
            var state = longPressStates[buttonId];
            
            if (action == event.ACTION_DOWN) {
                state.pressing = true;
                // 立即执行一次
                if (buttonId.indexOf("up") >= 0) {
                    decreaseCallback();
                } else {
                    increaseCallback();
                }
                updateDisplay();
                
                // 500ms后开始重复
                state.interval = setInterval(function() {
                    if (state.pressing) {
                        if (buttonId.indexOf("up") >= 0) {
                            decreaseCallback();
                        } else {
                            increaseCallback();
                        }
                        updateDisplay();
                    }
                }, 100);
                
                return true;
            } else if (action == event.ACTION_UP || action == event.ACTION_CANCEL) {
                state.pressing = false;
                if (state.interval !== null) {
                    clearInterval(state.interval);
                    state.interval = null;
                }
                return true;
            }
            
            return false;
        };
    }
    
    // 绑定小时按钮事件（上箭头减少，下箭头增加）
    try {
        window.h_up.setOnTouchListener(makeButtonHandler("h_up",
            function() { h = (h - 1 + 24) % 24; },
            function() { h = (h + 1) % 24; }
        ));
        window.h_down.setOnTouchListener(makeButtonHandler("h_down",
            function() { h = (h - 1 + 24) % 24; },
            function() { h = (h + 1) % 24; }
        ));
    } catch(e) {
        log("小时按钮绑定失败: " + e);
    }
    
    // 绑定分钟按钮事件
    try {
        window.m_up.setOnTouchListener(makeButtonHandler("m_up",
            function() { m = (m - 1 + 60) % 60; },
            function() { m = (m + 1) % 60; }
        ));
        window.m_down.setOnTouchListener(makeButtonHandler("m_down",
            function() { m = (m - 1 + 60) % 60; },
            function() { m = (m + 1) % 60; }
        ));
    } catch(e) {
        log("分钟按钮绑定失败: " + e);
    }
    
    // 绑定秒按钮事件
    try {
        window.s_up.setOnTouchListener(makeButtonHandler("s_up",
            function() { s = (s - 1 + 60) % 60; },
            function() { s = (s + 1) % 60; }
        ));
        window.s_down.setOnTouchListener(makeButtonHandler("s_down",
            function() { s = (s - 1 + 60) % 60; },
            function() { s = (s + 1) % 60; }
        ));
    } catch(e) {
        log("秒按钮绑定失败: " + e);
    }
    
    // 绑定0.1秒按钮事件
    try {
        window.d_up.setOnTouchListener(makeButtonHandler("d_up",
            function() { d = (d - 1 + 10) % 10; },
            function() { d = (d + 1) % 10; }
        ));
        window.d_down.setOnTouchListener(makeButtonHandler("d_down",
            function() { d = (d - 1 + 10) % 10; },
            function() { d = (d + 1) % 10; }
        ));
    } catch(e) {
        log("0.1秒按钮绑定失败: " + e);
    }
    
    // 确定按钮
    try {
        window.confirm_btn.click(function() {
            result = { h: h, m: m, s: s, d: d };
            finished = true;
        });
    } catch(e) {
        log("确定按钮绑定失败: " + e);
    }
    
    // 取消按钮
    try {
        window.cancel_btn.click(function() {
            result = null;
            finished = true;
        });
    } catch(e) {
        log("取消按钮绑定失败: " + e);
    }
    
    // 等待用户交互
    while (!finished) {
        sleep(100);
    }
    
    // 关闭窗口
    window.close();
    return result;
}

/**
 * 格式化单个数字（不补零）
 */
function pad1(n) {
    return "" + n;
}

/**
 * 创建时间选择器的 UI 布局
 * @param {object} ui 时间对象 {hour, minute, second, deci}
 * @return {android.widget.LinearLayout} 布局
 */
function createTimePickerLayout(ui) {
    // 已废弃，使用 pickTimeWithScroll 替代
}

/**
 * 创建单个时间调整项
 * @param {string} label 标签
 * @param {object} ui 数据对象
 * @param {string} key UI 对象的键
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @return {android.view.View} 视图
 */
function createTimeItemLayout(label, ui, key, min, max) {
    // 已废弃，使用 buildNumberList 替代
}

/**
 * 初始化时间悬浮窗
 */
function initFloatyWindow() {
    window = floaty.window(
        <frame gravity="center" bg="#80000000" padding="10">
            <text id="text" textSize="{{CONFIG.textSize}}sp" textColor="#ffffff" text="加载中..." />
        </frame>
    );
    
    window.setPosition(100, 100);
    window.exitOnClose();

    // 悬浮窗拖动逻辑
    var x = 0, y = 0;
    var windowX, windowY;
    var downTime;

    window.text.setOnTouchListener(function(view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = window.getX();
                windowY = window.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                // 移动手指时调整悬浮窗位置
                window.setPosition(windowX + (event.getRawX() - x),
                    windowY + (event.getRawY() - y));
                return true;
            case event.ACTION_UP:
                return true;
        }
        return true;
    });
}

/**
 * 显示点击区域
 */
function showClickArea() {
    // 用 toast 临时显示目标坐标，避免 Canvas 绘制引起的触摸阻塞
    toast("目标坐标: " + CONFIG.clickX + ", " + CONFIG.clickY);
}

/**
 * 更新悬浮窗时间显示
 */
function updateFloatyTime(currentMs) {
    var timeText = formatTime(currentMs);
    
    ui.run(function() {
        if (window) {
            window.text.setText(timeText);
        }
    });
}

/**
 * 将时间戳格式化为 HH:MM:SS:s（0.1s 精度）
 */
function formatTime(ms) {
    var date = new Date(ms);
    var h = pad2(date.getHours());
    var m = pad2(date.getMinutes());
    var s = pad2(date.getSeconds());
    var deci = Math.floor(date.getMilliseconds() / 100); // 0-9
    return h + ":" + m + ":" + s + ":" + deci;
}

function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
}

/**
 * 执行点击任务
 */
function executeClickTask() {
    log("开始点击任务");
    var startTime = Date.now();
    var clickCount = 0;
    
    while (Date.now() - startTime < CONFIG.totalDuration) {
        // 1. 计算随机坐标
        // 在半径内随机生成点: x = r * cos(theta), y = r * sin(theta)
        // 为了均匀分布，r 应该是 sqrt(random) * R
        var angle = Math.random() * 2 * Math.PI;
        var r = Math.sqrt(Math.random()) * CONFIG.clickRadius;
        var targetX = Math.round(CONFIG.clickX + r * Math.cos(angle));
        var targetY = Math.round(CONFIG.clickY + r * Math.sin(angle));

        // 2. 计算随机时间
        // 持续时间波动
        var duration = CONFIG.pressDuration + random(-CONFIG.randomRange, CONFIG.randomRange);
        if (duration < 1) duration = 1;
        
        // 间隔时间波动
        var interval = CONFIG.interval + random(-CONFIG.randomRange, CONFIG.randomRange);
        if (interval < 1) interval = 1;

        // 3. 执行点击
        try {
            press(targetX, targetY, duration);
            clickCount++;
            log("点击 #" + clickCount + " 在 (" + targetX + ", " + targetY + ")，持续 " + duration + "ms");
        } catch (e) {
            log("点击失败: " + e);
        }
        
        // 4. 等待间隔
        sleep(interval);
    }
    log("点击任务结束，共点击 " + clickCount + " 次");
}

/**
 * 执行单次双击动作
 * @param {number} x 双击坐标 X
 * @param {number} y 双击坐标 Y
 */
function doubleTap(x, y) {
    try {
        // 第一次点击
        press(x, y, CONFIG.doubleClickDuration);
        log("第一次点击 (" + x + ", " + y + ")");
        
        // 等待间隔
        sleep(CONFIG.doubleClickInterval);
        
        // 第二次点击
        press(x, y, CONFIG.doubleClickDuration);
        log("第二次点击 (" + x + ", " + y + ")，完成双击");
    } catch (e) {
        log("双击失败: " + e);
    }
}

/**
 * 在指定时间偏移量处执行双击
 * @param {number} offsetMs 相对于目标时间的偏移量（毫秒），负数表示目标时间前执行
 */
function executeDoubleClickTask(offsetMs) {
    var clickTime = targetTimestamp + (offsetMs || CONFIG.doubleClickOffsetMs);
    log("等待双击时间..." + formatTime(clickTime));
    
    // 轮询等待指定时间
    while (isRunning) {
        var now = Date.now() + timeOffset;
        
        if (now >= clickTime) {
            log("双击时间已到，执行双击");
            doubleTap(CONFIG.doubleClickX, CONFIG.doubleClickY);
            log("双击完成");
            return true;
        }
        
        // 检测频率提高以匹配 0.1s 精度
        sleep(5);
    }
    return false;
}

/**
 * 任务完成后的处理
 */
function handleFinish() {
    ui.run(function() {
        if(window) window.text.setText("完成");
    });
    
    // 3秒后结束
    sleep(3000);
    
    // 清理资源
    isRunning = false;
    if (window) window.close();
    if (overlayWindow) overlayWindow.close();
    
    log("脚本自动结束");
    exit();
}

// 启动主程序
main();
