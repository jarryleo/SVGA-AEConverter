/**
 * PNG 透明边裁剪 + SVGA spec 布局补偿（纯 Node，无第三方依赖）
 *
 * 导出流程里的后处理：把每张贴图裁到 alpha 包围盒，再把裁剪偏移换算进
 * layout 的宽高与 matrix 的 tx/ty，保证播放时的位置、缩放、旋转都不变。
 * 同时在 spec 层剔除"整段不可见"的 sprite 与不再被引用的图片。
 */

var PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

// 面板里已经存在全局 zlib；单独用 Node 跑测试时自己 require 一份
var PNG_ZLIB = (function () {
    if (typeof require === "function") {
        try { return require("zlib"); } catch (e) { }
    }
    if (typeof zlib !== "undefined") { return zlib; }
    return null;
})();

var PNG_CRC_TABLE = (function () {
    var table = [];
    for (var n = 0; n < 256; n += 1) {
        var c = n;
        for (var k = 0; k < 8; k += 1) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function pngCrc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i += 1) {
        c = PNG_CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
    var len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    var typeBuf = Buffer.from(type, "ascii");
    var body = Buffer.concat([typeBuf, data]);
    var crc = Buffer.alloc(4);
    crc.writeUInt32BE(pngCrc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
}

function pngReadChunks(buf) {
    var out = { ihdr: null, idat: [], done: false };
    var pos = 8;
    while (pos + 8 <= buf.length) {
        var len = buf.readUInt32BE(pos);
        var type = buf.toString("ascii", pos + 4, pos + 8);
        var data = buf.slice(pos + 8, pos + 8 + len);
        if (type === "IHDR") {
            out.ihdr = data;
        } else if (type === "IDAT") {
            out.idat.push(data);
        } else if (type === "IEND") {
            out.done = true;
            break;
        }
        pos += 12 + len;
    }
    out.IDAT = Buffer.concat(out.idat);
    return out;
}

/**
 * 解码 PNG 为 RGBA8888。只支持 8bit、非隔行、colorType 0/2/4/6。
 * 不支持的格式返回 null（调用方跳过该图，不影响导出）。
 */
function pngDecodeToRgba(buf) {
    try {
        if (!buf || buf.length < 24) { return null; }
        for (var i = 0; i < 8; i += 1) {
            if (buf[i] !== PNG_SIGNATURE[i]) { return null; }
        }
        var chunks = pngReadChunks(buf);
        if (!chunks.ihdr || !chunks.IDAT || chunks.IDAT.length === 0) { return null; }
        var width = chunks.ihdr.readUInt32BE(0);
        var height = chunks.ihdr.readUInt32BE(4);
        var depth = chunks.ihdr[8];
        var colorType = chunks.ihdr[9];
        var interlace = chunks.ihdr[12];
        if (depth !== 8 || interlace !== 0 || width <= 0 || height <= 0) { return null; }
        var channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 })[colorType];
        if (!channels) { return null; }

        var raw = PNG_ZLIB.inflateSync(chunks.IDAT);
        var stride = width * channels;
        var out = Buffer.alloc(width * height * 4);
        var prev = Buffer.alloc(stride);

        for (var y = 0; y < height; y += 1) {
            var filter = raw[y * (stride + 1)];
            var rowStart = y * (stride + 1) + 1;
            var cur = Buffer.alloc(stride);
            for (var x = 0; x < stride; x += 1) {
                var a = x >= channels ? cur[x - channels] : 0;
                var b = prev[x];
                var c = x >= channels ? prev[x - channels] : 0;
                var v = raw[rowStart + x];
                switch (filter) {
                    case 0: cur[x] = v; break;
                    case 1: cur[x] = (v + a) & 255; break;
                    case 2: cur[x] = (v + b) & 255; break;
                    case 3: cur[x] = (v + ((a + b) >> 1)) & 255; break;
                    case 4: {
                        var p = a + b - c;
                        var pa = p > a ? p - a : a - p;
                        var pb = p > b ? p - b : b - p;
                        var pc = p > c ? p - c : c - p;
                        var pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
                        cur[x] = (v + pr) & 255;
                        break;
                    }
                    default: return null;
                }
            }
            for (var px = 0; px < width; px += 1) {
                var o = (y * width + px) * 4;
                if (colorType === 6) {
                    out[o] = cur[px * 4]; out[o + 1] = cur[px * 4 + 1];
                    out[o + 2] = cur[px * 4 + 2]; out[o + 3] = cur[px * 4 + 3];
                } else if (colorType === 2) {
                    out[o] = cur[px * 3]; out[o + 1] = cur[px * 3 + 1];
                    out[o + 2] = cur[px * 3 + 2]; out[o + 3] = 255;
                } else if (colorType === 0) {
                    var g = cur[px];
                    out[o] = g; out[o + 1] = g; out[o + 2] = g; out[o + 3] = 255;
                } else {
                    var g2 = cur[px * 2];
                    out[o] = g2; out[o + 1] = g2; out[o + 2] = g2; out[o + 3] = cur[px * 2 + 1];
                }
            }
            prev = cur;
        }
        return { width: width, height: height, colorType: colorType, data: out };
    } catch (e) {
        return null;
    }
}

function pngEncodeRgba(width, height, rgba) {
    var rows = [];
    for (var y = 0; y < height; y += 1) {
        var line = Buffer.alloc(1 + width * 4);
        line[0] = 0; // filter: none
        rgba.copy(line, 1, y * width * 4, (y + 1) * width * 4);
        rows.push(line);
    }
    var ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;   // bit depth
    ihdr[9] = 6;   // RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    var head = Buffer.from(PNG_SIGNATURE);
    return Buffer.concat([
        head,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", PNG_ZLIB.deflateSync(Buffer.concat(rows), { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

/** 读取 WebP 尺寸（VP8X / VP8 / VP8L 三种容器） */
function webpSize(buf) {
    try {
        if (!buf || buf.length < 30) { return null; }
        if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") { return null; }
        var pos = 12;
        while (pos + 8 <= buf.length) {
            var fourcc = buf.toString("ascii", pos, pos + 4);
            var size = buf.readUInt32LE(pos + 4);
            var d = pos + 8;
            if (fourcc === "VP8X") {
                return { width: 1 + buf.readUIntLE(d + 4, 3), height: 1 + buf.readUIntLE(d + 7, 3) };
            }
            if (fourcc === "VP8 ") {
                if (buf[d + 3] === 0x9d && buf[d + 4] === 0x01 && buf[d + 5] === 0x2a) {
                    return {
                        width: buf.readUInt16LE(d + 6) & 0x3FFF,
                        height: buf.readUInt16LE(d + 8) & 0x3FFF,
                    };
                }
            }
            if (fourcc === "VP8L") {
                var bits = buf.readUInt32LE(d + 1);
                return {
                    width: (bits & 0x3FFF) + 1,
                    height: ((bits >>> 14) & 0x3FFF) + 1,
                };
            }
            pos += 8 + size + (size & 1);
        }
        return null;
    } catch (e) {
        return null;
    }
}

/** 计算 alpha 包围盒；整张全透明返回 null */
function pngAlphaBounds(rgba, width, height) {
    var minX = width, minY = height, maxX = -1, maxY = -1;
    for (var y = 0; y < height; y += 1) {
        for (var x = 0; x < width; x += 1) {
            var o = (y * width + x) * 4 + 3;
            if (rgba[o] !== 0) {
                if (x < minX) { minX = x; }
                if (x > maxX) { maxX = x; }
                if (y < minY) { minY = y; }
                if (y > maxY) { maxY = y; }
            }
        }
    }
    if (maxX < 0) { return null; }
    return { left: minX, top: minY, right: maxX, bottom: maxY };
}

/**
 * 裁剪一张 PNG 的透明边。
 * 返回 null（无需裁剪/不支持）| {empty:true}（整张全透明）| 带 buffer 的裁剪结果。
 */
function pngTrimBuffer(buf) {
    var png = pngDecodeToRgba(buf);
    if (!png) { return null; }
    if (png.colorType !== 6 && png.colorType !== 4) { return null; } // 无 alpha 通道，不裁
    var bounds = pngAlphaBounds(png.data, png.width, png.height);
    if (!bounds) { return { empty: true, originalWidth: png.width, originalHeight: png.height }; }
    var width = bounds.right - bounds.left + 1;
    var height = bounds.bottom - bounds.top + 1;
    if (bounds.left === 0 && bounds.top === 0 && width === png.width && height === png.height) {
        return null;
    }
    var cropped = Buffer.alloc(width * height * 4);
    for (var y = 0; y < height; y += 1) {
        var srcStart = ((y + bounds.top) * png.width + bounds.left) * 4;
        png.data.copy(cropped, y * width * 4, srcStart, srcStart + width * 4);
    }
    return {
        left: bounds.left,
        top: bounds.top,
        width: width,
        height: height,
        originalWidth: png.width,
        originalHeight: png.height,
        buffer: pngEncodeRgba(width, height, cropped),
    };
}

/** sprite 的任意一帧带遮罩时跳过裁剪：clipPath 在图层本地坐标里，裁剪会让遮罩错位 */
function spriteHasClipPath(sprite) {
    var frames = (sprite && sprite.frames) || [];
    for (var i = 0; i < frames.length; i += 1) {
        var f = frames[i];
        if (f && typeof f.clipPath === "string" && f.clipPath !== "") { return true; }
    }
    return false;
}

/**
 * 把裁剪偏移补偿进 spec：
 *   layout 宽高改成裁剪后的尺寸（左上角仍是元素原点）
 *   矩阵右乘平移 (left, top)：tx' = a*left + c*top + tx，ty' = b*left + d*top + ty
 * 这样贴图内容在画布上的落点与裁剪前完全一致。
 */
function applyTrimsToSpec(spec, trims) {
    if (!spec || !spec.sprites) { return; }
    for (var i = 0; i < spec.sprites.length; i += 1) {
        var sprite = spec.sprites[i];
        var t = trims[sprite.imageKey];
        if (!t) { continue; }
        var frames = sprite.frames || [];
        for (var f = 0; f < frames.length; f += 1) {
            var frame = frames[f];
            if (!frame || !frame.layout) { continue; }
            frame.layout.width = t.width;
            frame.layout.height = t.height;
            if (frame.transform) {
                var m = frame.transform;
                m.tx = parseFloat((m.a * t.left + m.c * t.top + m.tx).toFixed(6));
                m.ty = parseFloat((m.b * t.left + m.d * t.top + m.ty).toFixed(6));
            } else {
                // writer 会省略"单位矩阵"，裁剪后必须把偏移补回来
                frame.transform = { a: 1, b: 0, c: 0, d: 1, tx: t.left, ty: t.top };
            }
        }
    }
}

/** sprite 是否整段不可见（所有帧的 alpha 都被 writer 删掉了） */
function spriteIsInvisible(sprite) {
    var frames = (sprite && sprite.frames) || [];
    if (frames.length === 0) { return false; }
    for (var i = 0; i < frames.length; i += 1) {
        var f = frames[i];
        if (f && f.alpha !== undefined && f.alpha !== null && f.alpha > 0) { return false; }
    }
    return true;
}

/** 只保留仍被 sprite 引用的图片映射，去掉被剔除元素留下的空 key */
function rebuildImagesMap(spec) {
    if (!spec || !spec.images) { return; }
    var used = {};
    var sprites = spec.sprites || [];
    for (var i = 0; i < sprites.length; i += 1) { used[sprites[i].imageKey] = true; }
    var map = {};
    var keys = Object.keys(spec.images);
    for (var k = 0; k < keys.length; k += 1) {
        if (used[keys[k]] === true) { map[keys[k]] = spec.images[keys[k]]; }
    }
    spec.images = map;
}

/**
 * 运行时替换用图（必须保留原尺寸）：
 *   - 老写法：图片名里带 #dynamic / #replace
 *   - 新规则：图层名包含 avatar / nick / id（大小写不敏感、空格可有可无），如 avatar1、nick 2、id3
 * `id` 需要独立成词或带编号（id、id2、xxx_id），避免误伤 video、grid 这类单词。
 */
function isDynamicImageKey(key) {
    if (!key) { return false; }
    var k = String(key).toLowerCase().replace(/\s+/g, "");
    if (k.indexOf("#dynamic") >= 0 || k.indexOf("#replace") >= 0) { return true; }
    if (k.indexOf("avatar") >= 0 || k.indexOf("nick") >= 0) { return true; }
    //id：独立成词或带编号（id / id2 / xxx_id / icon-id-1 / idcard），避免误伤 video、grid、solid
    //replace_<id>：图层名全是中文等无法转成文件名的替换用图，命名时的兜底
    return /(^|[^a-z0-9])id([^a-z]|$)/.test(k) || k.indexOf("idcard") >= 0 || /^replace_\d+$/.test(k);
}

var PNG_FS = (function () { try { return require("fs"); } catch (e) { return null; } })();
var PNG_PATH = (function () { try { return require("path"); } catch (e) { return null; } })();

/**
 * 对导出目录做后处理：剔除全透明元素 → 删掉孤立图片 → 透明边裁剪 → 改写 spec。
 * 返回 { imageList, stats, trims }，由调用方决定怎么打包。
 */
function optimizeWorksDir(workDir, imageList) {
    var fs = PNG_FS, p = PNG_PATH;
    var specPath = p.join(workDir, "movie.spec");
    var spec = JSON.parse(fs.readFileSync(specPath, { encoding: "utf-8" }));
    var stats = { prunedSprites: 0, removedImages: 0, trimmedImages: 0, protectedImages: 0, savedPixels: 0, savedBytes: 0 };
    var files = imageList.slice();
    var trimMap = {};

    // 1) 剔除整段不可见的 sprite
    if (spec.sprites && spec.sprites.length) {
        var kept = [];
        for (var i = 0; i < spec.sprites.length; i += 1) {
            var sprite = spec.sprites[i];
            if (spriteIsInvisible(sprite) && !isDynamicImageKey(sprite.imageKey)) {
                stats.prunedSprites += 1;
                continue;
            }
            kept.push(sprite);
        }
        spec.sprites = kept;
    }

    // 2) 删掉不再被任何 sprite 引用的图片
    var usedKeys = {};
    (spec.sprites || []).forEach(function (s) { usedKeys[s.imageKey] = true; });
    for (var fIndex = files.length - 1; fIndex >= 0; fIndex -= 1) {
        var fileName = String(files[fIndex]);
        if (fileName === "movie.spec") { continue; }
        var fileKey = fileName.replace(/\.(png|jpg|jpeg)$/i, "");
        if (usedKeys[fileKey] !== true) {
            try { fs.unlinkSync(p.join(workDir, fileName)); } catch (e) { }
            stats.removedImages += 1;
            files.splice(fIndex, 1);
        }
    }

    // 3) 透明边裁剪
    var byKey = {};
    (spec.sprites || []).forEach(function (s) { byKey[s.imageKey] = s; });
    for (var pIndex = files.length - 1; pIndex >= 0; pIndex -= 1) {
        var pngName = String(files[pIndex]);
        if (!/\.png$/i.test(pngName)) { continue; }
        var pngKey = pngName.replace(/\.png$/i, "");
        if (isDynamicImageKey(pngKey)) { stats.protectedImages += 1; continue; }
        var sprite = byKey[pngKey];
        if (!sprite || spriteHasClipPath(sprite)) { continue; }

        var filePath = p.join(workDir, pngName);
        try {
            var originalBytes = fs.statSync(filePath).size;
            var trimResult = pngTrimBuffer(fs.readFileSync(filePath));
            if (trimResult && trimResult.empty) {
                fs.unlinkSync(filePath);
                files.splice(pIndex, 1);
                spec.sprites = (spec.sprites || []).filter(function (s) { return s.imageKey !== pngKey; });
                stats.prunedSprites += 1;
                stats.removedImages += 1;
                continue;
            }
            if (trimResult && trimResult.buffer) {
                fs.writeFileSync(filePath, trimResult.buffer);
                trimMap[pngKey] = {
                    left: trimResult.left,
                    top: trimResult.top,
                    width: trimResult.width,
                    height: trimResult.height,
                    originalWidth: trimResult.originalWidth,
                    originalHeight: trimResult.originalHeight,
                };
                stats.trimmedImages += 1;
                stats.savedPixels += (trimResult.originalWidth * trimResult.originalHeight - trimResult.width * trimResult.height);
                var newBytes = fs.statSync(filePath).size;
                if (originalBytes > newBytes) { stats.savedBytes += originalBytes - newBytes; }
            }
        } catch (e) {
            // 单张图解码失败不影响整体导出
        }
    }

    // 4) 布局补偿 + images 映射同步
    applyTrimsToSpec(spec, trimMap);
    rebuildImagesMap(spec);
    fs.writeFileSync(specPath, JSON.stringify(spec), "utf8");

    return { imageList: files, stats: stats, trims: trimMap };
}

if (typeof module !== "undefined" && module && module.exports) {
    module.exports = {
        pngDecodeToRgba: pngDecodeToRgba,
        pngEncodeRgba: pngEncodeRgba,
        pngAlphaBounds: pngAlphaBounds,
        pngTrimBuffer: pngTrimBuffer,
        webpSize: webpSize,
        applyTrimsToSpec: applyTrimsToSpec,
        spriteHasClipPath: spriteHasClipPath,
        spriteIsInvisible: spriteIsInvisible,
        rebuildImagesMap: rebuildImagesMap,
        isDynamicImageKey: isDynamicImageKey,
        optimizeWorksDir: optimizeWorksDir,
    };
}
