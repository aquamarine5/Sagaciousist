<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import { ElButton, ElInput, ElNotification } from 'element-plus';
import { Ollama } from 'ollama/src/browser';
import ModelColumn from './ModelColumn.vue';
import { ref } from 'vue';
import MdiSendVariant from '~icons/mdi/send-variant?width=1.5em&height=1.5em';
import LineMdLoadingTwotoneLoop from '~icons/line-md/loading-twotone-loop?width=1.8em&height=1.8em';
import LucideCircleCheckBig from '~icons/lucide/circle-check-big?width=1.5em&height=1.5em';
import LyricfulResponse from './LyricfulResponse.vue';
import QuestionsTipDisplayer from './QuestionsTipDisplayer.vue';
import { InteropPortalV2 } from '@/interopv2';
import baseinfo from '@/baseinfo';
// import SelectorDisplayer from './SelectorDisplayer.vue';

let nowtime = new Date().getHours()
var text = ""
if (0 <= nowtime && nowtime < 4)
    text = "深夜啦😉"
else if (4 <= nowtime && nowtime <= 11)
    text = "早上好😉"
else if (12 <= nowtime && nowtime <= 17)
    text = "下午好😉"
else if (18 <= nowtime && nowtime <= 24)
    text = "晚上好😉"
const iswelcomecn = Math.round(Math.random()) == 1
const finalText = iswelcomecn ? text : "Hello!😙"

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
</script>

<template>
    <div class="main_container">
        <ModelColumn />
        <div class="app_container">
            <div class="result_container">
                <LyricfulResponse ref="lyricful" @loadingFinish="loadingFinished" @readFinished="readFinished"
                    :interop="interopPortalV2" @switchEditMode="onSwitchEditMode" />
            </div>
            <!-- <div class="selector_result" v-if="!isselecting && iswelcome">
                <div class="selector_leftpart" @click="reselectMode">
                    <LineMdArrowSmallLeft class="selector_result_icon" />
                    重新选择
                </div>
                <div class="selector_rightpart">
                    <LineMdTextBoxMultipleTwotone class="selector_result_icon" v-if="model === 'book'" />
                    <LineMdFileSearchTwotone class="selector_result_icon" v-else-if="model === 'history'" />
                    <span class="selector_result_icon" v-else></span>
                    {{ model === 'book' ? '书籍相关提问模式' : model === 'history' ? '历史事件提问模式' : "?" }}
                </div>
            </div> -->

            <!-- <SelectorDisplayer v-if="isselecting" @modeSelected="handleModeSelected" /> -->
            <div class="center_container">
                <div class="center_tips">
                    <div :class="iswelcomecn ? 'welcome_tips_cn' : 'welcome_tips'" v-if="false">
                        {{ typingText }}
                    </div>
                    <QuestionsTipDisplayer class="question_tips" v-if="iswelcome" @askQuestion="handleAskQuestion" />
                </div>
                <div class="input_container">
                    <ElInput :autosize="{ minRows: 1, maxRows: 6 }" v-model="inputText" type="textarea"
                        placeholder="向我提出一个问题吧" class="input_el" ref="elInput" />
                    <div :class="!isRunning ? 'container_btn_send' : 'container_btn_send btn_send_gradient'">
                        <ElButton v-wave :type="'primary'" @click="onsend" circle>
                            <LucideCircleCheckBig v-if="isediting" />
                            <MdiSendVariant v-else-if="!isRunning" />
                            <LineMdLoadingTwotoneLoop v-else />
                        </ElButton>
                    </div>
                </div>
            </div>

            <div class="tips_ai">
                {{ baseinfo.baseLibrary }}人工智能也会出错，请检查重要信息。
            </div>
        </div>
    </div>
</template>

<script>
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
const interopPortalV2 = new InteropPortalV2(ollama, "http://localhost:8080")
export default {
    components: {
        LyricfulResponse
    },
    methods: {
        async handleAskQuestion(question) {
            this.inputText = question;
            await this.onsend()
        },
        readFinished() {
            isRunning.value = false
        },
        loadingFinished() {
            isloading.value = false
        },
        /**
         * @param {QAStructure} qastructure
         */
        onSwitchEditMode(qastructure) {
            isediting.value = true
            this.inputText = qastructure.question
            editingQAStructure = qastructure
        },
        async onsend() {
            /**
             * @type {LyricfulResponse}
             */
            let lyricfulRef = this.$refs.lyricful
            if (this.inputText == '') {
                ElNotification({
                    type: 'warning',
                    title: "内容不能为空！",
                    message: "内容不能为空！",
                })
                return
            }
            if (isediting.value) {
                isediting.value = false
                editingQAStructure.question = this.inputText
                lyricfulRef.regenerateResponse(editingQAStructure)
                return
            }
            if (isRunning.value) {
                lyricfulRef.ttsStop()
                isRunning.value = false
                return
            }
            iswelcome.value = false
            isloading.value = true
            isRunning.value = true
            responseStatus = true
            lyricfulRef.clearAllLyrics()
            speechSynthesis.cancel()
            //const seg = new Intl.Segmenter("zh", { granularity: "sentence" })
            setTimeout(function () {
                if (responseStatus) {
                    showPendingTips.value = true
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
                const response = await interopPortalV2.generateChatRequest(itext)
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
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, false, thinkingValue)
                            console.log("issplit: true")
                            lastSentence = ''
                        }
                        lastSentence += char
                        if (!isRunning.value) {
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, false, thinkingValue)
                            break
                        }
                        if ((char == '.' || char == ':') && /[0-9]/.test(lastSentence[lastSentence.length - 2])) {
                            continue
                        }
                        if (char == '.' && lastSentence[lastSentence.length - 2] == ".")
                            continue
                        if (splitPatterns.indexOf(char) != -1) {
                            lyricfulRef.addSentence(qastruct.answer, lastSentence, false, thinkingValue)
                            lastSentence = ''
                        }
                    }
                    if (!isRunning.value) {
                        break
                    }
                }
                console.log("last content: " + lastSentence)
                if (lyricfulRef.ttsEndMark()) {
                    isRunning.value = false
                }
                let messageIndex = interopPortalV2.storageMessage(itext, allResponse)
                console.log(messageIndex)
                qastruct.messageIndexes = messageIndex
            }
            setTimeout(function () {
                responseStatus = false
                showPendingTips.value = false
            }, 100)
        }
    },
    data() {
        return {
            inputText: ref(''),
            renderFinish: () => {
                isloading.value = false
            },
            lyricfulResponse: undefined
        }
    }
}
</script>
<style scoped>
@keyframes textarea_focusIn {
    0% {
        background-position: 0% 50%;
        border-width: 3px;
    }

    100% {
        background-position: 90% 50%;
        border-width: 5px;
    }
}

