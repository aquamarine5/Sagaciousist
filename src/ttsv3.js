import { ref } from "vue";
import wnetwork from "./wnetwork";

export default class SpeechControllerV3 {
    /**
     * @param {import("vue").Ref} refsentence 
     */
    constructor(refsentence) {
        this.refsentence = refsentence
        this.audioContext = new AudioContext()
        this.pendingTTSList = []
        this.isTTSPlaying = false
        this._currentIndex=0
        this.ismute=localStorage.getItem('silent')=='true'
    }
    /**
     * @param {{sentence:string, base64str:string}} audiodata
     */
    ttsPlay(audiodata) {
        /**
         * @param {string} base64 
         * @returns {ArrayBuffer}
         */
        function base64ToArrayBuffer(base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        /**
         * @param {string} base64AudioData 
         * @param {AudioContext} audioContext 
         * @param {function} endedCallback 
         */
        function playBase64Audio(base64AudioData, audioContext, endedCallback) {
            const audioBuffer = base64ToArrayBuffer(base64AudioData);
            audioContext.decodeAudioData(audioBuffer, (buffer) => {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.onended = endedCallback;
                source.start(0);
            }, (error) => {
                console.error('解码音频数据时出错:', error);
            });
        }
        let index=this.showSentence(audiodata)
        playBase64Audio(audiodata.base64str, this.audioContext, () => {
            this.refsentence.value[index].status.value = 2
            this.ttsNext()
        });
    }
    /**
     * 
     * @param {*} audiodata 
     */
    showSentence(audiodata) {
        if(audiodata.issplit){
            this._currentIndex++;
            this.refsentence.value.push([])
        }
        this.refsentence.value[this._currentIndex].push({
            sentence: audiodata.sentence,
            status: ref(1)
        })
        return this.refsentence.value.length - 1
    }
    ttsRequest(audiodata) {
        wnetwork.get("/tts", { text: audiodata.sentence }).then((response) => {
            audiodata.base64str = response.data.audio
            if (!this.isTTSPlaying) {
                this.isTTSPlaying = true
                this.ttsPlay(this.pendingTTSList.shift())
            }
        })
    }
    ttsNext() {
        if (this.pendingTTSList.length > 0) {
            this.ttsPlay(this.pendingTTSList.shift())
        } else {
            this.isTTSPlaying = false
        }
    }
    /**
     * @param {boolean} status 
     */
    ttsSetStatus(status) {
        this.ismute=status
    }
    /**
     * @param {string} sentence 
     * @param {boolean} issplit
     */
    addSentence(sentence,issplit=false) {
        this.pendingTTSList.push({
            sentence: sentence,
            base64str: null,
            issplit:issplit,
            index:this.pendingTTSList.length-1
        })
        this.ttsRequest(this.pendingTTSList[this.pendingTTSList.length-1])
    }
}