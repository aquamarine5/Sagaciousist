<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import SpeechControllerV3 from '@/ttsv3';
import { nextTick, ref, computed } from 'vue';
import { ContentLoader } from 'vue-content-loader';
import LucideUser from '~icons/lucide/user?width=28px&height=28px';
import LucideScroll from '~icons/lucide/scroll?width=28px&height=28px';
import LucideThumbsUp from '~icons/lucide/thumbs-up?width=18px&height=18px';
import LucideThumbsDown from '~icons/lucide/thumbs-down?width=18px&height=18px';
import LucideRefreshCw from '~icons/lucide/refresh-cw?width=18px&height=18px';
import LucideEdit from '~icons/lucide/edit?width=18px&height=18px';
import LucideClipboardCopy from '~icons/lucide/clipboard-copy?width=18px&height=18px';
import LucideClipboardCheck from '~icons/lucide/clipboard-check?width=18px&height=18px';
import { InteropPortalV2 } from '@/interopv2';
import { ElMessageBox } from 'element-plus';
const sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]
const thinkingStatus = [
    '',
    'lyricful_thinking_mark_start',
    'lyricful_thinking_part',
    'lyricful_thinking_mark_end'
]
const emit = defineEmits(['loadingFinish', "readFinished", "switchEditMode"])
const props = defineProps({
    interop: {
        type: InteropPortalV2
    }
})

const isThinking = ref(false)
const thinkingText = ref("")

/**
 * @type {import('vue').Ref<QAStructure[]>}
 */
const lyricful_data = ref([]);
const containerRef = ref(null)
const filteredAnswers = computed(() => {
    return lyricful_data.value.map(qastructure => {
        return qastructure.answer.filter(sentence => sentence.length > 0)
    })
})
const speech = new SpeechControllerV3(() => {
    nextTick(() => {
        const container = containerRef.value
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            })
        }
        else {
            console.warn('container is null')
        }
    })
})
speech.readFinishCallback = () => {
    emit('readFinished')
    if (lyricful_data.value && lyricful_data.value.length > 0) {
        lyricful_data.value[lyricful_data.value.length - 1].isfinish = true
    }
}
speech.bindShowCallback(() => {
    emit('loadingFinish')
    if (lyricful_data.value && lyricful_data.value.length > 0) {
        lyricful_data.value[lyricful_data.value.length - 1].isloading = false
    }
})
/**
 * @param {import('vue').Ref} answerref
 * @param {string} text
 * @param {boolean} issplit
 * @param {number} thinkingValue 
 */
function addSentence(answerref, text, issplit = false, thinkingValue) {
    console.log(text)
    if (text == "" || text == "\n" || text == " ") {
        speech.setSplitMark()
    } else {
        speech.addSentence(answerref, text, issplit, thinkingValue)
    }
}

function addThinking(text) {
    thinkingText.value += text
    nextTick(() => {
        const containers = document.querySelectorAll('.thinking_container')
        containers.forEach(c => {
            c.scrollTop = c.scrollHeight
        })
    })
}
function checkTTSStatus() {
    speech.ttsCheckStatus()
}
/**
 * @param {string} questionstr 
 * @returns {QAStructure}
 */
function createQAStructure(questionstr) {
    let questionRef = ref(questionstr)
    let answerref = ref([[]])
    let isloadingref = ref(true)
    let index = lyricful_data.value.push({
        question: questionRef,
        answer: answerref,
        isloading: isloadingref,
        isfinish: false,
        messageIndexes: null,
        btnclicked: [false, false, false, false, false]
    })
    speech.scrollFunction()
    return lyricful_data.value[index - 1]
}

function clearAllLyrics() {
    //lyricful_data.value = {}
    speech.ttsClear()
}

/**
 * 
 * @param {boolean} istts 
 */
function switchTTSStatus(istts) {
    speech.ttsSetStatus(istts)
}

/**
 * @returns {boolean}
 */
function ttsEndMark() {
    return speech.ttsEndMark()
}

/**
 * @param {QAStructure} qastructure 
 * @returns {Promise<void>}
 */
