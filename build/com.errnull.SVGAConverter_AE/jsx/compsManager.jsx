var alertMessage = function (message) {
    alert(message);
}

var confirmMessage = function (message) {
    return confirm(message);
}

function getActiveInfo() {

    //不同 AE 版本启动时可能没有工程 / 工程未保存 / 未激活合成，统一返回状态码交给面板处理
    if (!app.project) {
        return "NO_PROJECT";
    }
    if (!app.project.file) {
        return "NO_FILE";
    }
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return "NO_COMP";
    }

    app.project.save();
    var path = app.project.file.fsName + '_and_' + app.project.activeItem.name;
    return path;
}

function correctMessage(path) {

    var file = new File(path)
    //注意：Temp.aep 是"另存为"出来的临时工程，保存前一定不存在，
    //所以只能先保存再校验，不能提前判断 file.exists
    try {
        app.project.save(file)
    } catch (e) {
        return "ERROR:保存临时工程失败：" + path + "\n" + e.toString();
    }
    if (!file.exists) {
        return "ERROR:保存临时工程失败，未生成文件：" + path + "\n请检查该目录是否可写。";
    }
    app.open(file)

    var myItems = app.project.items;

    if (app.project.activeItem instanceof CompItem && app.project.activeItem.workAreaDuration != app.project.activeItem.duration) {
        var newDuration = parseFloat(app.project.activeItem.workAreaStart.toFixed(2)) + parseFloat(app.project.activeItem.workAreaDuration.toFixed(2));
        if (confirmMessage("动画时长与工作区时长不同。\n是否按照工作区将动画时长设置为：" + newDuration + "  秒 ？")) {
            app.project.activeItem.duration = newDuration;
        }
    }

    var legalFPS = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];

    for (var i = 1; i <= myItems.length; i++) {
        if (!(myItems[i] instanceof CompItem)) {
            continue;
        }
        var fps = myItems[i].frameRate;
        if (fps > 60 || (fps > 0 && (60 % fps) == 0)) {
            continue;
        }
        //取最接近的合法帧率（和合成自身的 frameRate 比较，而不是和项目下标比较）
        for (var j = 1; j < legalFPS.length; j++) {
            if (legalFPS[j] >= fps) {
                var lo = legalFPS[j - 1];
                var hi = legalFPS[j];
                try {
                    myItems[i].frameRate = (fps - lo) <= (hi - fps) ? lo : hi;
                } catch (e) {
                    //部分 AE 版本不允许修改正在使用的合成帧率，跳过即可
                }
                break;
            }
        }
    }
    app.project.save();
    return "OK";
}

function openProject(path) {

    if (!path) {
        return;
    }
    try {
        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    } catch (e) {
    }
    app.open(new File(path));
}

function browseFolder() {
    var uri;

    uri = Folder.desktop.absoluteURI;

    var f = new File(uri);
    var openFileData = f.openDlg();

    if (openFileData !== null) {

        var compositionDestinationData = {
            absoluteURI: openFileData.absoluteURI,
            destination: openFileData.fsName,
            // id: id
        }

        return compositionDestinationData.destination;
    }
    f.close();
}
