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
 * 显示启动确认悬浮窗
 * @return {boolean} 用户是否点击了开始，true为开始，false为退出
 */
function showStartConfirmationFloaty() {
    var confirmed = false;
    var finished = false;
    
    // 创建悬浮窗
    var window = floaty.window(
        <frame gravity="center" bg="#ffffff" padding="20">
            <linear orientation="vertical" gravity="center_horizontal" spacing="15">
                <text text="京东定时抢购脚本" textColor="#000000" textSize="20sp" gravity="center" />
                
                <linear orientation="vertical" gravity="center_horizontal" spacing="5">
                    <text text="脚本已准备就绪,切换到应用后" textColor="#666666" textSize="14sp" gravity="center" />
                    <text text="点击【开始】按钮继续" textColor="#666666" textSize="14sp" gravity="center" />
                </linear>
                
                <linear orientation="horizontal" gravity="center_horizontal" spacing="10" h="50">
                    <button id="start_btn" text="▶ 开始" w="120" h="50" textSize="16sp" />
                    <button id="exit_btn" text="✕ 退出" w="120" h="50" textSize="16sp" />
                </linear>
            </linear>
        </frame>
    );
    
    // 等待窗口完全加载后再设置位置
    sleep(100);
    
    // 获取屏幕和窗口信息，计算居中位置
    var screenWidth = device.width;
    var screenHeight = device.height;
    var windowWidth = window.getWidth();
    var windowHeight = window.getHeight();
    
    var centerX = (screenWidth - windowWidth) / 2;
    var centerY = (screenHeight - windowHeight) / 2;
    
    window.setPosition(centerX, centerY);
    
    // 开始按钮
    try {
        window.start_btn.click(function() {
            confirmed = true;
            finished = true;
        });
    } catch(e) {
        log("开始按钮绑定失败: " + e);
    }
    
    // 退出按钮
    try {
        window.exit_btn.click(function() {
            confirmed = false;
            finished = true;
        });
    } catch(e) {
        log("退出按钮绑定失败: " + e);
    }
    
    // 等待用户交互
    while (!finished) {
        sleep(100);
    }
    
    // 关闭窗口
    window.close();
    return confirmed;
}

/**
 * 通过用户点击设置连点器坐标（取最后一次点击）
 */
