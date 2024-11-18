import { ref } from "vue";
import axios from "axios";

export default class SpeechControllerV3 {
    /**
     * @param {import("vue").Ref} refsentence 
     */
    constructor(refsentence) {
        this.refsentence = refsentence
        this._audioContext = null
        this.pendingTTSList = []
        this.isTTSPlaying = false
        this.isMuteDisplaying=false
        this._currentIndex=0
        this.ismute=localStorage.getItem('silent')=='true'
    }
    /**
     * @returns {AudioContext}
     */
    get audioContext() {
        if (!this._audioContext) {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioContext;
    }
    /**
     * @param {*} audiodata
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
                console.log(source)
                source.start();
            }, (error) => {
                console.error('解码音频数据时出错:', error);
            });
        }
        let index=this.showSentence(audiodata)
        playBase64Audio(audiodata.base64str, this.audioContext, () => {
            this.refsentence.value[index].status = 2
            this.ttsNext()
        });
    }
    /**
     * 
     * @param {*} audiodata 
     */
    showSentence(audiodata) {
        if(audiodata.issplit){
            this._currentIndex+=1;
            this.refsentence.value.push(ref([]))
        }
        console.log(this.refsentence.value[this._currentIndex])
        this.refsentence.value[this._currentIndex].push({
            text: audiodata.text,
            status: ref(1)
        })
        return this.refsentence.value.length - 1
    }
    ttsRequest(audiodata) {
        if(audiodata.text=="\n"){
            console.warn("?")
            return
        }
        axios.post("http://localhost:1114/tts", { text: audiodata.text }).then((response) => {
            audiodata.base64str = response.data.audio
            console.log(this)
            if (!this.isTTSPlaying) {
                this.isTTSPlaying = true
                console.log(audiodata)
                if(this.pendingTTSList.length>0&&this.pendingTTSList[0].base64str!=null){
                    this.ttsPlay(this.pendingTTSList.shift())
                }
            }
        })
    }
    ttsNext() {
        console.log(this.pendingTTSList.length)
        if (this.pendingTTSList.length > 0) {
            this.ttsPlay(this.pendingTTSList.shift())
        } else {
            this.isTTSPlaying = false
        }
    }
    ttsClear(){
        this.refsentence.value=[[]]
        this._currentIndex=0
        this.pendingTTSList=[]
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
            text: sentence,
            base64str: null,
            issplit:issplit,
            index:this.pendingTTSList.length
        })
        if(this.ismute){
            this.muteNext()
        }else{
            this.ttsRequest(this.pendingTTSList[this.pendingTTSList.length-1])
        }
    }
    muteNext(){
        if(!this.isMuteDisplaying){
            this.isMuteDisplaying=true
            if(this.pendingTTSList.length>0){
                this.showSentence(this.pendingTTSList.shift())
                setTimeout(()=>{
                    this.muteNext()
                },500)
            }
            else{
                this.isMuteDisplaying=false
            }
        }
    }
}