async function regenerateResponse(qastructure) {
    console.log(qastructure)
    props.interop.forgiveMessage(qastructure.messageIndexes)
    speech.ttsClear()
    const splitPatterns = ['。', "！", "？", "，", "：", "；"]
    qastructure.isloading = true
    qastructure.isfinish = false
    let answerRef = ref([[]])
    qastructure.answer = answerRef.value
    qastructure.btnclicked = [false, false, false, false, false]
    qastructure.messageIndexes = null
    speech.scrollFunction()
    const response = await props.interop.generateGenerateRequest(qastructure.question)
    var lastSentence = ''
    var allResponse = ''
    var isThinking = false
    console.log(qastructure)
    for await (const part of response) {
        let content = part.response
        console.log(part)
        allResponse += content
        for (let index = 0; index < content.length; index++) {
            const char = content[index];
            if (char == '\n') {
                addSentence(qastructure.answer, lastSentence, false)
                console.log("issplit: true")
                lastSentence = ''
            }
            lastSentence += char
            if ((char == '.' || char == ':') && /[0-9]/.test(lastSentence[lastSentence.length - 2])) {
                continue
            }
            if (char == '.' && lastSentence[lastSentence.length - 2] == ".")
                continue
            if (splitPatterns.indexOf(char) != -1) {
                addSentence(qastructure.answer, lastSentence, false, thinkingValue)
                lastSentence = ''
            }
        }
    }
    console.log("last content: " + lastSentence)
    ttsEndMark()
    let messageIndex = props.interop.storageMessage(qastructure.question, allResponse)
    qastructure.messageIndexes = messageIndex
}

/**
 * @param {QAStructure} qastructure 
 */
function buttonClipboard(qastructure) {
    const text = qastructure.answer.flat().map(part => part.text).join('')
    navigator.clipboard.writeText(text).then(() => {
        qastructure.btnclicked[4] = true
        setTimeout(() => {
            qastructure.btnclicked[4] = false
        }, 2000)
    }).catch(err => {
        ElMessageBox.alert({
            title: 'Error',
            message: 'Failed to copy text to clipboard, ' + err.message,
            type: 'error'
        })
    })
}

/**
 * @param {QAStructure} qastructure 
 */
function buttonThumbUp(qastructure) {
    qastructure.btnclicked[0] = true
}

/**
 * @param {QAStructure} qastructure 
 */
function buttonThumbDown(qastructure) {
    qastructure.btnclicked[1] = true
    props.interop.forgiveMessage(qastructure.messageIndexes)
}

/**
 * @param {QAStructure} qastructure 
 */
function buttonRefresh(qastructure) {
    regenerateResponse(qastructure).then(() => {
        console.log("refreshed generated response")
    })
}

/**
 * @param {QAStructure} qastructure 
 */
function buttonEdit(qastructure) {
    qastructure.btnclicked[3] = true
    emit('switchEditMode', qastructure)

}

defineExpose({
    checkTTSStatus,
    ttsEndMark,
    createQAStructure,
    clearAllLyrics,
    addSentence,
    addThinking,
    switchTTSStatus,
    regenerateResponse
})
</script>