@keyframes textarea_focusOut {
    0% {
        background-position: 90% 50%;
        border-width: 5px;
    }

    100% {
        background-position: 0% 50%;
        border-width: 3px;
    }
}

@keyframes animation_loading {
    0% {
        background-position: 0% 0%;
    }

    25% {
        background-position: 33% 66%;
    }

    50% {
        background-position: 100% 100%;
    }

    75% {
        background-position: 66% 33%;
    }

    100% {
        background-position: 0% 0%;
    }
}

:deep(.el-button) {
    width: 40px;
    height: 40px;
    border-color: transparent;
}

:deep(.btn_send_gradient .el-button) {
    animation: animation_loading 5s;
    animation-iteration-count: infinite;
    animation-direction: normal;
    animation-fill-mode: forwards;
    background-size: 300%;
    background-position: 0% 0%;
    background-image: linear-gradient(to right, #8c6b4f 0%, #a08c7d 50%, #8c6b4f 100%);

}

:deep(.el-textarea__inner) {
    overflow: auto;
    overflow-x: hidden;
    scrollbar-color: #888 transparent;
    scrollbar-gutter: stable;
    scroll-behavior: smooth;
    resize: none;
    font-size: 16px;
    padding: 9px 11px;
    animation-fill-mode: forwards;
    animation: textarea_focusOut .3s cubic-bezier(0.85, 0.01, 0.58, 1);
    border: 3px solid transparent;
    border-radius: 24px;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-size: 200%;
    background-position: 0% 50%;
    background-image: linear-gradient(to right, #fff, #fff), linear-gradient(135deg, #a1887f 0%, #d7ccc8 50%, #a1887f 100%);
}

:deep(.is-focus) {
    animation: textarea_focusIn .3s cubic-bezier(0.85, 0.01, 0.58, 1);
    animation-fill-mode: forwards;
}

:deep(.input_el_focusOut) {
    animation-fill-mode: forwards;
    animation: textarea_focusOut .5s ease-in-out;
}
</style>
<style scoped>
.tips_ai {
    color: gray;
    font-size: small;
    text-align: center;
    padding-top: 2px;
}

.selector_result_icon {
    padding-right: 4px;
}

.selector_result {
    display: flex;
    padding-bottom: 8px;
}

.result_container {
    max-height: 80vh;
    margin-bottom: 5px;
}

.center_container {
    display: flex;
    justify-content: center;
    flex-direction: column;
}

.center_tips {
    flex: 1;
    display: flex;
    align-items: center;
    /* justify-content: flex-end; */
    flex-direction: column;
}

.selector_leftpart {
    border-radius: 6px 0px 0px 6px;
    border-color: gray;
    border-width: 2px;
    border-style: solid;
    padding: 3px;
    display: flex;
    align-items: center;
    font-size: 12px;
    cursor: pointer;
}

.selector_rightpart {
    border-radius: 0px 6px 6px 0px;
    border-color: gray;
    border-width: 2px 2px 2px 0px;
    border-style: solid;
    padding: 3px;
    display: flex;
    align-items: center;
    font-size: 12px;
}

.welcome_tips_cn {
    align-items: center;
    display: flex;
    white-space: nowrap;
    justify-content: center;
    font-size: 30px;
    align-self: center;
    font-family: "SourceHanSansRegular";
}

.welcome_tips {
    align-items: center;
    display: flex;
    white-space: nowrap;
    font-family: "SourceHanSansRegular";
    font-size: 30px;
    justify-content: center;
    align-self: center;
}

.container_btn_send {
    margin-left: 12px;
    justify-self: end;
}

.input_container {
    display: flex;
    margin-top: auto;
    align-items: center;
}

.app_container {
    width: 100%;
    display: flex;
    padding: 10px;
    transition: justify-content 0.3s ease;
    flex-direction: column;
    justify-content: center;
    margin: 0 auto;
    max-width: 1000px;
}

.main_container {
    height: 87vh;
    display: flex;
    width: 100%;
    justify-content: center;
    transition: justify-content 0.3s ease;
}

code {
    font-style: oblique 2deg;
    font-size: large;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.result_pending {
    color: gray;
    font-size: small;
    padding-block: 3px;
}

.result_tips {
    align-items: center;
    display: flex;
    color: gray;
    font-weight: 400;
    font-size: small;
}

.btn_send {
    margin-top: 1px;
    margin-left: 12px;
    justify-self: end;
    transition: background-color .2s ease-in-out;
}
</style>