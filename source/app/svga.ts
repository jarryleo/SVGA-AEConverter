/// <reference path="../declear/ae.declare.ts" />
/// <reference path="../declear/svga.declare.ts" />
/// <reference path="../converter/converter.ts" />
/// <reference path="../writer/writer.ts" />

/**
 * Author: Pony Cui
 * Date: 2016.08.01
 * Dev: TypeScript 1.8
 * Env: After Effects CC 2015 ~ 2024+ (any version)
 * Build: npm install & npm start
 */

var startConvert = function (outputPath) {

    //统一路径分隔符（Windows 下 nodePath.join 给的是反斜杠，会导致 split('/') 失效）
    var normalizedPath = String(outputPath).replace(/\\/g, "/");

    //将路径和文件名称分离
    var pathArr = normalizedPath.split('/');
    pathArr.pop();

    var path = pathArr.join('/') + "/svga_works";

    //不同 AE 版本启动状态不同，统一做前置校验，出错时把原因回传给面板
    if (!app.project) {
        return "ERROR:当前没有打开的工程，请先在 After Effects 中打开要转换的 .aep 工程。";
    }
    if (!app.project.activeItem) {
        return "ERROR:未激活任何合成，请在项目面板中双击打开要转换的合成。";
    }
    if (!(app.project.activeItem instanceof CompItem)) {
        return "ERROR:当前激活的素材不是合成（Comp），请双击项目面板中的合成后再转换。";
    }

    try {
        let thisConverter = new Converter(app);

        let thisWriter = new Writer(thisConverter, path);
        thisWriter.write();
    } catch (e) {
        return "ERROR:" + ((e && e.message) ? e.message : String(e));
    }

    return path;
}
