/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import baseinfo from './baseinfo'
import wnetwork from './wnetwork'

const BASE_LIBRARY = baseinfo.baseLibrary
const MODEL_NAME = 'llama3.1'
const ES_REQUEST_PATH = "/bookSearch?query="

export class InteropPortalV2 {
    /**
     * @param {string} esUrl 
     * @param {import('ollama').Ollama} ollamaInstance 
     */
    constructor(ollamaInstance, esUrl) {
        /**
         * @type {import('ollama').Message[]}
         */
        this.storagedMessage = []
        this.ollama = ollamaInstance
        this.esUrl = esUrl
    }

    /**
     * 
     * @param {string} question 
     * @param {string} answer 
     * @returns {StoragedMessageIndexes}
     */
    storageMessage(question, answer) {
        let userindex = this.storagedMessage.push({
            role: 'user',
            content: question.replace(/\n\n/g, '\n')
        })
        let answerindex = this.storagedMessage.push({
            role: 'assistant',
            content: answer.replace(/\n\n/g, '\n')
        })
        return {
            userindex: userindex - 1,
            answerindex: answerindex - 1
        }
    }

    /** 
     * @param {StoragedMessageIndexes} indexes
     */
    forgiveMessage(indexes) {
        this.storagedMessage.splice(indexes.userindex, 2)
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<import("ollama").AbortableAsyncIterator<import("ollama").ChatResponse>>}
     */
    async generateChatRequest(text) {
        let messages = this.createBaseSystemPrompt()
        if (import.meta.env.MODE != "single" && import.meta.env.MODE != "debug") {
            messages = messages.concat(await this.createESPrompt(text))
        }
        messages = messages.concat(this.storagedMessage)
        messages = messages.concat(this.combineSAGEPrompt(text))
        return this.ollama.chat({
            model: MODEL_NAME,
            stream: true,
            messages: messages
        });
    }

    /**
     * @param {string} text 
     * @returns {Promise<string>}
     */
    async generateGeneratePrompt(text) {
        let messages = this.createBaseSystemPrompt()
        if (import.meta.env.MODE != "single" && import.meta.env.MODE != "debug") {
            messages = messages.concat(await this.createESPrompt(text))
        }
        messages = messages.concat(this.storagedMessage)
        messages = messages.concat(this.combineSAGEPrompt(text))
        return this.combineListToPrompt(messages)
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<import("ollama").AbortableAsyncIterator<import("ollama").GenerateResponse>>}
     */
    async generateGenerateRequest(text) {
        return this.ollama.generate({
            model: MODEL_NAME,
            prompt: await this.generateGeneratePrompt(text),
            stream: true
        })
    }

    /**
     * 
     * @param {import('ollama').Message[]} messageList 
     * @returns {string}
     */
    combineListToPrompt(messageList) {
        let prompt = ""
        const matchMap = {
            "system": "系统：",
            "user": "用户问题：",
            "assistant": "回答："
        }
        for (let message of messageList) {
            prompt += matchMap[message.role] + message.content + "\n"
        }
        return prompt
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<import('axios').AxiosResponse<any,any>}
     */
    getESPrompt(text) {
        return wnetwork.get(this.esUrl + ES_REQUEST_PATH + text)
    }

    /**
     * 
     * @param {string} text 
     * @returns {Promise<import('ollama').Message[]>}
     */
    async createESPrompt(text) {
        const response = await this.getESPrompt(text);
        let esPrompt = [];
        response.data[0].forEach(element => {
            esPrompt.push({
                role: 'user',
                content: element.title
            });
            esPrompt.push({
                role: 'assistant',
                content: element.content
            });
        })
        return esPrompt;
    }

    /**
     * 
     * @returns {import('ollama').Message[]}
     */
    createBaseSystemPrompt() {
        return [{
            role: 'system',
            content: '除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、**号进行文本强调粗体或斜体、*号来进行分条列点输出，1. 2.之类的进行分点，用汉字的第一第二代替。'
        }, {
            role: 'system',
            content: `假设你是一位研究${BASE_LIBRARY}方面的专家，你需要为青年大学生解决有关在阅读${BASE_LIBRARY}的过程中遇到的问题和困惑。`
        }]
    }

    /**
     * 
     * @param {string} text 
     * @returns {import('ollama').Message}
     */
    combineSAGEPrompt(text) {
        return {
            "role": "user",
            "content":
                `情况：大学生在阅读${BASE_LIBRARY}的过程中会产生一些疑问。
行动：请你对这些问题进行回答并给出指导建议，在回答时给予具体实例。
目标：让用户得到问题的准确答案，并从中获得对个人发展方面的建议以及对社会，人生等方面的思考。
预期: 输出文本即可。请解决以下问题：
${text}`
        }
    }
}