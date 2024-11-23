<script setup>
import SpeechControllerV3 from '@/ttsv3';
import { ref } from 'vue';
import { ContentLoader } from 'vue-content-loader';

var sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]
const lyricful_data = ref([]);

const speech = new SpeechControllerV3(lyricful_data)

/**
 * @param {import('vue').Ref} answerref
 * @param {string} text
 * @param {boolean} issplit
 */
function addSentence(answerref, text, issplit = false) {
    console.log(text)
    speech.addSentence(answerref, text, issplit)
}

/**
 * @param {string} questionstr 
 */
function createQAStructure(questionstr) {
    let answerref = ref([[]])
    let isloadingref = ref(true)
    lyricful_data.value.push({ question: questionstr, answer: answerref, isloading: isloadingref })
    return lyricful_data.value[lyricful_data.value.length - 1]
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
                <div class="lyricful_loading" v-if="data.isloading">
                    <ContentLoader :width="50" :height="20" :speed="2" primaryColor="#eee" secondaryColor="#ccc">
                    </ContentLoader>
                </div>
                <!-- eslint-disable-next-line vue/require-v-for-key, vue/no-unused-vars -->
                <div :class="'lyricful_sentence'" v-for="sentence in data.answer" v-else>
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
    padding: 5px 10px;
    border-radius: 10px;
    width: fit-content;
    border-color: gray;
    border-style: solid;
    border-width: 2px;
}

.lyricful_question {
    padding: 5px 10px;
    text-align: right;
    width: fit-content;
    margin-left: auto;
    border-radius: 10px;
    border-color: #56f9c4;
    border-style: solid;
    border-width: 2px;
    margin-bottom: 5px;
}

.lyricful_part {
    font-size: large;
}

.lyricful_container {
    display: flex;
    flex-direction: column;
    padding-bottom: 15px;
    overflow-y: auto;
    overflow-x: hidden;
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