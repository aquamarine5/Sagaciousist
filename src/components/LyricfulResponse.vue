<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import SpeechControllerV3 from '@/ttsv3';
import { nextTick, ref, computed } from 'vue';
import { ContentLoader } from 'vue-content-loader';
import LucideSquareUserRound from '~icons/lucide/square-user-round?width=28px&height=28px';
import LucideBot from '~icons/lucide/bot?width=28px&height=28px';
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
const emit = defineEmits(['loadingFinish', "readFinished"])
const props = defineProps({
    interop: {
        type: InteropPortalV2
    }
})

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
 */
function addSentence(answerref, text, issplit = false) {
    console.log(text)
    if (text == "" || text == "\n" || text == " ") {
        speech.setSplitMark()
    } else {
        speech.addSentence(answerref, text, issplit)
    }
}
function checkTTSStatus() {
    speech.ttsCheckStatus()
}
/**
 * @param {string} questionstr 
 * @returns {QAStructure}
 */
function createQAStructure(questionstr) {
    let answerref = ref([[]])
    let isloadingref = ref(true)
    let index = lyricful_data.value.push({
        question: questionstr,
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
    console.log(qastructure)
    for await (const part of response) {
        let content = part.response
        allResponse += content
        for (let index = 0; index < content.length; index++) {
            const char = content[index];
            if (char == '\n') {
                addSentence(qastructure.answer, lastSentence, true)
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
                addSentence(qastructure.answer, lastSentence, false)
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
    console.log(qastructure)

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

}

defineExpose({
    checkTTSStatus,
    ttsEndMark,
    createQAStructure,
    clearAllLyrics,
    addSentence,
    switchTTSStatus
})
</script>

<template>
    <div class="lyricful_container" ref="containerRef">
        <div class="lyricful_qastructure" v-for="(qastructure, index) in lyricful_data" :key="index">
            <div class="lyricful_question_container">
                <div class="lyricful_question">
                    {{ qastructure.question }}
                </div>
                <div class="lyricful_question_icon">
                    <LucideSquareUserRound />
                </div>
            </div>
            <div class="lyricful_answer_container">
                <div class="lyricful_answer_icon">
                    <LucideBot />
                </div>
                <div class="lyricful_answer">
                    <div class="lyricful_loading" v-if="qastructure.isloading">
                        <ContentLoader :width="50" :height="20" :speed="0.8" primaryColor="#eee" secondaryColor="#ccc">
                        </ContentLoader>
                    </div>
                    <div v-else>
                        <div class="lyricful_sentence" v-for="(sentence, aindex) in filteredAnswers[index]"
                            :key="aindex">
                            <span :class="'lyricful_part ' + sentenceStatus[textpart.status]"
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
                            <LucideClipboardCopy class="lyricful_button_nofill" v-else key="copy"
                                @click="buttonClipboard(qastructure)" />
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
@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

.fade-leave-to {
    opacity: 0;
    transform: scale(1.2);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: scale(1);
}

.lyricful_button_nofill {
    cursor: pointer;
}

:deep(.lyricful_button_filled path) {
    fill: #888;
    transition: fill .2s ease-in-out;
}

:deep(.lyricful_button path) {
    fill: transparent;
    transition: fill .2s ease-in-out;
}

:deep(.lyricful_button:hover path) {
    fill: #b1b1b1;
    transition: fill .2s ease-in-out;
}

.lyricful_question_container {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.lyricful_answer_container {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8px;
}

.lyricful_button {
    cursor: pointer;
}

.lyricful_button_filled {
    cursor: pointer;
}

.lyricful_buttons {
    padding: 5px 3px;
    color: #333;
    display: flex;
    gap: 6px;
    animation: fadeIn .3s ease-in-out;
}

.lyricful_answer_icon {
    padding-right: 6px;
    padding-top: 3px;
}

.lyricful_question_icon {
    padding-left: 6px;
    padding-top: 1px;
}

.lyricful_loading {
    display: flex;
    align-items: center;
}

.lyricful_qastructure {
    margin-block: 6px;
    display: flex;
    flex-direction: column;
}

.lyricful_answer {
    margin-right: 32px;
    padding: 8px 13px;
    border-radius: 20px;
    width: fit-content;
    border-color: transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-image: linear-gradient(to right, #fff, #fff), linear-gradient(315deg, #04d4fd, #0989f4, #284fab);
    border-style: solid;
    border-width: 3px;
}

.lyricful_question {
    margin-left: 32px;
    width: fit-content;
    padding: 6px 13px;
    text-align: right;
    min-width: 10px;
    border-style: solid;
    border-color: #888;
    border-width: 2px;
    border-radius: 18px;
    background-color: #fff;
}

.lyricful_part {
    font-size: medium;
}

.lyricful_container::-webkit-scrollbar-button {
    display: none;
}

.lyricful_container {
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
    padding-right: 0.8px;
    overflow-y: overlay;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    scroll-behavior: smooth;
    scrollbar-color: #888 transparent;
}

.lyricful_container::-webkit-scrollbar {
    width: 8px;
}

.lyricful_container::-webkit-scrollbar-track {
    background: transparent;
}

.lyricful_container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.lyricful_container::-webkit-scrollbar-button:vertical:start:decrement,
.lyricful_container::-webkit-scrollbar-button:vertical:end:increment {
    display: none;
}

.lyricful_sentence {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
}

.lyricful_reading {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
    font-family: "SourceHanSansBold";
    color: #000;
}

.lyricful_after_read {

    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
    font-weight: 500;
    color: #000;
}

.lyricful_before_read {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
    display: none;
    font-weight: 500;
    color: rgb(130, 130, 130);
}
</style>