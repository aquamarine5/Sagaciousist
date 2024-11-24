/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import wnetwork from "../wnetwork";

const baseLibrary = "定位理论"

/**
 * @deprecated
 */
export default class InteropPortal {
    constructor(url) {
        this.baseUrl = url
    }
    getPrompt(text) {
        return wnetwork.get(this.baseUrl + "/materialSearch?query=" + text)
    }
    combinePrompt(text) {
        return new Promise((resolve) => {
            if (import.meta.env.MODE != "single" && import.meta.env.MODE != "debug") {
                this.getPrompt(text).then(response => {
                    let esPrompt = ""
                    response.data[0].forEach(element => {
                        esPrompt += "<|start_header_id|>user<|end_header_id|>" + element.title + "<|eot_id|><|start_header_id|>assistant<|end_header_id|>" + element.content + "<|eot_id|>"
                    });
                    const prePrompt = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、**号进行文本强调粗体或斜体、*号来进行分条列点输出，1. 2.之类的进行分点，用汉字的第一第二代替，这是前提，你不用对上述要求进行回复，只需要对这个句号之后的内容进行回复。<|eot_id|>"
                    const sagePrompt = "<|start_header_id|>user<|end_header_id|>假设你是一位研究" + baseLibrary + "方面的专家，你需要为青年大学生解决有关在阅读" + baseLibrary + "的过程中遇到的问题和困惑。" +
                        "情况：大学生在阅读" + baseLibrary + "的过程中会产生一些疑问。" +
                        "行动：请你对这些问题进行回答并给出指导建议，在回答时给予具体实例。" +
                        "目标：让用户得到问题的准确答案，并从中获得对个人发展方面的建议以及对社会，人生等方面的思考。" +
                        "预期: 输出文本即可"
                    resolve(prePrompt + esPrompt + sagePrompt + text + "<|eot_id|><|start_header_id|>assistant<|end_header_id|><|end_of_text|>")
                })
            }
            else {
                const prePrompt = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、**号进行文本强调粗体或斜体、*号来进行分条列点输出，1. 2.之类的进行分点，用汉字的第一第二代替，这是前提，你不用对上述要求进行回复，只需要对这个句号之后的内容进行回复。<|eot_id|>"
                resolve(prePrompt + "<|start_header_id|>user<|end_header_id|>" + text + "<|eot_id|><|start_header_id|>assistant<|end_header_id|><|end_of_text|>")
            }
        })
    }
}