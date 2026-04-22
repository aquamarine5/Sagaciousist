<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import { ElButton, ElInput, ElNotification } from 'element-plus';
import { Ollama } from 'ollama/src/browser';
import { ref } from 'vue';
import MdiSendVariant from '~icons/mdi/send-variant?width=1.5em&height=1.5em';
import LineMdLoadingTwotoneLoop from '~icons/line-md/loading-twotone-loop?width=1.8em&height=1.8em';
import LucideCircleCheckBig from '~icons/lucide/circle-check-big?width=1.5em&height=1.5em';
import LyricfulResponse from './LyricfulResponse.vue';
import QuestionsTipDisplayer from './QuestionsTipDisplayer.vue';
import { InteropPortalV2 } from '@/interopv2';
import baseinfo from '@/baseinfo';
import LucideBookOpen from '~icons/lucide/book-open?width=24px&height=24px';
import LucideMessageSquare from '~icons/lucide/message-square?width=16px&height=16px';
import LucidePaperclip from '~icons/lucide/paperclip?width=16px&height=16px';

let nowtime = new Date().getHours()
var text = ""
if (0 <= nowtime && nowtime < 4)
    text = "深夜时分，正是研读经典的好时光"
else if (4 <= nowtime && nowtime <= 11)
    text = "晨读经典，开启智慧的一天"
else if (12 <= nowtime && nowtime <= 17)
    text = "午后时光，不妨与经典对话"
else if (18 <= nowtime && nowtime <= 24)
    text = "晚间宁静，正是思考的好时机"
const finalText = text

const typingText = ref("")
var index = 0
function typingNext() {
    if (index != finalText.length) {
        let char = finalText[index]
        if (char == "\uD83D") {
            index += 1
            char += finalText[index]
        }
        typingText.value += char
        index += 1
        setTimeout(typingNext, 200)
    }
}
typingNext()

// 示例问题发送函数，这里的问题是静态的，可以使用问答文档中的问题，然后直接返回答案
function sendExampleQuestion(question) {
    inputText.value = question
    onsend()
}

// 响应式数据
const lyricful = ref(null)
const lyricful_data = ref([])
const inputText = ref('')
// const isselecting = ref(true)
const isediting = ref(false)
var editingQAStructure = null
const iswelcome = ref(true)
const isRunning = ref(false)
const splitPatterns = ['。', "！", "？", "，", "：", "；"]
const showPendingTips = ref(false)
var responseStatus = undefined
const isloading = ref(false)
// const interopPortal = new InteropPortal("http://localhost:8080")
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
const interopPortalV2 = ref(new InteropPortalV2(ollama, "http://localhost:8080"))

// 处理提问的方法
async function handleAskQuestion(question) {
    inputText.value = question;
    await onsend()
}

function readFinished() {
    isRunning.value = false
}

function loadingFinished() {
    isloading.value = false
}
/**
 * @param {QAStructure} qastructure
 */
function onSwitchEditMode(qastructure) {
    isediting.value = true
    inputText.value = qastructure.question
    editingQAStructure = qastructure
}

