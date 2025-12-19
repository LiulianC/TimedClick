/**
 * AutoJS - 获取点击坐标脚本（简化版）
 * 功能：监听屏幕任意位置的点击，获取坐标
 */

auto.waitFor();

var coordinates = [];
var clickCount = 0;
var isListening = true;
var screenWidth = device.width;
var screenHeight = device.height;

// 全屏悬浮窗捕获点击
var fullScreenWindow = floaty.window(
    <frame id="root" gravity="center" bg="#00000000" w="{{screenWidth}}" h="{{screenHeight}}">
        <text id="text" textSize="16sp" textColor="#ffffff" text="" />
    </frame>
);

fullScreenWindow.setPosition(0, 0);
fullScreenWindow.setSize(screenWidth, screenHeight);

// 控制窗口
var controlWindow = floaty.window(
    <frame gravity="center" bg="#aa000000" padding="10">
        <text id="control" textSize="14sp" textColor="#ffffff" text="准备中...\n\n双击停止" />
    </frame>
);

controlWindow.setPosition(100, 100);
var lastControlClickTime = 0;

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

// 监听点击
fullScreenWindow.root.setOnTouchListener(function(view, event) {
    if (event.getAction() == event.ACTION_DOWN) {
        var x = Math.round(event.getRawX());
        var y = Math.round(event.getRawY());
        
        clickCount++;
        coordinates.push({x: x, y: y});
        
        log("点击 #" + clickCount + ": (" + x + ", " + y + ")");
        
        ui.run(function() {
            controlWindow.control.setText("共 " + clickCount + " 次\n(" + x + ", " + y + ")\n\n双击停止");
        });
    }
    return true;
});

log("点击坐标获取工具已启动");

while (isListening) {
    sleep(1000);
}

log("\n获取的所有坐标:");
for (var i = 0; i < coordinates.length; i++) {
    log("点击 #" + (i+1) + ": (" + coordinates[i].x + ", " + coordinates[i].y + ")");
}

if (fullScreenWindow) fullScreenWindow.close();
if (controlWindow) controlWindow.close();

exit();