function setClickCoordinatesByTouching() {
    var choice = dialogs.confirm("设置连点坐标", "是否通过点击屏幕来设置连点坐标？\n\n可反复点击调整位置，双击悬浮窗停止");
    if (!choice) {
        return false;
    }
    
    //dialogs.alert("提示", "准备开始！\n\n请在屏幕上点击要连点的位置\n可点击多次调整，最后一次点击的位置将被使用\n\n双击悬浮窗停止");
    
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

/**
 * 设置点击频率配置（interval、pressDuration、totalDuration）
 */
function setClickFrequency() {
    var result = showClickFrequencyPickerFloaty(
        CONFIG.interval,
        CONFIG.pressDuration,
        CONFIG.totalDuration
    );
    
    if (result === null) {
        return false;
    }
    
    CONFIG.interval = result.interval;
    CONFIG.pressDuration = result.pressDuration;
    CONFIG.totalDuration = result.totalDuration;
    
    log("点击频率已设置: interval=" + CONFIG.interval + "ms, pressDuration=" + CONFIG.pressDuration + "ms, totalDuration=" + CONFIG.totalDuration + "ms");
    dialogs.alert("设置完成", "间隔: " + CONFIG.interval + "ms\n持续时间: " + CONFIG.pressDuration + "ms\n总时长: " + CONFIG.totalDuration + "ms\n点击频率: " + calculateClicksPerSecond(CONFIG.interval, CONFIG.pressDuration) + " 次/秒");
    
    return true;
}

/**
 * 计算每秒点击次数
 * @param {number} interval 点击间隔 (ms)
 * @param {number} pressDuration 点击持续时间 (ms)
 * @return {number} 每秒点击次数（舍去小数）
 */
function calculateClicksPerSecond(interval, pressDuration) {
    return Math.floor(1000 / (interval + pressDuration));
}

/**
 * 显示点击频率设置器（悬浮窗版本）
 * 在一个悬浮窗中通过按钮微调来设置 interval、pressDuration、totalDuration
 * @param {number} initialInterval 初始间隔 (ms)
 * @param {number} initialPressDuration 初始持续时间 (ms)
 * @param {number} initialTotalDuration 初始总时长 (ms)
 * @return {object|null} {interval, pressDuration, totalDuration} 或 null 取消
 */
function showClickFrequencyPickerFloaty(initialInterval, initialPressDuration, initialTotalDuration) {
    var result = null;
    var finished = false;
    
    // 初始化变量
    var interval = initialInterval;
    var pressDuration = initialPressDuration;
    var totalDuration = initialTotalDuration;
    
    // 创建悬浮窗
    var window = floaty.window(
        <frame gravity="center" bg="#ffffff" padding="15">
            <linear orientation="vertical" gravity="center_horizontal" spacing="10">
                <text text="设置点击频率" textColor="#000000" textSize="18sp" gravity="center" />
                
                <!-- 间隔 (interval) -->
                <linear orientation="vertical" gravity="center_horizontal" spacing="5">
                    <text text="间隔 (ms)" textColor="#666666" textSize="12sp" gravity="center" />
                    <linear orientation="horizontal" gravity="center_horizontal" spacing="5">
                        <button id="interval_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="interval_display" text="30" textColor="#000000" textSize="28sp" gravity="center" w="80" />
                        <button id="interval_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                </linear>
                
                <!-- 持续时间 (pressDuration) -->
                <linear orientation="vertical" gravity="center_horizontal" spacing="5">
                    <text text="持续时间 (ms)" textColor="#666666" textSize="12sp" gravity="center" />
                    <linear orientation="horizontal" gravity="center_horizontal" spacing="5">
                        <button id="duration_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="duration_display" text="40" textColor="#000000" textSize="28sp" gravity="center" w="80" />
                        <button id="duration_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                </linear>
                
                <!-- 总时长 (totalDuration) -->
                <linear orientation="vertical" gravity="center_horizontal" spacing="5">
                    <text text="总时长 (ms)" textColor="#666666" textSize="12sp" gravity="center" />
                    <linear orientation="horizontal" gravity="center_horizontal" spacing="5">
                        <button id="total_up" text="▲" w="40" h="35" textSize="14sp" />
                        <text id="total_display" text="3000" textColor="#000000" textSize="28sp" gravity="center" w="80" />
                        <button id="total_down" text="▼" w="40" h="35" textSize="14sp" />
                    </linear>
                </linear>
                
                <!-- 点击频率显示 -->
                <linear orientation="horizontal" gravity="center_horizontal" spacing="5" bg="#e8f5e9" padding="10">
                    <text text="点击频率:" textColor="#2e7d32" textSize="14sp" />
                    <text id="cps_display" text="25" textColor="#2e7d32" textSize="14sp" />
                    <text text="次/秒" textColor="#2e7d32" textSize="14sp" />
                </linear>
                
                <!-- 确定和取消按钮 -->
                <linear orientation="horizontal" gravity="center_horizontal" spacing="10" h="45">
                    <button id="confirm_btn" text="✓ 确定" w="100" h="45" textSize="14sp" />
                    <button id="cancel_btn" text="✗ 取消" w="100" h="45" textSize="14sp" />
                </linear>
            </linear>
        </frame>
    );
    
    // 等待窗口完全加载后再设置位置
    sleep(100);
    
    // 获取屏幕和窗口信息，计算居中位置
    var screenWidth = device.width;
    var screenHeight = device.height;
    var windowWidth = window.getWidth();
    var windowHeight = window.getHeight();
    
    var centerX = (screenWidth - windowWidth) / 2;
    var centerY = (screenHeight - windowHeight) / 2;
    
    window.setPosition(centerX, centerY);
    
    // 更新显示函数
    function updateDisplay() {
        ui.run(function() {
            window.interval_display.setText("" + interval);
            window.duration_display.setText("" + pressDuration);
            window.total_display.setText("" + totalDuration);
            var cps = calculateClicksPerSecond(interval, pressDuration);
            window.cps_display.setText("" + cps);
        });
    }
    
    // 初始显示
    updateDisplay();
    
    // 长按状态记录
    var longPressStates = {
        interval_up: { pressing: false, interval: null },
        interval_down: { pressing: false, interval: null },
        duration_up: { pressing: false, interval: null },
        duration_down: { pressing: false, interval: null },
        total_up: { pressing: false, interval: null },
        total_down: { pressing: false, interval: null }
    };
    
    // 创建按钮长按处理函数
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
                
                // 100ms后开始重复
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
    
    // 绑定间隔按钮事件
    try {
        window.interval_up.setOnTouchListener(makeButtonHandler("interval_up",
            function() { interval = Math.max(5, interval - 5); },
            function() { interval = interval + 5; }
        ));
        window.interval_down.setOnTouchListener(makeButtonHandler("interval_down",
            function() { interval = Math.max(5, interval - 5); },
            function() { interval = interval + 5; }
        ));
    } catch(e) {
        log("间隔按钮绑定失败: " + e);
    }
    
    // 绑定持续时间按钮事件
    try {
        window.duration_up.setOnTouchListener(makeButtonHandler("duration_up",
            function() { pressDuration = Math.max(5, pressDuration - 5); },
            function() { pressDuration = pressDuration + 5; }
        ));
        window.duration_down.setOnTouchListener(makeButtonHandler("duration_down",
            function() { pressDuration = Math.max(5, pressDuration - 5); },
            function() { pressDuration = pressDuration + 5; }
        ));
    } catch(e) {
        log("持续时间按钮绑定失败: " + e);
    }
    
    // 绑定总时长按钮事件
    try {
        window.total_up.setOnTouchListener(makeButtonHandler("total_up",
            function() { totalDuration = Math.max(100, totalDuration - 100); },
            function() { totalDuration = totalDuration + 100; }
        ));
        window.total_down.setOnTouchListener(makeButtonHandler("total_down",
            function() { totalDuration = Math.max(100, totalDuration - 100); },
            function() { totalDuration = totalDuration + 100; }
        ));
    } catch(e) {
        log("总时长按钮绑定失败: " + e);
    }
    
    // 确定按钮
    try {
        window.confirm_btn.click(function() {
            result = { interval: interval, pressDuration: pressDuration, totalDuration: totalDuration };
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

// 储存配置的键名
var STORAGE_KEY_TARGET_TIME = "jd_target_time";
var STORAGE_KEY_CLICK_X = "jd_click_x";
var STORAGE_KEY_CLICK_Y = "jd_click_y";
var STORAGE_KEY_INTERVAL = "jd_interval";
var STORAGE_KEY_PRESS_DURATION = "jd_press_duration";
var STORAGE_KEY_TOTAL_DURATION = "jd_total_duration";

// ==============================
// 2. 设置管理 - 保存和加载配置
// ==============================

/**
 * 保存用户设置到存储
 */
function saveSettings() {
    var settings = {
        targetTime: CONFIG.defaultTargetTime,
        clickX: CONFIG.clickX,
        clickY: CONFIG.clickY,
        interval: CONFIG.interval,
        pressDuration: CONFIG.pressDuration,
        totalDuration: CONFIG.totalDuration
    };
    
    storages.create("autoshop_settings").put("settings", JSON.stringify(settings));
    log("设置已保存");
}

/**
 * 加载用户设置
 */
function loadSettings() {
    try {
        var storage = storages.create("autoshop_settings");
        var settingsStr = storage.get("settings");
        
        if (settingsStr) {
            var settings = JSON.parse(settingsStr);
            CONFIG.defaultTargetTime = settings.targetTime || CONFIG.defaultTargetTime;
            CONFIG.clickX = settings.clickX || CONFIG.clickX;
            CONFIG.clickY = settings.clickY || CONFIG.clickY;
            CONFIG.interval = settings.interval || CONFIG.interval;
            CONFIG.pressDuration = settings.pressDuration || CONFIG.pressDuration;
            CONFIG.totalDuration = settings.totalDuration || CONFIG.totalDuration;
            log("已加载上次保存的设置");
            return true;
        } else {
            log("未找到保存的设置，使用默认配置");
            return false;
        }
    } catch (e) {
        log("加载设置失败: " + e);
        return false;
    }
}

/**
 * 显示主菜单，让用户选择"设置"、"运行"、"查看设置"或"退出"
 */
function showMainMenu() {
    var options = ["⚙️ 设置", "▶️ 运行", "👁️ 查看上次保存的设置", "✕ 退出"];
    var choice = dialogs.select("京东定时抢购脚本", options);
    
    if (choice === 0) {
        return "setup";
    } else if (choice === 1) {
        return "run";
    } else if (choice === 2) {
        return "view";
    } else {
        return "exit";
    }
}

/**
 * 显示上次保存的设置信息
 */
function viewSavedSettings() {
    try {
        var storage = storages.create("autoshop_settings");
        var settingsStr = storage.get("settings");
        
        if (settingsStr) {
            var settings = JSON.parse(settingsStr);
            var message = "=== 上次保存的设置 ===\n\n";
            message += "目标触发时间: " + settings.targetTime + "\n\n";
            message += "点击坐标: (" + settings.clickX + ", " + settings.clickY + ")\n\n";
            message += "点击参数:\n";
            message += "  • 间隔: " + settings.interval + "ms\n";
            message += "  • 持续时间: " + settings.pressDuration + "ms\n";
            message += "  • 总时长: " + settings.totalDuration + "ms\n";
            message += "  • 点击频率: " + calculateClicksPerSecond(settings.interval, settings.pressDuration) + "次/秒";
            
            dialogs.alert("保存的设置", message);
            return true;
        } else {
            dialogs.alert("提示", "还没有保存过设置，请先进行设置。");
            return false;
        }
    } catch (e) {
        dialogs.alert("错误", "读取设置失败: " + e);
        return false;
    }
}

/**
 * 设置流程 - 用户设置各项参数并保存
 */
function setupMode() {
    log("进入设置模式");
    toast("进入设置模式");
    
    // 1. 设置目标时间
    log("步骤 1: 设置目标时间");
    if (!setUserTargetTime()) {
        toast("设置已取消");
        return false;
    }
    
    // 2. 设置连点坐标
    log("步骤 2: 设置连点坐标");
    var choice = dialogs.confirm("设置连点坐标", "是否现在设置连点坐标？");
    if (choice) {
        setClickCoordinatesByTouching();
    }
    
    // 3. 设置点击参数
    log("步骤 3: 设置点击参数");
    choice = dialogs.confirm("设置点击参数", "是否现在设置点击参数？");
    if (choice) {
        setClickFrequency();
    }
    
    // 4. 保存设置
    log("步骤 4: 保存设置");
    saveSettings();
    dialogs.alert("设置完成", "所有设置已保存。下次运行时将自动加载这些设置。");
    
    return true;
}

/**
 * 运行流程 - 使用已保存的设置执行任务
 */
function runMode() {
    log("进入运行模式");
    
    // 0. 加载上次的设置
    loadSettings();
    
    
    // 2. 初始化：同步服务器时间
    toast("正在同步京东服务器时间...");
    var timeInfo = getServerTimeInfo();
    timeOffset = timeInfo.offset;
    log("时间偏差(ms): " + timeOffset);
    toast("时间同步完成，偏差: " + timeOffset + "ms");

    // 3. 初始化悬浮窗
    initFloatyWindow();
    
    // 4. 显示点击区域
    showClickArea();

    // 5. 解析目标时间
    var result = parseTimeString(CONFIG.defaultTargetTime);
    if (!result.valid) {
        toast("目标时间格式错误");
        return false;
    }
    
    var targetDate = new Date();
    targetDate.setHours(result.h);
    targetDate.setMinutes(result.m);
    targetDate.setSeconds(result.s);
    targetDate.setMilliseconds(result.d * 100);
    
    targetTimestamp = targetDate.getTime();
    log("目标时间: " + CONFIG.defaultTargetTime);
    log("目标时间戳: " + targetTimestamp);

    // 6. 使用setTimeout监听时间
    var hasResyncedAt1Minute = false;
    
    function timeCheckCallback() {
        if (!isRunning) {
            return;
        }
        
        var now = Date.now() + timeOffset;
        var timeUntilTarget = targetTimestamp - now;
        
        // 在触发时间开始前1分钟时，再精确同步一次
        if (timeUntilTarget <= 60000 && timeUntilTarget > 55000 && !hasResyncedAt1Minute) {
            log("距离目标时间1分钟以内，准备精确同步时间...");
            var timeInfo = getServerTimeInfo();
            timeOffset = timeInfo.offset;
            log("已重新同步时间偏差(ms): " + timeOffset);
            toast("已精确同步时间");
            hasResyncedAt1Minute = true;
        }
        
        // 更新悬浮窗时间
        updateFloatyTime(now);

        // 检查是否到达时间
        if (now >= targetTimestamp) {
            toast("已到达执行时间");
            ui.run(function() {
                if(window) window.text.setText("执行中...");
                if(window) window.text.setTextColor(colors.RED);
            });
            
            executeClickTask();
            handleFinish();
            return;
        }
        
        // 继续监听，每100ms检查一次
        setTimeout(timeCheckCallback, 100);
    }
    
    // 启动时间检测
    timeCheckCallback();
    return true;
}

// ==============================
// 2. 程序入口
// ==============================

function main() {
    // 检查无障碍服务
    auto.waitFor();
    
    while(1){
        // 显示主菜单
        var mode = showMainMenu();
    
        if (mode === "setup") {
            // 进入设置模式
            setupMode();
        } else if (mode === "run") {
            // 进入运行模式
            runMode();
            break;
        } else if (mode === "view") {
            // 查看上次保存的设置
            viewSavedSettings();
        } else { 
            toast("脚本已退出");
            break;
        }
    }
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
    
    CONFIG.defaultTargetTime = result.formatted;
    log("目标时间已设置: " + CONFIG.defaultTargetTime);
    dialogs.alert("设置完成", "目标时间: " + CONFIG.defaultTargetTime);
    
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