async function onsend() {
    if (inputText.value == '') {
        ElNotification({
            type: 'warning',
            title: "内容不能为空！",
            message: "内容不能为空！",
        })
        return
    }
    if (isediting.value) {
        isediting.value = false
        editingQAStructure.question = inputText.value
        lyricful.value.regenerateResponse(editingQAStructure)
        return
    }
    if (isRunning.value) {
        lyricful.value.ttsStop()
        isRunning.value = false
        return
    }
    iswelcome.value = false
    isloading.value = true
    isRunning.value = true
    responseStatus = true
    lyricful.value.clearAllLyrics()
    speechSynthesis.cancel()
    // const seg = new Intl.Segmenter("zh", { granularity: "sentence" })
    setTimeout(function () {
        if (responseStatus) {
            showPendingTips.value = true
        }
    }, 1000)
    if (import.meta.env.MODE == "pages") {
        [
            // hhh，来自开发者的恶趣味~~
            "抱歉，由于当前环境限制，基于Github Pages的 Sagaciousist 无法使用此功能。",
            "请在本地运行项目以使用此功能。",
            "但是，我可以给你唱歌哦！",
            "笨笨的我，傻傻的活",
            "容易感动没有心机",
            "吃了亏还不知道长记性",
            "一路走来我不优秀",
            "但我善良不虚伪",
            "———— 那艺娜《笨笨的我傻傻的活》"
        ].forEach((v) => lyricful.value.addSentence(v))
    } else {
        lyricful.value.checkTTSStatus()
        let itext = inputText.value
        /**
         * @type {QAStructure}
         */
        let qastruct = lyricful.value.createQAStructure(itext)
        inputText.value = ""
        const response = await interopPortalV2.value.generateChatRequest(itext)
        //const response = await interopPortalV2.generateGenerateRequest(itext)
        var lastSentence = ''
        var allResponse = ''
        var isThinking = false
        console.log(qastruct)
        for await (const part of response) {
            let content = part.message.content
            //let content = part.response
            var thinkingValue = isThinking ? 2 : 0
            if (content.indexOf("<think>") != -1) {
                content = "正在深度思考：\n"
                isThinking = true
                thinkingValue = 1
            }
            if (content.indexOf("</think>") != -1) {
                content = "深度思考完毕。"
                isThinking = false
                thinkingValue = 3
            }
            content = content.replace(/\*\*/g, "").replace(/#/g, "")
            allResponse += content
            for (let index = 0; index < content.length; index++) {
                const char = content[index];
                if (char == '\n') {
                    lyricful.value.addSentence(qastruct.answer, lastSentence, false, thinkingValue)
                    console.log("issplit: true")
                    lastSentence = ''
                }
            }, 1000)
            if (import.meta.env.MODE == "pages") {
                [
                    "抱歉，由于当前环境限制，基于Github Pages的 Sagaciousist 无法使用此功能。",
                    "请在本地运行项目以使用此功能。",
                    "但是，我可以给你唱歌哦！",
                    "笨笨的我，傻傻的活",
                    "容易感动没有心机",
                    "吃了亏还不知道长记性",
                    "一路走来我不优秀",
                    "但我善良不虚伪",
                    "———— 那艺娜《笨笨的我傻傻的活》"
                ].forEach((v) => lyricfulRef.addSentence(v))
            } else {
                lyricfulRef.checkTTSStatus()
                let itext = this.inputText
                /**
                 * @type {QAStructure}
                 */
                let qastruct = lyricfulRef.createQAStructure(itext)
                this.inputText = ""
                //const response = await interopPortalV2.generateChatRequest(itext)
                const response = await interopPortalV2.generateGenerateRequest(itext)
                var lastSentence = ''
                var allResponse = ''
                console.log(qastruct)
                for await (const part of response) {
                    //let content = part.message.content
                    let content = part.response
                    if (part.thinking != undefined && part.thinking != "") {
                        lyricfulRef.addThinking(part.thinking)
                        continue
                    }
                    console.log(part)
                    allResponse += content
                    for (let index = 0; index < content.length; index++) {
                        const char = content[index];
                        if (char == '\n') {
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, true)
                            console.log("issplit: true")
                            lastSentence = ''
                        }
                        lastSentence += char
                        if (!isRunning.value) {
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, false)
                            break
                        }
                        if ((char == '.' || char == ':') && /[0-9]/.test(lastSentence[lastSentence.length - 2])) {
                            continue
                        }
                        if (char == '.' && lastSentence[lastSentence.length - 2] == ".")
                            continue
                        if (splitPatterns.indexOf(char) != -1) {
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, false)
                            lastSentence = ''
                        }
                    }
                    if (!isRunning.value) {
                        break
                    }
                }
                if ((char == '.' || char == ':') && /[0-9]/.test(lastSentence[lastSentence.length - 2])) {
                    continue
                }
                if (char == '.' && lastSentence[lastSentence.length - 2] == ".")
                    continue
                if (splitPatterns.indexOf(char) != -1) {
                    lyricful.value.addSentence(qastruct.answer, lastSentence, false, thinkingValue)
                    lastSentence = ''
                }
            }
            if (!isRunning.value) {
                break
            }
        }
        console.log("last content: " + lastSentence)
        if (lyricful.value.ttsEndMark()) {
            isRunning.value = false
        }
        let messageIndex = interopPortalV2.value.storageMessage(itext, allResponse)
        console.log(messageIndex)
        qastruct.messageIndexes = messageIndex
    }
    setTimeout(function () {
        responseStatus = false
        showPendingTips.value = false
    }, 100)
}

