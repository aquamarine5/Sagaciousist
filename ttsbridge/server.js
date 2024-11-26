/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import http from 'http';
import url from 'url';
import fs from 'fs';
import { Client } from '@gradio/client';

const port = 1114;

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    if (req.method === 'POST' && parsedUrl.pathname === '/tts') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { text } = JSON.parse(body);

                if (!text) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: '请求体中缺少 text 字段' }));
                    return;
                }

                // 在这里处理 TTS 请求，例如调用 TTS 服务生成音频
                console.log(`接收到的文本: ${text}`);
                const exampleAudio = fs.readFileSync("D:\\GPT-SoVITS-v2-240821\\GPT-SoVITS-v2-240821\\这「七圣召唤」虽说是游戏，但对局之中也隐隐有策算谋略之理。.wav");

                const app = await Client.connect("http://localhost:9872/");
                let data = [
                    exampleAudio, 	// blob in '请上传3~10秒内参考音频，超过会报错！' Audio component		
                    "这「七圣召唤」虽说是游戏，但对局之中也隐隐有策算谋略之理。", // string  in '参考音频的文本' Textbox component		
                    "中文", // string  in '参考音频的语种' Dropdown component		
                    text, // string  in '需要合成的文本' Textbox component		
                    "中英混合", // string  in '需要合成的语种.限制范围越小判别效果越好。' Dropdown component		
                    "凑四句一切", // string  in '怎么切' Dropdown component		
                    15, // number (numeric value between 1 and 100) in 'top_k' Slider component		
                    1, // number (numeric value between 0 and 1) in 'top_p' Slider component		
                    1, // number (numeric value between 0 and 1) in 'temperature' Slider component		
                    false, // boolean  in '开启无参考文本模式。不填参考文本亦相当于开启。' Checkbox component		
                    1, // number (numeric value between 0.6 and 1.65) in '语速' Slider component		
                    false, // boolean  in '是否直接对上次合成结果调整语速和音色。防止随机性。' Checkbox component 	// blob in '可选项：通过拖拽多个文件上传多个参考音频（建议同性），平均融合他们的音色。如不填写此项，音色由左侧单个参考音频控制。如是微调模型，建议参考音频全部在微调训练集音色内，底模不用管。' File component
                ]
                console.log(data)
                const result = await app.predict("/get_tts_wav", data);
                console.log(result);
                // 读取生成的音频文件并转换为 Base64 编码字符串
                const audioBuffer = fs.readFileSync(result.data[0].path);
                const audioData = audioBuffer.toString('base64');

                // 返回生成的音频数据
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ audio: audioData }));
            } catch (error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '未找到' }));
    }
});

server.listen(port, () => {
    console.log(`服务器正在监听 http://localhost:${port}`);
});