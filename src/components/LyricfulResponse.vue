<script setup>
import { marked } from 'marked';
import { ref } from 'vue';

var sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]

var lastTimeout = new Date().getTime()
var isTTSEnabled = true
var lyricCurrectIndex = 0
var isTTSServiceWorking = false

var lyricful_data = ref([])
var pending_ttslist = []
var pending_addSentenceList = []
const ADD_SENTENCE_DURATION = 700

function builtinAddSentence() {
    lyricful_data.value.push(pending_addSentenceList[0])
    pending_ttslist.push(pending_addSentenceList[0])
    if (pending_addSentenceList[0].istts) {
        if (!isTTSServiceWorking) {
            ttsStart()
        }
    }
    lastTimeout = new Date().getTime()
    pending_addSentenceList.shift()
    if (pending_addSentenceList.length > 0)
        setTimeout(builtinAddSentence, ADD_SENTENCE_DURATION)
}

function addSentence(text, tts = true) {
    console.log(text)
    let lyricSentence = {
        content: text,
        index: lyricCurrectIndex,
        status: ref(isTTSEnabled ? 0 : 2),
        istts: tts
    }
    lyricCurrectIndex += 1
    var ct = new Date().getTime()
    if (ct - lastTimeout <= ADD_SENTENCE_DURATION) {
        pending_addSentenceList.push(lyricSentence)
        console.log(1)
        if(pending_addSentenceList.length<=1)
            setTimeout(builtinAddSentence, ct - lastTimeout)
    } else {
        if (pending_addSentenceList.length != 0) {
            pending_addSentenceList.push(lyricSentence)
            console.log(2)
            if(pending_addSentenceList.length<=1)
                setTimeout(builtinAddSentence, ADD_SENTENCE_DURATION)
        } else {
            lyricful_data.value.push(lyricSentence)
            pending_ttslist.push(lyricSentence)
            if (tts) {
                if (!isTTSServiceWorking) {
                    ttsStart()
                }
            }
            lastTimeout = new Date().getTime()
        }
    }
    return lyricCurrectIndex - 1
}
function ttsStart() {
    isTTSServiceWorking = true
    ttsSpeak(pending_ttslist[0])
}
function ttsSpeak(speechData) {
    let speechUtterance = new SpeechSynthesisUtterance(speechData.content)
    speechData.status.value = 1
    speechUtterance.onend = event => {
        pending_ttslist.shift()
        speechData.status.value = 2
        if (pending_ttslist.length == 0) {
            isTTSServiceWorking = false
            console.log("OK")
        }
        else {
            ttsSpeak(pending_ttslist[0])
        }
    }
    speechUtterance.rate = 1.5
    speechSynthesis.speak(speechUtterance)
}
function ttsStop() {
    speechSynthesis.cancel()
    pending_ttslist = []
    isTTSServiceWorking = false
    for (let index = 0; index < lyricful_data.value.length; index++) {
        lyricful_data.value[index].status = 2;
    }
}
function clearAllLyrics() {
    speechSynthesis.cancel()
    lyricful_data.value = []
    pending_ttslist = []
    isTTSServiceWorking = false
}
defineExpose({
    ttsSpeak,
    ttsStop,
    ttsStart,
    addSentence,
    clearAllLyrics
})
</script>

<template>
    <div class="lyricful_container">
        <div :class="'lyricful_sentence ' + sentenceStatus[sentence.status]" v-for="sentence in lyricful_data"
            :id="sentence.index">
            <div v-html="marked(sentence.content)">
            </div>
        </div>
    </div>
</template>

<style>
@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.lyricful_container {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 5px;
}

.lyricful_sentence {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
}

.lyricful_reading {
    font-weight: 600;
    color: #000;

}

.lyricful_after_read {
    font-weight: 500;
    color: #000;
}

.lyricful_before_read {
    font-weight: 500;
    color: rgb(130, 130, 130);
}
</style>