<template>
    <div class="lyricful_container" ref="containerRef">
        <!-- 欢迎消息 -->
        <div class="flex items-start" v-if="lyricful_data.length === 0">
            <div class="flex-shrink-0 bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <LucideScroll />
            </div>
            <div class="message-card bg-amber-50 rounded-xl px-4 py-3 max-w-[80%]">
                <p class="text-amber-900">你好，有什么可以帮你的吗？</p>
            </div>
        </div>

        <!-- 对话内容 -->
        <div v-for="(qastructure, index) in lyricful_data" :key="index">
            <!-- 用户消息 -->
            <div class="flex items-start justify-end mb-4">
                <div class="message-card bg-blue-50 rounded-xl px-4 py-3 max-w-[80%]">
                    <p class="text-blue-900">{{ qastructure.question }}</p>
                </div>
                <div class="flex-shrink-0 bg-blue-50 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center ml-3">
                    <LucideUser />
                </div>
            </div>

            <!-- AI回答 -->
            <div class="flex items-start mb-4">
                <div class="flex-shrink-0 bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                    <LucideScroll />
                </div>
                <div class="lyricful_answer">
                    <div class="thinking_wrapper" v-if="qastructure.isloading && thinkingText">
                        <div class="thinking_title">正在思考中</div>
                        <div class="thinking_container">
                            {{ thinkingText }}
                        </div>
                    </div>
                    <div class="lyricful_loading" v-if="qastructure.isloading">
                        <ContentLoader :width="50" :height="20" :speed="0.8" primaryColor="#eee" secondaryColor="#ccc">
                        </ContentLoader>
                    </div>
                    <div v-else>
                        <div v-for="(sentence, aindex) in filteredAnswers[index]" :key="aindex">
                            <span
                                :class="thinkingStatus[textpart.thinkingValue] + ' lyricful_part ' + sentenceStatus[textpart.status]"
                                v-for="(textpart, taindex) in sentence" :key="taindex">
                                {{ textpart.text }}
                            </span>
                        </div>
                    </div>
                    <div class="lyricful_buttons" v-if="qastructure.isfinish">
                        <LucideThumbsUp
                            :class="qastructure.btnclicked[0] ? ' lyricful_button_filled' : 'lyricful_button'"
                            @click="buttonThumbUp(qastructure)" />
                        <LucideThumbsDown
                            :class="qastructure.btnclicked[1] ? ' lyricful_button_filled' : 'lyricful_button'"
                            @click="buttonThumbDown(qastructure)" />
                        <LucideRefreshCw class="lyricful_button_nofill" @click="buttonRefresh(qastructure)" />
                        <Transition name="fade" mode="out-in">
                            <LucideClipboardCheck class="lyricful_button_nofill" v-if="qastructure.btnclicked[4]"
                                @click="buttonClipboard(qastructure)" key="check" />
                            <LucideClipboardCopy
                                :class="qastructure.btnclicked[3] ? ' lyricful_button_filled' : 'lyricful_button'"
                                v-else key="copy" @click="buttonClipboard(qastructure)" />
                        </Transition>
                        <LucideEdit :class="qastructure.btnclicked[3] ? ' lyricful_button_filled' : 'lyricful_button'"
                            @click="buttonEdit(qastructure)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 全局样式重置与字体设置 */
* {
    font-family: "SourceHanSansBold", "SourceHanSansRegular", "SimSun", serif;
}

/* 动画效果 */
@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(8px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-5px);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: scale(0.95);
}

.fade-leave-to {
    opacity: 0;
    transform: scale(1.05);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: scale(1);
}

/* 消息容器样式 */
.lyricful_container {
    max-height: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: overlay;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    scroll-behavior: smooth;
    scrollbar-color: rgba(217, 119, 6, 0.5) transparent;
}

.lyricful_container::-webkit-scrollbar {
    width: 6px;
}

.lyricful_container::-webkit-scrollbar-track {
    background: rgba(251, 191, 36, 0.1);
    border-radius: 3px;
}

.lyricful_container::-webkit-scrollbar-thumb {
    background: rgba(217, 119, 6, 0.5);
    border-radius: 3px;
}

.lyricful_container::-webkit-scrollbar-thumb:hover {
    background: rgba(217, 119, 6, 0.7);
}

/* 打字动画效果 */
.typing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #fefce8;
    border: 1px solid rgba(251, 191, 36, 0.2);
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.typing-indicator span {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #d97706;
    animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
}

/* 按钮样式 */
.lyricful_button_nofill,
.lyricful_button,
.lyricful_button_filled {
    cursor: pointer;
    transition: transform 0.2s ease;
}

.lyricful_button_nofill:hover,
.lyricful_button:hover,
.lyricful_button_filled:hover {
    transform: scale(1.1);
}

.lyricful_answer_icon {
    padding-right: 6px;
    padding-top: 4px;
}

.lyricful_question_icon {
    padding-left: 6px;
    padding-top: 2px;
}

.thinking_wrapper {
    margin-bottom: 8px;
    background-color: #f7f7f8;
    border-radius: 8px;
    padding: 8px 12px;
}

.thinking_title {
    font-size: 15px;
    color: #0989f4;
    margin-bottom: 6px;
    font-weight: bold;
}

.thinking_container {
    white-space: pre-wrap;
    max-height: 80px;
    overflow-y: hidden;
    font-size: 14px;
    color: #666;
    mask-image: linear-gradient(to bottom, transparent 0%, black 40%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 40%);
}

:deep(.lyricful_button:hover path) {
    fill: rgba(146, 64, 14, 0.1);
    stroke: #92400e;
    transition: fill 0.2s ease-in-out, stroke 0.2s ease-in-out;
}

