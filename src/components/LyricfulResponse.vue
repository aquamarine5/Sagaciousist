<script setup>
import SpeechController from '@/speech';
import { ref } from 'vue';

var sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]
var lyricful_data = ref({})

const speech=new SpeechController(lyricful_data)

function addSentence(text){
    console.log(text)
    speech.addSentence(text)
}

function clearAllLyrics(){
    lyricful_data.value={}
    speech.ttsClear()
}

/**
 * still work in progress, see #2
 */
function switchTTSStatus(istts){
    speech.isTTSEnabled=istts
}
defineExpose({
    clearAllLyrics,
    addSentence,
    switchTTSStatus
})
</script>

<template>
    <div class="lyricful_container">
         <!-- eslint-disable-next-line vue/require-v-for-key, vue/no-unused-vars -->
        <div class="lyricful_sentence" v-for="(sentence,ced) in lyricful_data" :key="ced">
            <!-- eslint-disable-next-line vue/require-v-for-key -->
            <span :class="'lyricful_part ' + sentenceStatus[textpart.status]" v-for="textpart in sentence">
                {{ textpart.text }}
            </span>
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
.lyricful_part{
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