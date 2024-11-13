import { Client } from "@gradio/client";

import fs from "fs";
const exampleAudio = fs.readFileSync("D:\\GPT-SoVITS-v2-240821\\GPT-SoVITS-v2-240821\\这「七圣召唤」虽说是游戏，但对局之中也隐隐有策算谋略之理。.wav");

						
const app = await Client.connect("http://localhost:9872/");
const result = await app.predict("/get_tts_wav", [
				exampleAudio, 	// blob in '请上传3~10秒内参考音频，超过会报错！' Audio component		
				"这「七圣召唤」虽说是游戏，但对局之中也隐隐有策算谋略之理。", // string  in '参考音频的文本' Textbox component		
				"中文", // string  in '参考音频的语种' Dropdown component		
				"蹦蹦吧蹦蹦吧吉吉大", // string  in '需要合成的文本' Textbox component		
				"中文", // string  in '需要合成的语种.限制范围越小判别效果越好。' Dropdown component		
				"不切", // string  in '怎么切' Dropdown component		
				1, // number (numeric value between 1 and 100) in 'top_k' Slider component		
				0, // number (numeric value between 0 and 1) in 'top_p' Slider component		
				0, // number (numeric value between 0 and 1) in 'temperature' Slider component		
				true, // boolean  in '开启无参考文本模式。不填参考文本亦相当于开启。' Checkbox component		
				0.6, // number (numeric value between 0.6 and 1.65) in '语速' Slider component		
				true, // boolean  in '是否直接对上次合成结果调整语速和音色。防止随机性。' Checkbox component 	// blob in '可选项：通过拖拽多个文件上传多个参考音频（建议同性），平均融合他们的音色。如不填写此项，音色由左侧单个参考音频控制。如是微调模型，建议参考音频全部在微调训练集音色内，底模不用管。' File component
	]);

console.log(result);