// 提供给模板使用的渲染完成回调函数
function renderFinish() {
    isloading.value = false
}

// 暴露函数给父组件使用
</script>

<template>
    <div class="main_container">
        <!-- 经典引言装饰 -->
        <div class="quote-decoration relative">
            <div
                class="quote-text absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-800 text-amber-100 px-6 py-2 rounded-lg shadow-md text-center">
                <p class="text-sm md:text-base italic">"博学之，审问之，慎思之，明辨之，笃行之"</p>
                <p class="text-xs mt-1">——《礼记·中庸》</p>
            </div>
        </div>

        <div class="container mx-auto px-4 pt-8 pb-12 max-w-4xl">
            <!-- 对话卡片容器 -->
            <div class="chat-card rounded-xl shadow-md overflow-hidden border border-amber-200">
                <!-- 卡片装饰条 -->
                <div class="card-decoration"></div>

                <!-- 聊天消息区域 -->
                <div class="chat-container overflow-y-auto p-6 space-y-6" id="chatMessages">
                    <!-- 欢迎语区域 -->
                    <div v-if="iswelcome && lyricful_data.length === 0" class="welcome-area text-center py-8">
                        <div class="text-amber-800 mb-4">
                            <LucideBookOpen class="text-4xl mx-auto" />
                        </div>
                        <p class="typing-welcome mb-6">{{ typingText }}</p>
                        <!-- 示例问题 -->
                        <div class="example-questions mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                class="example-btn px-4 py-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors"
                                @click="sendExampleQuestion('《论语》中关于\'仁\'的核心思想是什么？')">
                                <LucideMessageSquare class="inline mr-2" width="16" height="16" />
                                《论语》中关于"仁"的核心思想是什么？
                            </button>
                            <button
                                class="example-btn px-4 py-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors"
                                @click="sendExampleQuestion('《道德经》的主要哲学观点有哪些？')">
                                <LucideMessageSquare class="inline mr-2" width="16" height="16" />
                                《道德经》的主要哲学观点有哪些？
                            </button>
                            <button
                                class="example-btn px-4 py-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors"
                                @click="sendExampleQuestion('儒家和道家思想的主要区别是什么？')">
                                <LucideMessageSquare class="inline mr-2" width="16" height="16" />
                                儒家和道家思想的主要区别是什么？
                            </button>
                            <button
                                class="example-btn px-4 py-2 text-left bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors"
                                @click="sendExampleQuestion('请解释\'天人合一\'的思想内涵。')">
                                <LucideMessageSquare class="inline mr-2" width="16" height="16" />
                                请解释"天人合一"的思想内涵。
                            </button>
                        </div>
                    </div>

                    <!-- 聊天内容 -->
                    <LyricfulResponse ref="lyricful" @loadingFinish="loadingFinished" @readFinished="readFinished"
                        :interop="interopPortalV2" @switchEditMode="onSwitchEditMode" />
                </div>

                <!-- 输入区域 -->
                <div class="border-t border-amber-200 p-4">
                    <form class="flex gap-3" id="messageForm">
                        <div class="flex-1 relative">
                            <ElInput :autosize="{ minRows: 1, maxRows: 4 }" v-model="inputText" type="textarea"
                                placeholder="请输入您关于国学经典的问题..."
                                class="input-focus w-full px-4 py-3 rounded-lg border border-amber-200/60 bg-amber-50/30 text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-300/40 focus:border-amber-400/60 transition-all duration-300 resize-none shadow-inner"
                                ref="elInput" />
                            <button type="button"
                                class="absolute right-3 top-3 text-amber-700/70 hover:text-amber-800 transition-all hover:scale-110 p-2 rounded-md hover:bg-amber-100/50 attachment-button"
                                title="上传附件">
                                <LucidePaperclip class="w-5 h-5" />
                            </button>
                        </div>
                        <button type="button"
                            class="px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-all transform hover:scale-105"
                            @click="onsend">
                            <MdiSendVariant v-if="!isRunning" />
                            <LineMdLoadingTwotoneLoop v-else />
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- 页脚 -->
        <footer class="text-center py-6 text-gray-600 text-sm border-t border-amber-200 bg-amber-50">
            <p class="mb-1">{{ baseinfo.baseLibrary }}大模型 · 智慧传承</p>
            <p class="text-xs opacity-80">数据仅供参考，如有学术研究需求，请查阅原典</p>
        </footer>
    </div>
