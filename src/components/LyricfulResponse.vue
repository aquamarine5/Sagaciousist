<script setup>
import SpeechController from '@/speech';
import { ref } from 'vue';

const props = defineProps(["isloading"])
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
        <div class="lyricful_sentence" v-for="(sentence,ced) in lyricful_data"
            :id="ced">
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

.lyricful_container {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 5px;
}

.lyricful_sentence {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
    margin-block: 4px;
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