/* 消息按钮组 */
.lyricful_buttons {
    padding: 8px 5px;
    display: flex;
    gap: 10px;
    animation: fadeIn 0.3s ease-in-out;
}

/* 消息卡片样式 */
.message-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    position: relative;
}

.message-card:hover {
    box-shadow: 0 4px 16px rgba(146, 64, 14, 0.1);
}

/* 用户消息样式 */
.flex.justify-end .message-card {
    background-color: #f0f9ff;
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 16px;
}

/* AI消息样式 */
.flex.items-start:not(.justify-end) .message-card {
    background-color: #fefce8;
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 16px;
}

/* 头像样式 */
.flex-shrink-0 {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    border: 1px solid rgba(217, 119, 6, 0.2);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
}

/* AI头像特殊样式 */
.flex-shrink-0.bg-amber-100 {
    background-color: #fffbeb !important;
    border-color: rgba(251, 191, 36, 0.3);
}

.flex-shrink-0.bg-blue-50 {
    background-color: #f0f9ff !important;
    border-color: rgba(37, 99, 235, 0.2);
}

/* 用户头像装饰效果 */
.flex-shrink-0.bg-blue-50::before {
    background-color: #dbeafe;
    border-color: #f0f9ff;
}

/* 头像装饰效果 */
.flex-shrink-0::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #fef3c7;
    border-radius: 50%;
    top: -2px;
    right: -2px;
    border: 2px solid #fff;
}

/* 消息内容样式 */
.lyricful_part {
    font-size: medium;
    color: #4a4a4a;
}

.lyricful_sentence {
    animation: fadeIn 0.3s ease-in-out;
    transition: color 0.4s ease-in-out;
}

.lyricful_reading {
    animation: fadeIn 0.3s ease-in-out;
    transition: color 0.4s ease-in-out;
    font-family: "SourceHanSansRegular", "SimSun", serif;
    color: #78350f;
    font-weight: 500;
}

.lyricful_after_read {
    animation: fadeIn 0.3s ease-in-out;
    transition: color 0.4s ease-in-out;
    font-weight: 500;
    color: #4a4a4a;
}

.lyricful_before_read {
    animation: fadeIn 0.3s ease-in-out;
    transition: color 0.4s ease-in-out;
    display: none;
    font-weight: 500;
    color: rgb(130, 130, 130);
}

/* 思考状态样式 */
.lyricful_thinking_mark_start {
    padding-block: 12px;
    color: #92400e;
    font-size: larger;
    font-weight: 700;
}

.lyricful_thinking_part {
    color: #92400e;
    font-size: small;
    font-style: italic;
}

.lyricful_thinking_mark_end {
    padding-block: 12px;
    color: #92400e;
    font-size: larger;
    font-weight: 700;
}

/* 文本样式 */
.text-gray-800 {
    color: #4a4a4a !important;
    font-family: "SourceHanSansBold", "SourceHanSansRegular", "SimSun", serif !important;
}

.text-amber-900 {
    color: #78350f !important;
    font-family: "SourceHanSansBold", "SourceHanSansRegular", "SimSun", serif !important;
}

.text-blue-900 {
    color: #1e40af !important;
    font-family: "SourceHanSansBold", "SourceHanSansRegular", "SimSun", serif !important;
}

/* 对话间距调整 */
.flex.items-start {
    margin-bottom: 16px;
}

/* 消息内引用样式 */
.message-card blockquote {
    border-left: 3px solid #d97706;
    padding-left: 12px;
    margin: 12px 0;
    font-style: italic;
    color: #92400e;
}

/* 欢迎消息样式 */
.flex.items-start:first-child .message-card {
    background-color: rgba(251, 191, 36, 0.05);
    border: 1px solid rgba(217, 119, 6, 0.1);
    padding: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .lyricful_container {
        padding: 0 8px;
    }
    
    .message-card {
        padding: 12px 14px !important;
        max-width: 85% !important;
    }
    
    .flex-shrink-0 {
        width: 32px;
        height: 32px;
        margin: 0 6px !important;
    }
    
    .typing-indicator {
        padding: 10px 14px;
    }
    
    .typing-indicator span {
        width: 6px;
        height: 6px;
    }
    
    .lyricful_buttons {
        gap: 8px;
        padding: 6px 3px;
    }
    
    .lyricful_buttons svg {
        width: 16px !important;
        height: 16px !important;
    }
}
</style>