</template>

<style scoped>
/* 主容器样式 */
.main_container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
}

/* 经典引言装饰 */
.quote-decoration {
    position: relative;
    height: 16px;
    margin-top: 40px;
}

/* 附件上传按钮优化 */
.attachment-button {
    transition: all 0.2s ease;
    border-radius: 50%;
}

.attachment-button:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
    background-color: rgba(254, 243, 199, 0.8);
}

.attachment-button:active {
    transform: scale(0.95);
}

/* 输入框自适应优化 */
.input-focus {
    resize: none;
    font-size: 14px;
    line-height: 1.5;
}

/* 引言文字样式 */
.quote-text {
    font-family: "SourceHanSansBold", "SimSun", serif;
    box-shadow: 0 4px 12px rgba(146, 64, 14, 0.15);
}

/* 对话卡片样式 */
.chat-card {
    background-color: #fff;
}

/* 卡片装饰条 */
.card-decoration {
    height: 4px;
    background: linear-gradient(90deg,
            rgba(217, 119, 6, 0) 0%,
            rgba(217, 119, 6, 0.7) 50%,
            rgba(217, 119, 6, 0) 100%);
}

/* 聊天容器样式 */
.chat-container {
    min-height: 600px;
    max-height: calc(100vh - 280px);
    font-family: "SourceHanSansBold";
}

/* 欢迎区域样式 */
.welcome-area {
    background-color: rgba(251, 191, 36, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(217, 119, 6, 0.1);
}

/* 欢迎区域标题样式 */
.welcome-area h2 {
    font-family: "SourceHanSansBold" 、;
    letter-spacing: 1px;
}

/* 打字效果文本 */
.typing-welcome {
    font-size: 14px;
    color: #8d6e63;
    font-style: italic;
    font-family: "SourceHanSansBold";
}

/* 示例问题按钮 */
.example-questions {
    max-width: 80%;
    margin: 0 auto;
}

/* 示例问题按钮样式 */
.example-btn {
    font-size: 13px;
    font-family: "SourceHanSansBold";
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.example-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(217, 119, 6, 0.1);
}

/* 输入区域样式 - 基本属性 */
.input-focus {
    font-family: "SourceHanSansBold";
    border-radius: 8px !important;
    transition: all 0.3s ease;
}

/* 输入区域样式 - 聚焦效果 */
.input-focus:focus {
    box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2) !important;
}

.input-focus:focus {
    box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2) !important;
}

/* 发送按钮样式 */
button[type="button"] {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button[type="button"]:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(146, 64, 14, 0.3);
}

button[type="button"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 页脚样式 */
footer {
    font-family: "SourceHanSansBold";
    margin-top: auto;
}

footer a {
    font-family: "SourceHanSansBold";
    text-decoration: none;
    transition: color 0.3s ease;
}

/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.welcome-area,
.example-btn,
.chat-card {
    animation: fadeIn 0.5s ease-out;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .quote-decoration {
        margin-top: 70px;
    }

    .quote-text p:first-child {
        font-size: 12px;
    }

    .quote-text p:last-child {
        font-size: 10px;
    }

    .container {
        padding: 0 12px;
    }

    .chat-container {
        padding: 16px !important;
    }

    .welcome-area {
        padding: 20px 16px !important;
    }

    .example-questions {
        max-width: 100%;
    }

    .input-focus {
        font-size: 14px;
    }
}
</style>