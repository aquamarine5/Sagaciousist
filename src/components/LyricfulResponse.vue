<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import SpeechControllerV3 from '@/ttsv3';
import { nextTick, ref } from 'vue';
import { ContentLoader } from 'vue-content-loader';
import LucideSquareUserRound from '~icons/lucide/square-user-round?width=28px&height=28px';
import LucideBot from '~icons/lucide/bot?width=28px&height=28px';
import LucideThumbsUp from '~icons/lucide/thumbs-up?width=18px&height=18px';
import LucideThumbsDown from '~icons/lucide/thumbs-down?width=18px&height=18px';
import LucideRefreshCw from '~icons/lucide/refresh-cw?width=18px&height=18px';
import LucideEdit from '~icons/lucide/edit?width=18px&height=18px';

const sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]
const emit = defineEmits(['loadingFinish', "readFinished"])
const lyricful_data = ref([]);
const containerRef = ref(null)
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
    console.log(11)
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
        messageIndexes: null
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
        <div class="lyricful_qastructure" v-for="(data, index) in lyricful_data" :key="index">
            <div class="lyricful_question_container">
                <div class="lyricful_question">
                    {{ data.question }}
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
                    <div class="lyricful_loading" v-if="data.isloading">
                        <ContentLoader :width="50" :height="20" :speed="0.8" primaryColor="#eee" secondaryColor="#ccc">
                        </ContentLoader>
                    </div>
                    <div :class="'lyricful_sentence'" v-for="(sentence, aindex) in data.answer" v-else :key="aindex">
                        <span :class="'lyricful_part ' + sentenceStatus[textpart.status]"
                            v-for="(textpart, taindex) in sentence" :key="taindex">
                            {{ textpart.text }}
                        </span>
                    </div>
                    <div class="lyricful_buttons" v-if="data.isfinish">
                        <LucideThumbsUp class="lyricful_button" />
                        <LucideThumbsDown class="lyricful_button" />
                        <LucideRefreshCw class="lyricful_button" />
                        <LucideEdit class="lyricful_button" />
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

/* 隐藏滚动条箭头按钮 */
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