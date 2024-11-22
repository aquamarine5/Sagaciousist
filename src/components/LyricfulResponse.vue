<script setup>
import SpeechControllerV3 from '@/ttsv3';
import { ref } from 'vue';

var sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]
var lyricful_data = ref([
    {
        question: 'Question 1',
        answer: ref([
            { text: 'This is a ', status: 0 },
            { text: 'sentence', status: 0 },
            { text: ' for testing', status: 0 }
        ])
    },
    {
        question: 'Question 2',
        answer: ref([
            { text: 'This is a ', status: 0 },
            { text: 'sentence', status: 0 },
            { text: ' for testing', status: 0 }
        ])
    }
])

const speech = new SpeechControllerV3(lyricful_data)

/**
 * @param {import('vue').Ref} answerref
 * @param {string} text
 * @param {boolean} issplit
 */
function addSentence(answerref,text, issplit = false) {
    console.log(text)
    speech.addSentence(answerref,text, issplit)
}

/**
 * @param {string} questionstr 
 * @returns {import('vue').Ref}
 */
function createQAStructure(questionstr){
    let answerref=ref([])
    lyricful_data.value.push({question:questionstr,answer:answerref})
    return answerref
}

function clearAllLyrics() {
    lyricful_data.value = {}
    speech.ttsClear()
}

/**
 * 
 * @param {boolean} istts 
 */
function switchTTSStatus(istts) {
    speech.ttsSetStatus(istts)
}

defineExpose({
    createQAStructure,
    clearAllLyrics,
    addSentence,
    switchTTSStatus
})
</script>

<template>
    <div class="lyricful_container">
        <!-- eslint-disable-next-line vue/require-v-for-key, vue/no-unused-vars -->
        <div class="lyricful_qastructure" v-for="data in lyricful_data">
            <div class="lyricful_question">
                <div class="lyricful_question_text">{{ data.question }}</div>
            </div>
            <div class="lyricful_answer">
                <!-- eslint-disable-next-line vue/require-v-for-key, vue/no-unused-vars -->
                <div :class="'lyricful_sentence'" v-for="sentence in data.answer">
                    <!-- eslint-disable-next-line vue/require-v-for-key -->
                    <span :class="'lyricful_part ' + sentenceStatus[textpart.status]" v-for="textpart in sentence">
                        {{ textpart.text }}
                    </span>
                </div>
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

.lyricful_part {
    font-size: large;
}

.lyricful_container {
    padding-bottom: 15px;
    overflow-y: auto;
    overflow-x: hidden;
}

.lyricful_sentence {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
    margin-block: 6px;
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